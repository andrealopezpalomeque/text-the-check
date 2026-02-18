# Google Authentication Setup Guide

## Overview

Google Authentication has been implemented in the Text The Check Nuxt.js client. This guide walks through enabling and configuring it.

## What Was Implemented

### 1. Authentication Infrastructure
- ✅ Updated Firebase plugin to initialize Auth (`client/plugins/firebase.client.ts`)
- ✅ Created `useAuth()` composable for authentication state management
- ✅ Implemented auth state persistence with Firebase's `onAuthStateChanged`

### 2. User Interface
- ✅ Created `/login` page with Google Sign-In button
- ✅ Added auth middleware to protect routes
- ✅ Added user profile display in dashboard header (avatar, name, email)
- ✅ Added logout button in header
- ✅ Responsive design for mobile and desktop

### 3. Data Flow
- ✅ App initializes auth on mount
- ✅ Expense and user data only loads after authentication
- ✅ Firestore listeners start/stop based on auth state
- ✅ Automatic redirect to `/login` for unauthenticated users
- ✅ Automatic redirect to `/` for authenticated users on login page

## Firebase Console Setup

### Step 1: Enable Google Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **viaje-grupo** (Firebase project ID)
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Set **Project public-facing name**: Text The Check
7. Set **Project support email**: Your email
8. Click **Save**

### Step 2: Configure Authorized Domains

By default, `localhost` and your Firebase project domains are authorized. To add custom domains:

1. In **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Add your production domain (e.g., `textthecheck.app`)

### Step 3: Verify Configuration

After enabling, you should see:
- ✅ Google provider enabled in Firebase Console
- ✅ Web SDK configuration includes `authDomain`

## Client Configuration

### Environment Variables

Ensure your `client/.env` file has all Firebase config values:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viaje-grupo.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=viaje-grupo
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viaje-grupo.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Note:** These should already be configured from your existing Firestore setup.

## Testing the Authentication Flow

### Local Development

1. Start the Nuxt dev server:
```bash
cd client
npm run dev
```

2. Navigate to `http://localhost:3000`

3. You should be automatically redirected to `/login`

4. Click **"Continuar con Google"**

5. Complete Google sign-in flow

6. You should be redirected to `/` and see:
   - Your Google profile picture or initials
   - Your name and email in the header
   - "Salir" (Logout) button
   - Expense data loading

### Test Logout

1. Click **"Salir"** button
2. You should be redirected to `/login`
3. Try accessing `/` directly → should redirect to `/login`

### Test Protected Routes

1. While logged out, try to access `/`
2. Should auto-redirect to `/login`
3. After logging in, try to access `/login`
4. Should auto-redirect to `/`

## Security Considerations

### Firestore Security Rules

The security rules deployed earlier require authenticated users:

```javascript
// Users can only read/write when authenticated
allow read: if isAuthenticated();
allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
```

### Authentication Flow

1. User signs in with Google → Firebase Auth validates
2. Firebase returns user token (JWT)
3. Firestore SDK automatically includes token in requests
4. Security rules verify `request.auth.uid` exists and matches document `userId`

### Current Limitations

- ✅ WhatsApp bot users are NOT required to have Google accounts
- ✅ Backend (Admin SDK) bypasses security rules
- ⚠️ Dashboard users MUST have Google accounts to access
- ⚠️ No role-based access control (all authenticated users see all data)

## Connecting WhatsApp Users to Google Auth

Currently, WhatsApp users and Google users are separate. To link them:

### Option 1: Manual Mapping (Simple)

Create a mapping in Firestore:

```javascript
// Collection: authMapping
{
  googleUid: "abc123",
  phoneNumber: "+5493794702813",
  userId: "user_phone_123" // Matches WhatsApp user ID
}
```

Update `useAuth` to fetch this mapping after login.

### Option 2: Phone Verification (Recommended for Production)

1. After Google sign-in, prompt user to verify their WhatsApp phone number
2. Send verification code via WhatsApp
3. Link `auth.currentUser.uid` to verified phone number
4. Update Firestore security rules to check phone verification

### Option 3: Invite-Based Access (Current Interim Solution)

1. Only allow Google sign-ins from emails in whitelist
2. Add environment variable: `ALLOWED_GOOGLE_EMAILS`
3. Check on login and reject unauthorized emails

## Troubleshooting

### Common Issues

**"FirebaseError: Firebase: Error (auth/unauthorized-domain)"**
- Solution: Add your domain to **Authorized domains** in Firebase Console

**"Missing or insufficient permissions" when reading expenses**
- Cause: User authenticated but Firestore rules not deployed
- Solution: Run `firebase deploy --only firestore:rules` (see docs/firestore-security.md)

**Login button does nothing or throws popup error**
- Cause: Google provider not enabled
- Solution: Enable Google in Firebase Console (see Step 1 above)

**User logs in but no expenses show**
- Cause: Firestore listeners not initialized
- Solution: Check browser console for errors, verify `app.vue` auth watcher is running

**Header doesn't show user profile**
- Cause: User object not reactive
- Solution: Check that `useAuth()` is returning reactive `user` state

## Development Notes

### File Structure

```
client/
├── composables/
│   ├── useAuth.ts          # Auth state management
│   └── useFirebase.ts      # Firebase instance access
├── middleware/
│   └── auth.ts             # Route protection
├── pages/
│   ├── index.vue           # Dashboard (protected)
│   └── login.vue           # Login page
├── plugins/
│   └── firebase.client.ts  # Firebase initialization
└── app.vue                 # Auth initialization & listeners
```

### State Management

- **useState**: Used for reactive auth state across components
- **onAuthStateChanged**: Firebase listener for auth state changes
- **watch**: Triggers data loading when auth state changes

### Route Protection

Routes are protected using Nuxt middleware:

```typescript
definePageMeta({
  middleware: ['auth']
})
```

Middleware checks `isAuthenticated` and redirects accordingly.

## Next Steps

1. **Enable Google Auth in Firebase Console** (see Step 1 above)
2. **Test the login flow locally**
3. **Consider adding email whitelist** for production
4. **Deploy to production** (Vercel/Netlify)
5. **Update authorized domains** for production URL

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth/web/google-signin)
- [Nuxt Middleware Docs](https://nuxt.com/docs/guide/directory-structure/middleware)
- [VueUse - useAuth](https://vueuse.org/firebase/useAuth/)
