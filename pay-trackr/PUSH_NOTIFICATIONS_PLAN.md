# Push Notification System - Implementation Guide

We'll implement this step by step, one at a time.

---

## Step 1: Firebase Console Setup
**Status**: ✅ Complete

Generate the VAPID key needed for web push notifications.

**Actions**:
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair"
4. Copy the public key (this is your VAPID key)
5. Add to `/web/.env`:
   ```
   FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

**Verification**: VAPID key is saved in .env file

---

## Step 2: Create Firebase Messaging Service Worker
**Status**: ✅ Complete

This file handles notifications when the app is in background/closed.

**File**: `/web/public/firebase-messaging-sw.js`

**What it does**:
- Receives push messages from FCM servers
- Displays system notification
- Handles notification clicks → opens app

**Verification**: File exists in public folder

---

## Step 3: Add FCM to Firebase Utils
**Status**: ✅ Complete

Extend `/web/utils/firebase.ts` with messaging functions.

**New functions**:
- `getMessagingInstance()` - Get FCM instance
- `requestFCMToken(vapidKey)` - Request permission + get token
- `onForegroundMessage(callback)` - Listen for messages when app is open

**Verification**: Can import and call `requestFCMToken()`

---

## Step 4: Create FCM Tokens Collection Schema
**Status**: ✅ Complete

Create Firestore schema for storing FCM tokens.

**File**: `/web/utils/odm/schemas/fcmTokenSchema.ts`

**Fields**:
```typescript
{
  userId: string              // Firebase Auth UID
  token: string               // The FCM token
  notificationsEnabled: bool  // User preference per device
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Methods**:
- `registerToken(token)` - Add new token for user
- `deleteToken(token)` - Remove specific token
- `deleteAllForUser()` - Remove all user tokens (logout)
- `toggleNotifications(tokenId, enabled)` - Enable/disable per device

**Verification**: Schema file created following existing patterns

---

## Step 5: Create Notification Store (FCM Token Management)
**Status**: ✅ Complete

Pinia store for managing FCM tokens.

**File**: `/web/stores/notification.ts`

**State**:
- `currentToken: string | null`
- `isRegistered: boolean`
- `notificationsEnabled: boolean`
- `tokens: FcmToken[]`

**Getters**:
- `isSupported` - Browser supports notifications
- `permissionStatus` - Current permission state
- `canRequestPermission` - Can we ask for permission
- `isPermissionDenied` - Was permission denied

**Actions**:
- `registerToken()` - Request permission, get token, save to Firestore
- `unregisterToken()` - Remove token from Firestore
- `toggleNotifications()` - Enable/disable per device
- `setupForegroundListener()` - Listen for messages when app is open
- `deleteAllTokens()` - Remove all tokens (logout)

**Verification**: Store can be imported and used

---

## Step 6: Update NotificationManager Component
**Status**: ✅ Complete

Modified `/web/components/NotificationManager.vue` to use FCM.

**Changes**:
- Uses `useNotificationStore` instead of old composable
- On "Enable" click: calls `notificationStore.registerToken()`
- Shows loading state while registering
- Toast notifications for success/error
- All text in Spanish
- Auto-registers token if permission was already granted

**Verification**: Clicking "Activar" saves token to Firestore

---

## Step 7: Update Nuxt Config
**Status**: ✅ Complete

Added VAPID key to runtime config.

**File**: `/web/nuxt.config.ts`

**Changes**:
```typescript
runtimeConfig: {
  public: {
    // ... existing
    firebaseVapidKey: process.env.FIREBASE_VAPID_KEY
  }
}
```

**Verification**: Can access via `useRuntimeConfig().public.firebaseVapidKey`

---

## Step 8: Create Cron Script Structure
**Status**: ✅ Complete

Set up the cron scripts directory and base structure.

**Create**:
- `/server/src/console/crons/` directory
- `/server/src/console/crons/send-reminders.js`
- Service account connection pattern

**Verification**: Script can connect to Firebase

---

## Step 9: Implement Send Reminders Logic
**Status**: ✅ Complete

Complete the cron script logic.

**Schedule behavior**:
- **8am**: Notify for payments due in exactly 3 days + due TODAY
- **7pm**: Notify for payments due TODAY only

**Notification timeline per payment** (3 total):
| Days until due | 8am | 7pm |
|----------------|-----|-----|
| 3 days         | ✅  | ❌  |
| 2 days         | ❌  | ❌  |
| 1 day          | ❌  | ❌  |
| Today          | ✅  | ✅  |

**Script flow**:
1. Query `payment2` collection where:
   - `isPaid = false`
   - `paymentType = "recurrent"`
   - `dueDate = today` OR `dueDate = today + 3 days` (8am only)
2. Group payments by `userId`
3. For each user with pending payments:
   - Fetch FCM tokens from `fcmTokens` collection
   - Skip if no tokens found
4. Send personalized notification per payment

**Message format**:
- 3 days: `"Tu pago de '{title}' de $X.XXX,XX vence en 3 días"`
- Today: `"Tu pago de '{title}' de $X.XXX,XX vence hoy"`

**Verification**: Running script manually sends test notification

---

## Step 10: GitHub Actions Workflow
**Status**: ✅ Complete

Create workflow to run the cron script.

**File**: `/.github/workflows/send-notifications.yml`

**Schedule**:
- `0 11 * * *` (8am ART) → 3-day + today reminders
- `0 22 * * *` (7pm ART) → today-only reminders

**Secrets needed**:
- `FIREBASE_SERVICE_ACCOUNT` (base64 encoded)

**Verification**: Manual workflow dispatch works

---

## Current Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Firebase Console Setup | ✅ Complete |
| 2 | Service Worker | ✅ Complete |
| 3 | FCM Utils | ✅ Complete |
| 4 | FCM Token Schema | ✅ Complete |
| 5 | Notification Store | ✅ Complete |
| 6 | NotificationManager | ✅ Complete |
| 7 | Nuxt Config | ✅ Complete |
| 8 | Cron Structure | ✅ Complete |
| 9 | Cron Logic | ✅ Complete |
| 10 | GitHub Actions | ✅ Complete |
