import Fuse from 'fuse.js'
import type { User } from '../types/index.js'

/**
 * Fuzzy matching configuration for @mentions
 * - threshold: 0.3 means matches need to be at least 70% similar
 * - ignoreLocation: true to match anywhere in the string
 * - includeScore: true to get confidence scores
 */
const FUSE_OPTIONS = {
  keys: ['aliases', 'normalizedName'],
  threshold: 0.3,       // Lower = stricter matching (0 = exact, 1 = match anything)
  ignoreLocation: true, // Don't prefer matches at the start
  includeScore: true,   // Include match score for confidence filtering
  minMatchCharLength: 2 // Minimum characters to match
}

/**
 * Confidence threshold - reject matches with score higher than this
 * Fuse.js scores are 0 (perfect) to 1 (no match)
 * Stricter threshold (0.35) to avoid false positives like "robertro" → "romero"
 */
const CONFIDENCE_THRESHOLD = 0.35

/**
 * Normalize text for matching
 * - Lowercase
 * - Remove accents (María → maria)
 * - Remove special characters
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')                          // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')          // Remove accent marks
    .replace(/[^a-z0-9]/g, '')                // Remove non-alphanumeric
}

/**
 * Prepare users for fuzzy search
 * Creates a searchable index with normalized names and aliases
 */
interface SearchableUser {
  user: User
  aliases: string[]
  normalizedName: string
}

function prepareUsersForSearch(users: User[]): SearchableUser[] {
  return users.map(user => ({
    user,
    aliases: (user.aliases || []).map(a => normalizeText(a)),
    normalizedName: normalizeText(user.name)
  }))
}

/**
 * Match a mention string against group members
 *
 * @param mention - The mention text without @ (e.g., "juan", "maría", "jua")
 * @param groupMembers - Array of User objects to match against
 * @returns The matched User or null if no confident match found
 */
export function matchMention(mention: string, groupMembers: User[]): User | null {
  if (!mention || !groupMembers.length) {
    return null
  }

  const normalizedMention = normalizeText(mention)

  if (normalizedMention.length < 2) {
    return null
  }

  // Prepare searchable data
  const searchableUsers = prepareUsersForSearch(groupMembers)

  // Create Fuse instance
  const fuse = new Fuse(searchableUsers, FUSE_OPTIONS)

  // Search for the mention
  const results = fuse.search(normalizedMention)

  if (results.length === 0) {
    console.log(`[Mention] "${mention}" → no matches found`)
    return null
  }

  // Get the best match
  const bestMatch = results[0]

  // Log the match attempt for debugging
  console.log(`[Mention] "${mention}" → best match: "${bestMatch.item.user.name}" (score: ${bestMatch.score?.toFixed(3)}, threshold: ${CONFIDENCE_THRESHOLD})`)

  // Check confidence (score is 0 for perfect match, higher = worse)
  if (bestMatch.score !== undefined && bestMatch.score > CONFIDENCE_THRESHOLD) {
    console.log(`[Mention] "${mention}" → REJECTED (score ${bestMatch.score?.toFixed(3)} > threshold ${CONFIDENCE_THRESHOLD})`)
    return null
  }

  console.log(`[Mention] "${mention}" → MATCHED to "${bestMatch.item.user.name}"`)
  return bestMatch.item.user
}

/**
 * Match multiple mentions from a message
 *
 * @param mentions - Array of mention strings (without @)
 * @param groupMembers - Array of User objects to match against
 * @returns Object with matched user IDs and any unmatched mentions
 */
export interface MentionMatchResult {
  matchedUserIds: string[]
  unmatchedMentions: string[]
}

export function matchMentions(mentions: string[], groupMembers: User[]): MentionMatchResult {
  const matchedUserIds: string[] = []
  const unmatchedMentions: string[] = []
  const matchedIds = new Set<string>() // Prevent duplicate matches

  for (const mention of mentions) {
    const matchedUser = matchMention(mention, groupMembers)

    if (matchedUser && !matchedIds.has(matchedUser.id)) {
      matchedUserIds.push(matchedUser.id)
      matchedIds.add(matchedUser.id)
    } else if (!matchedUser) {
      unmatchedMentions.push(mention)
    }
    // If already matched, silently skip (don't add to unmatched)
  }

  return {
    matchedUserIds,
    unmatchedMentions
  }
}

/**
 * Get user IDs from mentions for expense splitting
 * This is the main function to call from the WhatsApp handler
 *
 * @param mentions - Array of mention strings extracted from message (without @)
 * @param groupMembers - Array of User objects in the group
 * @returns Array of user IDs for splitting (empty if no valid matches)
 */
export function resolveMentionsToUserIds(mentions: string[], groupMembers: User[]): string[] {
  if (!mentions.length || !groupMembers.length) {
    return []
  }

  const result = matchMentions(mentions, groupMembers)

  // Log unmatched mentions for debugging (but don't fail)
  if (result.unmatchedMentions.length > 0) {
    console.warn('Unmatched mentions:', result.unmatchedMentions)
  }

  return result.matchedUserIds
}

/**
 * Result of resolving mentions with full tracking
 */
export interface MentionResolutionResult {
  resolvedUserIds: string[]     // User IDs that were successfully matched
  resolvedNames: string[]       // Display names of matched users
  unresolvedNames: string[]     // Original names that couldn't be matched
}

/**
 * Resolve mentions to user IDs WITH tracking of unresolved names
 * This is used for AI expense confirmation where we need to show warnings
 *
 * @param mentions - Array of mention strings extracted from message (without @)
 * @param groupMembers - Array of User objects in the group
 * @returns Object with resolved IDs, resolved names, and unresolved names
 */
export function resolveMentionsWithTracking(
  mentions: string[],
  groupMembers: User[]
): MentionResolutionResult {
  if (!mentions.length || !groupMembers.length) {
    return {
      resolvedUserIds: [],
      resolvedNames: [],
      unresolvedNames: mentions  // All mentions are unresolved if no group members
    }
  }

  const resolvedUserIds: string[] = []
  const resolvedNames: string[] = []
  const unresolvedNames: string[] = []
  const matchedIds = new Set<string>()  // Prevent duplicates

  for (const mention of mentions) {
    const matchedUser = matchMention(mention, groupMembers)

    if (matchedUser && !matchedIds.has(matchedUser.id)) {
      resolvedUserIds.push(matchedUser.id)
      resolvedNames.push(matchedUser.name)
      matchedIds.add(matchedUser.id)
    } else if (!matchedUser) {
      unresolvedNames.push(mention)
    }
    // If already matched (duplicate), silently skip
  }

  return {
    resolvedUserIds,
    resolvedNames,
    unresolvedNames
  }
}
