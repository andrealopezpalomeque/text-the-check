// Payment information for settlements
export interface PaymentInfo {
  cbu: string | null           // CBU (22 digit Argentine bank number)
  cvu: string | null           // CVU (22 digit virtual account number)
  alias: string | null         // Bank alias (e.g., "juan.perez.mp")
  mercadoPago: string | null   // Mercado Pago alias or link
  bankName: string | null      // Bank name
}

// The 11 Travelers
export interface User {
  id: string              // unique string (auto-generated)
  name: string            // Display name (e.g., "Pipi López Palomeque")
  phone: string           // Format: +5493794702813 (Key for WhatsApp identification)
  email: string | null    // Nullable, populated via Google Auth
  authUid?: string        // Firebase Auth UID (for security rules)
  aliases: string[]       // For @mention matching (lowercase, e.g., ["pipi"])
  paymentInfo?: PaymentInfo // Payment details for settlements
  activeGroupId?: string | null  // Currently selected group for WhatsApp expense logging
  createdAt?: Date
  // Legacy field for backwards compatibility
  phoneNumber?: string
}

// Group for organizing expenses
export interface Group {
  id: string
  name: string
  members: string[]       // Array of user IDs
  createdBy: string       // User ID of creator
  createdAt?: Date
  simplifySettlements?: boolean  // Group-level setting for settlement simplification
}

// The Expense Record
export interface Expense {
  id: string
  userId: string         // Who paid? (Firestore user ID)
  authUid?: string       // Firebase Auth UID (for security rules)
  userName: string       // Denormalized name for easier display
  amount: number         // Always in base currency (ARS)
  originalAmount?: number // Amount entered by user (if different currency)
  originalCurrency?: string // Currency entered by user (e.g., BRL)
  originalInput: string  // The raw text: "50 beers at beach"
  description: string    // Cleaned text: "beers at beach"
  category: ExpenseCategory
  splitAmong?: string[]  // List of user IDs for splitting, empty means everyone
  groupId?: string       // ID of the group this expense belongs to
  timestamp: Date        // Firestore Timestamp
}

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'general'

// For the UI "Who Owes Who" calculation
export interface Balance {
  userId: string
  paid: number   // Total amount this person put into the pot
  share: number  // How much they SHOULD have paid (Total / 11)
  net: number    // paid - share (Positive = owed money, Negative = owes money)
}

// Settlement recommendation (who pays whom)
export interface Settlement {
  fromUserId: string   // Who should pay (debtor)
  toUserId: string     // Who should receive (creditor)
  amount: number       // Amount to transfer
}

// Category breakdown for dashboard
export interface CategoryBreakdown {
  category: ExpenseCategory
  total: number
  count: number
}

// Firestore document with converter support
export interface FirestoreDocument {
  id: string
  createdAt?: Date
  updatedAt?: Date
}

// Payment record (for settling debts between users)
export interface Payment {
  id: string
  groupId: string
  fromUserId: string      // who paid (owes less after this)
  toUserId: string        // who received (is owed less after this)
  amount: number          // always in ARS
  recordedBy: string      // user ID of who recorded the payment
  note?: string           // optional note
  createdAt: Date
}
