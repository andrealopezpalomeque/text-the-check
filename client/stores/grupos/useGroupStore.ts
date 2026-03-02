import { defineStore } from 'pinia'
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import type { Group, GhostMember } from '~/types'

interface GroupState {
  groups: Group[]
  selectedGroupId: string | null
  currentUserId: string | null  // Track current user for Firestore updates
  loading: boolean
  error: string | null
  groupUnsubscribe: Unsubscribe | null  // Real-time listener for selected group
  showGroupList: boolean  // When true, show groups list instead of dashboard
}

const STORAGE_KEY = 'text-the-check-selected-group'

export const useGroupStore = defineStore('group', {
  state: (): GroupState => ({
    groups: [],
    selectedGroupId: null,
    currentUserId: null,
    loading: false,
    error: null,
    groupUnsubscribe: null,
    showGroupList: true
  }),

  getters: {
    /**
     * Get the currently selected group
     */
    selectedGroup: (state): Group | null => {
      if (!state.selectedGroupId) return null
      return state.groups.find(g => g.id === state.selectedGroupId) || null
    },

    /**
     * Get members of the selected group
     */
    selectedGroupMembers: (state): string[] => {
      if (!state.selectedGroupId) return []
      const group = state.groups.find(g => g.id === state.selectedGroupId)
      return group?.members || []
    },

    /**
     * Check if user has multiple groups
     */
    hasMultipleGroups: (state): boolean => state.groups.length > 1,

    /**
     * Get ghost members of the selected group
     */
    selectedGroupGhostMembers(): GhostMember[] {
      return this.selectedGroup?.ghostMembers || []
    },

    /**
     * Get the simplifySettlements setting for the selected group
     */
    simplifySettlements(): boolean {
      return this.selectedGroup?.simplifySettlements || false
    }
  },

  actions: {
    /**
     * Fetch groups for the current user
     * @param userId - The Firestore user ID
     * @param activeGroupId - The user's activeGroupId from Firestore (optional)
     */
    async fetchGroupsForUser(userId: string, activeGroupId?: string | null) {
      const { db } = useFirebase()
      this.loading = true
      this.error = null
      this.currentUserId = userId

      try {
        const groupsRef = collection(db, 'ttc_group')
        // Query groups where the user is a member
        const q = query(groupsRef, where('members', 'array-contains', userId))
        const snapshot = await getDocs(q)

        this.groups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Group[]

        // Select group based on priority: activeGroupId > localStorage > first group
        this.restoreOrSelectDefaultGroup(activeGroupId)
      } catch (err: any) {
        console.error('Error fetching groups:', err)
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    /**
     * Restore selected group from activeGroupId, localStorage, or select first available
     * Priority: activeGroupId (from Firestore) > localStorage > first group
     */
    restoreOrSelectDefaultGroup(activeGroupId?: string | null) {
      if (this.groups.length === 0) {
        this.selectedGroupId = null
        return
      }

      let groupIdToSelect: string | null = null

      // 1. Try to use activeGroupId from Firestore (highest priority)
      if (activeGroupId && this.groups.some(g => g.id === activeGroupId)) {
        groupIdToSelect = activeGroupId
        // Also update localStorage to keep in sync
        if (import.meta.client) {
          localStorage.setItem(STORAGE_KEY, activeGroupId)
        }
      }
      // 2. Try to restore from localStorage
      else if (import.meta.client) {
        const savedGroupId = localStorage.getItem(STORAGE_KEY)
        if (savedGroupId && this.groups.some(g => g.id === savedGroupId)) {
          groupIdToSelect = savedGroupId
        }
      }

      // 3. Default to first group
      if (!groupIdToSelect) {
        groupIdToSelect = this.groups[0]?.id || null
      }

      this.selectedGroupId = groupIdToSelect

      // Subscribe to real-time updates for the selected group
      if (groupIdToSelect) {
        this.subscribeToSelectedGroup(groupIdToSelect)
      }
    },

    /**
     * Select a group and sync to Firestore
     */
    async selectGroup(groupId: string) {
      if (!this.groups.some(g => g.id === groupId)) {
        console.warn('Attempted to select non-existent group:', groupId)
        return
      }

      this.selectedGroupId = groupId

      // Subscribe to real-time updates for this group
      this.subscribeToSelectedGroup(groupId)

      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, groupId)
      }

      // Sync activeGroupId to Firestore
      if (this.currentUserId) {
        try {
          const { db } = useFirebase()
          const userRef = doc(db, 'ttc_user', this.currentUserId)
          await updateDoc(userRef, { activeGroupId: groupId })
        } catch (err) {
          console.error('Error syncing activeGroupId to Firestore:', err)
          // Don't throw - local state is updated, Firestore sync failed but user can still use app
        }
      }
    },

    /**
     * Enter a group: select it and switch to dashboard view
     */
    async enterGroup(groupId: string) {
      await this.selectGroup(groupId)
      this.showGroupList = false
    },

    /**
     * Go back to the groups list view
     */
    backToGroupList() {
      this.showGroupList = true
    },

    /**
     * Create a new group and select it
     */
    async createGroup(name: string, userId: string) {
      const { db } = useFirebase()

      const groupRef = doc(collection(db, 'ttc_group'))
      await setDoc(groupRef, {
        id: groupRef.id,
        name,
        members: [userId],
        createdBy: userId,
        createdAt: Timestamp.now()
      })

      this.currentUserId = userId
      await this.fetchGroupsForUser(userId)
      await this.selectGroup(groupRef.id)
    },

    /**
     * Join an existing group by adding the user to its members
     */
    async joinGroup(groupId: string, userId: string) {
      const { db } = useFirebase()

      const groupRef = doc(db, 'ttc_group', groupId)
      const groupSnap = await getDoc(groupRef)
      if (!groupSnap.exists()) throw new Error('Grupo no encontrado')

      const groupData = groupSnap.data()
      if (groupData.members?.includes(userId)) {
        // Already a member, just fetch and select
        this.currentUserId = userId
        await this.fetchGroupsForUser(userId)
        await this.selectGroup(groupId)
        return
      }

      await updateDoc(groupRef, {
        members: arrayUnion(userId)
      })

      this.currentUserId = userId
      await this.fetchGroupsForUser(userId)
      await this.selectGroup(groupId)
    },

    /**
     * Clear group state (on logout)
     */
    clearGroups() {
      if (this.groupUnsubscribe) {
        this.groupUnsubscribe()
        this.groupUnsubscribe = null
      }
      this.groups = []
      this.selectedGroupId = null
      this.currentUserId = null
      this.showGroupList = true
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    /**
     * Subscribe to real-time updates for the selected group
     */
    subscribeToSelectedGroup(groupId: string) {
      const { db } = useFirebase()

      // Unsubscribe from previous listener
      if (this.groupUnsubscribe) {
        this.groupUnsubscribe()
      }

      const groupRef = doc(db, 'ttc_group', groupId)
      this.groupUnsubscribe = onSnapshot(groupRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          const updatedGroup = {
            id: snapshot.id,
            ...data
          } as Group

          // Update the group in the groups array
          const index = this.groups.findIndex(g => g.id === groupId)
          if (index !== -1) {
            this.groups[index] = updatedGroup
          }
        }
      })
    },

    /**
     * Toggle the simplifySettlements setting for the current group
     */
    async toggleSimplifySettlements() {
      const { db } = useFirebase()

      if (!this.selectedGroupId) return

      try {
        const groupRef = doc(db, 'ttc_group', this.selectedGroupId)
        const currentValue = this.selectedGroup?.simplifySettlements || false

        await updateDoc(groupRef, {
          simplifySettlements: !currentValue
        })

        // Note: Local state will be updated via the onSnapshot listener
      } catch (error) {
        console.error('Error toggling simplify settlements:', error)
        throw error
      }
    },

    /**
     * Add a ghost member to the selected group (by name only, no account required)
     */
    async addGhostMember(name: string) {
      const { db } = useFirebase()

      if (!this.selectedGroupId || !this.currentUserId) {
        throw new Error('No hay grupo seleccionado')
      }

      const trimmedName = name.trim()
      if (!trimmedName) throw new Error('El nombre no puede estar vacío')

      // Check for duplicate names among existing ghost members
      const existingGhosts = this.selectedGroup?.ghostMembers || []
      if (existingGhosts.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error('Ya existe un miembro con ese nombre')
      }

      const ghost: GhostMember = {
        id: `ghost_${crypto.randomUUID()}`,
        name: trimmedName,
        createdBy: this.currentUserId
      }

      const groupRef = doc(db, 'ttc_group', this.selectedGroupId)
      await updateDoc(groupRef, {
        ghostMembers: arrayUnion(ghost)
      })

      // Local state will be updated via onSnapshot listener
    },

    /**
     * Remove a ghost member from the selected group
     */
    async removeGhostMember(ghostId: string) {
      const { db } = useFirebase()

      if (!this.selectedGroupId) throw new Error('No hay grupo seleccionado')

      const ghost = this.selectedGroupGhostMembers.find(g => g.id === ghostId)
      if (!ghost) throw new Error('Miembro fantasma no encontrado')

      const groupRef = doc(db, 'ttc_group', this.selectedGroupId)
      await updateDoc(groupRef, {
        ghostMembers: arrayRemove(ghost)
      })
    },

    /**
     * Claim a ghost member: merge their identity with a real user account.
     * Replaces the ghost ID with the real user ID in all expenses and payments,
     * removes the ghost from the group, and adds the real user as a member.
     */
    async claimGhostMember(groupId: string, ghostId: string, realUserId: string) {
      const { db } = useFirebase()

      const groupRef = doc(db, 'ttc_group', groupId)
      const groupSnap = await getDoc(groupRef)
      if (!groupSnap.exists()) throw new Error('Grupo no encontrado')

      const groupData = groupSnap.data()
      const ghost = groupData.ghostMembers?.find((g: GhostMember) => g.id === ghostId)
      if (!ghost) throw new Error('Miembro fantasma no encontrado')

      // Collect all expenses and payments that reference this ghost ID
      const expensesRef = collection(db, 'ttc_expense')
      const expQ = query(expensesRef, where('groupId', '==', groupId))
      const expSnap = await getDocs(expQ)

      const paymentsRef = collection(db, 'ttc_payment')
      const payQ = query(paymentsRef, where('groupId', '==', groupId))
      const paySnap = await getDocs(payQ)

      // Batch write: update all references atomically
      const batch = writeBatch(db)

      // 1. Update group: remove ghost, add real member
      const updatedGhosts = (groupData.ghostMembers || []).filter(
        (g: GhostMember) => g.id !== ghostId
      )
      batch.update(groupRef, {
        ghostMembers: updatedGhosts,
        members: arrayUnion(realUserId)
      })

      // 2. Update expenses referencing the ghost ID
      expSnap.docs.forEach(expDoc => {
        const data = expDoc.data()
        let needsUpdate = false
        const updates: Record<string, any> = {}

        // Replace in splitAmong array
        if (data.splitAmong?.includes(ghostId)) {
          updates.splitAmong = data.splitAmong.map(
            (id: string) => id === ghostId ? realUserId : id
          )
          needsUpdate = true
        }

        // Replace payer (unlikely but possible if logged on behalf)
        if (data.userId === ghostId) {
          updates.userId = realUserId
          needsUpdate = true
        }

        if (needsUpdate) {
          batch.update(doc(db, 'ttc_expense', expDoc.id), updates)
        }
      })

      // 3. Update payments referencing the ghost ID
      paySnap.docs.forEach(payDoc => {
        const data = payDoc.data()
        let needsUpdate = false
        const updates: Record<string, any> = {}

        if (data.fromUserId === ghostId) {
          updates.fromUserId = realUserId
          needsUpdate = true
        }
        if (data.toUserId === ghostId) {
          updates.toUserId = realUserId
          needsUpdate = true
        }

        if (needsUpdate) {
          batch.update(doc(db, 'ttc_payment', payDoc.id), updates)
        }
      })

      await batch.commit()

      // Refresh local state
      this.currentUserId = realUserId
      await this.fetchGroupsForUser(realUserId)
      await this.selectGroup(groupId)
    }
  }
})
