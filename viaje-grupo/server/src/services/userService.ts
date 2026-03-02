import { db } from '../config/firebase.js'
import type { User, Group } from '../types/index.js'

const normalizePhone = (phoneNumber: string): string => {
  // WhatsApp Cloud API typically sends numbers without '+', while configs often include it.
  // Compare using digits-only so '+54911...' and '54911...' match.
  return phoneNumber.replace(/[^\d]/g, '')
}

/**
 * Get user by phone number
 * Supports both new 'phone' field and legacy 'phoneNumber' field
 */
export const getUserByPhone = async (phoneNumber: string): Promise<User | null> => {
  try {
    const usersRef = db.collection('ttc_user')

    const digitsOnly = normalizePhone(phoneNumber)
    const candidates = [
      phoneNumber.replace(/[\s-]/g, ''),
      digitsOnly,
      `+${digitsOnly}`,
    ].filter(Boolean)

    const uniqueCandidates = [...new Set(candidates)]

    // Try new 'phone' field first
    for (const candidate of uniqueCandidates) {
      const snapshot = await usersRef.where('phone', '==', candidate).limit(1).get()
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return {
          id: doc.id,
          ...doc.data()
        } as User
      }
    }

    // Fallback to legacy 'phoneNumber' field for backwards compatibility
    for (const candidate of uniqueCandidates) {
      const snapshot = await usersRef.where('phoneNumber', '==', candidate).limit(1).get()
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          phone: data.phoneNumber, // Map legacy field to new field
          email: data.email || null,
          aliases: data.aliases || [],
          ...data
        } as User
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user by phone:', error)
    return null
  }
}

/**
 * Get user by email address
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = db.collection('ttc_user')
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as User
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

/**
 * Update user's email field
 */
export const updateUserEmail = async (userId: string, email: string): Promise<boolean> => {
  try {
    await db.collection('ttc_user').doc(userId).update({
      email: email.toLowerCase()
    })
    return true
  } catch (error) {
    console.error('Error updating user email:', error)
    return false
  }
}

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const doc = await db.collection('ttc_user').doc(userId).get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data()
    } as User
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Check if phone number is authorized
 */
export const isAuthorizedPhone = (phoneNumber: string): boolean => {
  const allowedPhones = process.env.ALLOWED_PHONE_NUMBERS?.split(',') || []
  const normalized = normalizePhone(phoneNumber)

  return allowedPhones.some(allowed =>
    normalizePhone(allowed) === normalized
  )
}

/**
 * Mark user as welcomed (first WhatsApp interaction)
 * Sets welcomedAt timestamp to track that user received the welcome message
 */
export const markUserAsWelcomed = async (userId: string): Promise<boolean> => {
  try {
    await db.collection('ttc_user').doc(userId).update({
      welcomedAt: new Date()
    })
    return true
  } catch (error) {
    console.error('Error marking user as welcomed:', error)
    return false
  }
}

/**
 * Get group by ID
 */
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const doc = await db.collection('ttc_group').doc(groupId).get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data()
    } as Group
  } catch (error) {
    console.error('Error getting group by ID:', error)
    return null
  }
}

/**
 * Get all groups where user is a member
 */
export const getAllGroupsByUserId = async (userId: string): Promise<Group[]> => {
  try {
    const groupsRef = db.collection('ttc_group')
    const snapshot = await groupsRef.where('members', 'array-contains', userId).get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[]
  } catch (error) {
    console.error('Error getting all groups by user ID:', error)
    return []
  }
}

/**
 * Update user's active group ID
 */
export const updateUserActiveGroup = async (userId: string, groupId: string | null): Promise<boolean> => {
  try {
    await db.collection('ttc_user').doc(userId).update({
      activeGroupId: groupId
    })
    return true
  } catch (error) {
    console.error('Error updating user active group:', error)
    return false
  }
}

/**
 * Get group by user ID
 * Returns the user's active group if set and valid, otherwise the first group found
 *
 * Multi-group support: Users can select their active group via:
 *   - WhatsApp command: /grupo to list and select
 *   - Dashboard group selector (syncs activeGroupId)
 */
export const getGroupByUserId = async (userId: string): Promise<Group | null> => {
  try {
    // First, check if user has an activeGroupId
    const user = await getUserById(userId)

    if (user?.activeGroupId) {
      // Verify the user is still a member of this group
      const activeGroup = await getGroupById(user.activeGroupId)

      if (activeGroup && activeGroup.members.includes(userId)) {
        return activeGroup
      }

      // activeGroupId is invalid (user no longer in group), clear it
      await updateUserActiveGroup(userId, null)
    }

    // Fall back to first group found
    const groupsRef = db.collection('ttc_group')
    const snapshot = await groupsRef.where('members', 'array-contains', userId).limit(1).get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as Group
  } catch (error) {
    console.error('Error getting group by user ID:', error)
    return null
  }
}

/**
 * Get all members of a group
 * Returns an array of User objects for all members in the group
 */
export const getGroupMembers = async (groupId: string): Promise<User[]> => {
  try {
    // First get the group to get member IDs
    const groupDoc = await db.collection('ttc_group').doc(groupId).get()

    if (!groupDoc.exists) {
      return []
    }

    const groupData = groupDoc.data() as Group
    const memberIds = groupData.members || []

    if (memberIds.length === 0) {
      return []
    }

    // Fetch all members
    const usersRef = db.collection('ttc_user')
    const members: User[] = []

    // Firestore 'in' queries are limited to 10 items, so we may need multiple queries
    const chunks = []
    for (let i = 0; i < memberIds.length; i += 10) {
      chunks.push(memberIds.slice(i, i + 10))
    }

    for (const chunk of chunks) {
      // Use documentId() for querying by ID
      const snapshot = await usersRef.where('__name__', 'in', chunk).get()
      snapshot.docs.forEach(doc => {
        members.push({
          id: doc.id,
          ...doc.data()
        } as User)
      })
    }

    // Append ghost members if present
    const ghostMembers = (groupDoc.data() as any).ghostMembers as Array<{ id: string; name: string; createdBy: string }> | undefined
    if (ghostMembers && ghostMembers.length > 0) {
      for (const ghost of ghostMembers) {
        members.push({
          id: ghost.id,
          name: ghost.name,
          phone: '',
          email: null,
          aliases: [ghost.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')],
          isGhost: true
        })
      }
    }

    return members
  } catch (error) {
    console.error('Error getting group members:', error)
    return []
  }
}

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await db.collection('ttc_user').get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[]
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}