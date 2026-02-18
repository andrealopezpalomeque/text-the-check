# Firestore Security Rules - Implementation Guide

## Overview

This document explains the Firestore security rules implemented for Text The Check and how to deploy them.

## Security Model

### Architecture
- **Backend (WhatsApp Bot)**: Uses Firebase Admin SDK → Bypasses all security rules (full access)
- **Frontend (Nuxt.js Dashboard)**: Uses Firebase Web SDK → Subject to security rules

### Access Control

#### Users Collection (`/users/{userId}`)
- **READ**: All authenticated users (needed for @mentions and display names)
- **CREATE**: Users can only create their own profile
- **UPDATE**: Users can only update their own profile (cannot change phone number)
- **DELETE**: Forbidden (should be handled by admin/backend)

#### Expenses Collection (`/expenses/{expenseId}`)
- **READ**: All authenticated users (collaborative expense tracking)
- **CREATE**: Users can create expenses, but only with their own `userId`
- **UPDATE**: Users can only update their own expenses (ownership verified via user document lookup)
- **DELETE**: Users can only delete their own expenses (ownership verified via user document lookup)

> **Note:** Ownership is verified by looking up the creator's `authUid` from their user document. This allows managing expenses created via WhatsApp (which don't have `authUid` on the expense itself) from the Dashboard.

#### Payments Collection (`/payments/{paymentId}`)
- **READ**: All authenticated users (collaborative tracking)
- **CREATE**: Users can create payments with their own `authUid`
- **UPDATE**: Only the person who recorded the payment can update it
- **DELETE**: Either party involved (fromUserId OR toUserId) can delete the payment

### Validation Rules

#### Expense Validation
- ✅ `userId`: Must match authenticated user
- ✅ `amount`: Must be positive number
- ✅ `description`: 1-500 characters
- ✅ `category`: Must be one of: food, transport, accommodation, entertainment, general
- ✅ `timestamp`: Required
- ✅ `splitAmong`: Optional array
- ✅ `originalAmount`, `originalCurrency`: Optional fields

#### Payment Validation
- ✅ `groupId`: Required string
- ✅ `fromUserId`: Required string (who paid)
- ✅ `toUserId`: Required string (who received), must be different from `fromUserId`
- ✅ `amount`: Must be positive number
- ✅ `recordedBy`: Required string (who recorded the payment)
- ✅ `authUid`: Required string (Firebase Auth UID)
- ✅ `createdAt`: Required timestamp
- ✅ `note`: Optional string

#### User Validation
- ✅ `name`: 1-100 characters, required
- ✅ `phoneNumber`: 10-20 characters, required, immutable after creation
- ✅ `avatar`: Optional string

## Deployment Instructions

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the project (if not already done):
```bash
firebase init
```
- Select: **Firestore: Configure security rules and indexes files**
- Use existing `firestore.rules` and `firestore.indexes.json`

### Deploy Security Rules

Deploy the rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

To deploy both rules and indexes:

```bash
firebase deploy --only firestore
```

### Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules are deployed and showing the correct timestamp

## Testing Security Rules

### Using Firebase Emulator (Recommended)

1. Start the Firestore emulator:
```bash
firebase emulators:start --only firestore
```

2. Update your client Firebase config to use emulator:
```javascript
import { connectFirestoreEmulator } from 'firebase/firestore'

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

3. Run test scenarios:
```bash
# Install testing dependencies
npm install --save-dev @firebase/rules-unit-testing

# Run tests (create test file in tests/firestore.rules.test.js)
npm test
```

### Manual Testing in Console

1. Go to Firebase Console → Firestore Database → Rules
2. Click **Rules playground**
3. Test different scenarios:
   - Authenticated read/write
   - Unauthenticated access (should fail)
   - Cross-user access (should fail for writes)

## Frontend Authentication Setup

### Important: Authentication Required

The Firestore security rules require **Firebase Authentication**. Without it, the frontend will not be able to access Firestore.

### Setup Options

#### Option 1: Anonymous Authentication (Quick Start)

Good for MVP/testing, allows users without accounts:

```javascript
// composables/useFirebase.ts
import { signInAnonymously } from 'firebase/auth'

export const useFirebase = () => {
  const auth = getAuth()

  // Auto sign-in anonymously
  onMounted(async () => {
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }
  })

  return { auth, db }
}
```

Enable in Firebase Console:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Anonymous**

#### Option 2: Phone Authentication (Recommended for Production)

Since users are already whitelisted by phone number:

```javascript
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'

// Implement phone verification flow
// Users verify with their WhatsApp phone number
```

Enable in Firebase Console:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Phone**
3. Configure authorized domains

#### Option 3: Custom Token Authentication (Advanced)

Backend generates custom tokens for WhatsApp users:

```javascript
// Server (after WhatsApp verification)
import admin from 'firebase-admin'

const customToken = await admin.auth().createCustomToken(userId)
// Send token to client

// Client
import { signInWithCustomToken } from 'firebase/auth'
await signInWithCustomToken(auth, customToken)
```

## Security Checklist

Before going to production:

- [ ] Deploy Firestore security rules
- [ ] Enable Firebase Authentication (choose method above)
- [ ] Update client code to authenticate users
- [ ] Test all access patterns in emulator
- [ ] Verify WhatsApp bot still works (uses Admin SDK, bypasses rules)
- [ ] Test frontend read/write with authenticated users
- [ ] Test that unauthenticated users are blocked
- [ ] Monitor Firebase Console for permission errors

## Troubleshooting

### Common Issues

**Error: Missing or insufficient permissions**
- Cause: User is not authenticated
- Solution: Implement one of the authentication methods above

**Error: Permission denied on user creation**
- Cause: Trying to create user with different userId than auth.uid
- Solution: Ensure `userId` in document matches `request.auth.uid`

**Backend WhatsApp bot failing**
- Cause: Admin SDK should NOT be affected by security rules
- Solution: Verify Firebase Admin is initialized correctly with service account

**Cannot read expenses in frontend**
- Cause: User not authenticated OR rules not deployed
- Solution: Check authentication status and verify rules deployment

## Monitoring

Monitor security rule activity:

1. **Firebase Console** → **Firestore** → **Usage**
2. Check for:
   - Permission denied errors (high rate = potential issue)
   - Read/write patterns
   - Query performance

## Next Steps

1. Deploy the security rules: `firebase deploy --only firestore:rules`
2. Implement authentication in the Nuxt.js client (see Options above)
3. Test in development with Firebase emulator
4. Update docs/project-plan.md to mark "Firestore security rules" as complete ✅

## Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
