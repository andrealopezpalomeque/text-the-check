# Text The Check - Production Deployment Checklist

## Overview

This checklist ensures a secure and successful deployment to production. Complete Phase 1 (Security Hardening) is done. This guide prepares you for Phase 2 (Production Deployment).

---

## Environment Configuration

### Development Environment

```env
# Node Environment
NODE_ENV=development

# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_API_TOKEN=your_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Development Only - Allows testing without signature verification
WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true

# Authorization (phone whitelist)
ALLOWED_PHONE_NUMBERS=+5493794702813,+5493794702875

# Firebase Admin SDK
FIREBASE_PROJECT_ID=viaje-grupo
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Server
PORT=4000
```

### Production Environment

```env
# Node Environment - CRITICAL: Must be set to 'production'
NODE_ENV=production

# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret_from_meta
WHATSAPP_API_TOKEN=your_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# ❌ DO NOT SET THIS IN PRODUCTION
# WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true

# Authorization (phone whitelist)
ALLOWED_PHONE_NUMBERS=+5493794702813,+5493794702875

# Firebase Admin SDK
FIREBASE_PROJECT_ID=viaje-grupo
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# AI / Gemini (NEW - December 2025)
GEMINI_API_KEY=your_gemini_api_key
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.7
AI_TIMEOUT_MS=5000

# Server (may be set by platform)
PORT=4000

# Optional: Exchange rate API (Phase 3)
# EXCHANGE_RATE_API_KEY=your_api_key
```

---

## Pre-Deployment Security Checklist

### Server Security

- [ ] `NODE_ENV=production` is set
- [ ] `WHATSAPP_SKIP_SIGNATURE_VERIFICATION` is NOT set (or set to `false`)
- [ ] `WHATSAPP_APP_SECRET` is configured correctly
- [ ] Firebase Admin credentials are production credentials (not development)
- [ ] All sensitive values are stored as environment variables (not hardcoded)
- [ ] `.env` file is in `.gitignore` (never committed to git)

### Firebase Security

- [ ] Firestore security rules are deployed
- [ ] Google Authentication is enabled in Firebase Console
- [ ] Authorized domains include production URL
- [ ] Firebase Admin SDK credentials are secure

### WhatsApp Configuration

- [ ] Webhook URL points to production domain
- [ ] Webhook signature verification is enabled (no bypass)
- [ ] Phone number whitelist is configured
- [ ] Meta webhook subscription is active

### Code Quality

- [ ] All tests pass (when tests are added in Phase 3)
- [ ] No console.log debug statements in production code
- [ ] Error handling is in place for all endpoints
- [ ] Rate limiting is active (100 req/min)

---

## Deployment Platforms

### Recommended Options

1. **Railway** - Simplest deployment
   - Automatic deployments from Git
   - Built-in environment variables
   - Free tier available

2. **Render** - Great free tier
   - Auto-deploy from GitHub
   - Easy environment variable management
   - Free SSL certificates

3. **Heroku** - Classic choice
   - Well-documented
   - Many add-ons available
   - Free tier with limitations

4. **Vercel** (for client only)
   - Nuxt.js optimized
   - Edge network
   - Free tier for frontend

---

## Deployment Steps

### Backend Deployment

1. **Choose a platform** (Railway, Render, or Heroku)

2. **Connect your repository**
   - Link your GitHub repository
   - Select the `main` branch

3. **Configure build settings**
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`
   - Root directory: `server/` (or configure monorepo settings)

4. **Set environment variables**
   - Copy production environment variables from above
   - Use platform's environment variable UI
   - **CRITICAL:** Set `NODE_ENV=production`
   - **CRITICAL:** Do NOT set `WHATSAPP_SKIP_SIGNATURE_VERIFICATION`

5. **Deploy**
   - Trigger first deployment
   - Monitor logs for errors
   - Verify server starts successfully

6. **Update Meta webhook URL**
   - Go to Meta for Developers
   - Update webhook URL to production domain
   - Example: `https://your-app.railway.app/api/whatsapp/webhook`
   - Re-verify webhook subscription

7. **Test webhook**
   - Send a test WhatsApp message
   - Verify it's received and processed
   - Check expense appears in Firestore
   - Verify dashboard updates in real-time

### Frontend Deployment

1. **Choose a platform** (Vercel or Netlify)

2. **Connect repository**
   - Link GitHub repository
   - Select `main` branch

3. **Configure build settings**
   - Framework: Nuxt.js
   - Build command: `npm run build`
   - Output directory: `.output/public`
   - Root directory: `client/`

