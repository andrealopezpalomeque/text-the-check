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
  Timestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import type { Group } from '~/types'

interface GroupState {
  groups: Group[]
  selectedGroupId: string | null
  currentUserId: string | null  // Track current user for Firestore updates
  loading: boolean
  error: string | null
  groupUnsubscribe: Unsubscribe | null  // Real-time listener for selected group
}

const STORAGE_KEY = 'text-the-check-selected-group'

export const useGroupStore = defineStore('group', {
  state: (): GroupState => ({
    groups: [],
    selectedGroupId: null,
    currentUserId: null,
    loading: false,
    error: null,
    groupUnsubscribe: null
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
    }
  }
})
