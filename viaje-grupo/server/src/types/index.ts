// Expense types (matches client types)
export interface Expense {
  id?: string
  userId: string
  userName: string
  amount: number
  originalInput: string
  originalAmount?: number
  originalCurrency?: string
  description: string
  category: ExpenseCategory
  splitAmong?: string[]       // List of user IDs or names for splitting
  groupId?: string            // ID of the group this expense belongs to
  timestamp: Date
}

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'general'

// User types
export interface User {
  id: string
  name: string
  phone: string           // with country code (e.g., +5493794702813)
  email: string | null    // nullable, populated via Google Auth
  aliases: string[]       // for @mention matching (lowercase)
  activeGroupId?: string | null  // currently selected group for WhatsApp expense logging
  createdAt?: Date
  // Legacy field for backwards compatibility during migration
  phoneNumber?: string
}

// Group types
export interface Group {
  id: string
  name: string
  members: string[]       // array of user IDs
  createdBy: string       // user ID of creator
  createdAt?: Date
}

// WhatsApp webhook types
export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text: {
    body: string
  }
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: WhatsAppMessage[]
      }
      field: string
    }>
  }>
}

// Parsed expense from message
export interface ParsedExpense {
  amount: number
  description: string
  category?: ExpenseCategory
  splitAmong: string[] // List of names, empty means everyone
  needsReview: boolean
}

// Payment record (for settling debts between users)
export interface Payment {
  id?: string
  groupId: string
  fromUserId: string      // who paid (owes less after this)
  toUserId: string        // who received (is owed less after this)
  amount: number          // always in ARS
  recordedBy: string      // user ID of who sent the WhatsApp message
  note?: string           // optional note
  createdAt: Date
}

// Parsed payment from message
export interface ParsedPayment {
  type: 'paid' | 'received'
  amount: number
  mention: string // The @mention (without @)
}