4. **Set environment variables**
   ```env
   NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viaje-grupo.firebaseapp.com
   NUXT_PUBLIC_FIREBASE_PROJECT_ID=viaje-grupo
   NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viaje-grupo.firebasestorage.app
   NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Deploy**
   - Trigger deployment
   - Monitor build logs
   - Verify deployment succeeds

6. **Update Firebase authorized domains**
   - Go to Firebase Console → Authentication → Settings
   - Add production domain to authorized domains
   - Example: `your-app.vercel.app`

7. **Test authentication**
   - Visit production URL
   - Click "Continuar con Google"
   - Verify login works
   - Check dashboard loads expenses

---

## Post-Deployment Verification

### Backend Health Checks

- [ ] GET `/api/whatsapp/test` returns 200 OK
- [ ] Webhook signature verification is working (check logs)
- [ ] WhatsApp messages are received and processed
- [ ] Expenses are created in Firestore
- [ ] No errors in server logs

### Frontend Health Checks

- [ ] Login page loads correctly
- [ ] Google authentication works
- [ ] Dashboard shows real-time expense updates
- [ ] User profile displays correctly
- [ ] Logout works and redirects to login

### Integration Testing

- [ ] Send WhatsApp message → Expense created → Dashboard updates
- [ ] Currency conversion works (USD/EUR/BRL → ARS)
- [ ] Category auto-detection works
- [ ] Split expense (@mentions) works
- [ ] Balance calculations are correct

---

## Rollback Plan

If deployment fails:

1. **Backend issues:**
   - Revert to previous deployment (use platform's rollback feature)
   - Check environment variables
   - Review server logs for errors

2. **Frontend issues:**
   - Revert deployment on Vercel/Netlify
   - Check Firebase configuration
   - Verify environment variables

3. **WhatsApp webhook issues:**
   - Temporarily point webhook back to ngrok/development
   - Debug signature verification
   - Check Meta developer console

---

## Keep Server Awake (Cron Job)

Render's free tier spins down after 15 minutes of inactivity. To prevent cold starts:

**Setup (already done):**
1. Created account at [cron-job.org](https://cron-job.org)
2. Created cron job:
   - **URL:** `https://viaje-grupo-server.onrender.com/`
   - **Interval:** Every 10 minutes
   - **Status:** ✅ Active

This keeps the server warm so WhatsApp responses are fast.

---

## Monitoring & Maintenance

### Set Up Monitoring

- [ ] Enable error tracking (Sentry, LogRocket, or platform built-in)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for errors and downtime
- [ ] Monitor Firestore usage and costs

### Regular Maintenance

- [ ] Review server logs weekly
- [ ] Monitor Firestore read/write usage
- [ ] Check Firebase Authentication usage
- [ ] Update dependencies monthly
- [ ] Review security rules quarterly

---

## Critical Security Reminders

### ❌ NEVER in Production

- Setting `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true`
- Using development Firebase credentials
- Committing `.env` files to Git
- Hardcoding secrets in code
- Disabling rate limiting

### ✅ ALWAYS in Production

- Set `NODE_ENV=production`
- Use environment variables for all secrets
- Enable webhook signature verification
- Deploy Firestore security rules
- Use HTTPS for all endpoints
- Keep dependencies updated

---

## Quick Reference

### Environment Variables by Purpose

**Required for WhatsApp:**
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET` ⚠️ Secret
- `WHATSAPP_API_TOKEN` ⚠️ Secret
- `WHATSAPP_PHONE_NUMBER_ID`

**Required for Firebase:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` ⚠️ Secret

**Required for AI (Gemini):**
- `GEMINI_API_KEY` ⚠️ Secret
- `AI_ENABLED=true`
- `AI_CONFIDENCE_THRESHOLD=0.7`
- `AI_TIMEOUT_MS=5000`

**Required for Security:**
- `NODE_ENV=production`
- `ALLOWED_PHONE_NUMBERS`

**Development Only:**
- `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true`

### Important URLs

- Meta for Developers: https://developers.facebook.com/
- Firebase Console: https://console.firebase.google.com/project/viaje-grupo
- Project Repository: [Your GitHub URL]

---

## Phase 2 Success Criteria

Deployment is complete when:

- ✅ Backend is deployed and accessible
- ✅ Frontend is deployed and accessible
- ✅ WhatsApp messages reach production server
- ✅ Expenses are created in Firestore
- ✅ Dashboard shows real-time updates
- ✅ Google authentication works
- ✅ All security checks pass
- ✅ No errors in production logs

**After successful deployment, move to Phase 3: Data Quality & Reliability**

---

*Last updated: December 29, 2025*
