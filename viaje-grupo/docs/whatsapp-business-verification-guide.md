# WhatsApp Business Verification Guide (Individual Developer)

**Purpose:** Move from Meta Test Mode (5 users max) to Production (unlimited users)  
**Time Required:** ~2 hours of work + 1-7 days Meta review  
**Cost:** ~$3-10 USD (prepaid SIM only)

---

## Why You Need This

| Current Limitation | After Verification |
|-------------------|-------------------|
| Only 5 phone numbers can message bot | ✅ Unlimited users |
| Must manually whitelist each number | ✅ Anyone can message |
| Uses Meta's test phone number | ✅ Your own bot number |
| "Test mode" watermark | ✅ Clean, professional |

---

## Prerequisites Checklist

Before starting, gather these:

```
☐ Personal identification (one of):
   ├── DNI (Documento Nacional de Identidad)
   ├── Passport
   └── Driver's license

☐ Address proof (one of):
   ├── Utility bill (gas, electric, water) with your name
   ├── Bank statement with your name and address
   └── Government letter with your address

☐ Phone number for the bot:
   ├── Prepaid SIM card (recommended, ~$3-5 USD)
   ├── eSIM (if your phone supports dual SIM)
   └── Old unused number from family member
   
   ⚠️ IMPORTANT: This number must NOT already be 
   registered with WhatsApp personal or business.
   
☐ Facebook account (personal)

☐ Email address
```

---

## Step 1: Get a Phone Number for the Bot

**Time:** 30 minutes (when stores open)

### Option A: Prepaid SIM (Recommended)

1. Go to any phone carrier store (Claro, Movistar, Personal, etc.)
2. Buy the cheapest prepaid SIM (~$3-5 USD)
3. Activate it (usually automatic or quick call)
4. **Save the number** - you'll need it for verification
5. Keep the SIM safe - you'll receive ONE verification SMS

> 💡 **Tip:** You don't need data or minutes. Just the ability to receive SMS once.

### Option B: eSIM (If Your Phone Supports It)

1. Check if your phone supports eSIM (iPhone XS+, Pixel 3+, etc.)
2. Buy eSIM from carrier or online (Airalo, Holafly, etc.)
3. Add as secondary line
4. Use that number for verification

### Option C: Family Member's Unused Number

1. Find someone with an old number they don't use
2. Make sure it's NOT registered on WhatsApp already
3. Get their permission to use it for your bot

---

## Step 2: Create Facebook Business Manager Account

**Time:** 15 minutes  
**URL:** https://business.facebook.com

### 2.1 Go to Business Manager

1. Open https://business.facebook.com
2. Click **"Create Account"** (or "Get Started")

### 2.2 Enter Business Information

```
Business name:        Text The Check
                      (or "Text The Check by [Your Name]")

Your name:            [Your legal name as on ID]

Business email:       [Your email]
```

### 2.3 Select Business Type

When asked about business type, select:

```
☐ Corporation
☐ Partnership  
☐ Non-profit
☑ Sole Proprietor / Individual    ← SELECT THIS
☐ Other
```

### 2.4 Enter Address

Use your home address. This is normal for individual developers.

```
Street:     [Your street address]
City:       [Your city]
Province:   [Your province]
Postal:     [Your postal code]
Country:    Argentina
```

### 2.5 Confirm and Create

1. Review all information
2. Click **"Submit"** or **"Create"**
3. You now have a Business Manager account!

---

## Step 3: Start Business Verification

**Time:** 20 minutes  
**URL:** https://business.facebook.com/settings/security

### 3.1 Navigate to Verification

1. In Business Manager, click **Settings** (gear icon)
2. Go to **Business Settings**
3. Click **Security Center** in left sidebar
4. Find **"Start Verification"** button

### 3.2 Select Verification Method

Choose: **"Verify with documents"**

### 3.3 Upload Documents

**Document 1: Identity Verification**

```
Upload ONE of:
├── DNI (front and back)
├── Passport (photo page)
└── Driver's license (front and back)

Requirements:
✓ Clear, readable photo/scan
✓ All corners visible
✓ Not expired
✓ Matches the name you entered
```

**Document 2: Address Verification**

```
Upload ONE of:
├── Utility bill (last 3 months)
├── Bank statement (last 3 months)
└── Government correspondence

Requirements:
✓ Shows your name
✓ Shows your address
✓ Dated within last 3 months
✓ Clear, readable
```

### 3.4 Submit and Wait

1. Review uploaded documents
2. Click **"Submit"**
3. You'll see: "Verification in progress"

**Expected wait time:** 1-7 business days (usually 2-3)

> 📧 You'll receive email updates at your business email.

---

## Step 4: Add WhatsApp to Business Manager

**Time:** 15 minutes  
**Do this AFTER verification is approved**

### 4.1 Access WhatsApp Manager

1. Go to https://business.facebook.com
2. Click **"All Tools"** (or hamburger menu)
3. Find and click **"WhatsApp Manager"**

### 4.2 Add WhatsApp Business Account

1. Click **"Add WhatsApp Business Account"**
2. Follow the setup wizard
3. Accept WhatsApp Business Terms

### 4.3 Add Your Bot Phone Number

1. In WhatsApp Manager, click **"Phone Numbers"**
2. Click **"Add Phone Number"**
3. Enter your new prepaid number:
   ```
   Country: Argentina (+54)
   Number:  [Your prepaid number without leading 0]
   ```
4. Select verification method: **SMS**
5. Enter the code you receive via SMS
6. Done! Number is verified.

---

## Step 5: Connect to Your Existing App

**Time:** 30 minutes

### 5.1 Get New Credentials

In WhatsApp Manager → API Setup, you'll find:

```
Phone Number ID:     [New ID - different from test]
WhatsApp Business Account ID: [Your account ID]
Access Token:        [Generate permanent token]
```

### 5.2 Update Render Environment Variables

Go to Render Dashboard → viaje-grupo-server → Environment:

```env
# Update these with new values:
WHATSAPP_PHONE_NUMBER_ID=[New Phone Number ID]
WHATSAPP_API_TOKEN=[New Permanent Token]

# REMOVE this line (no longer needed!):
ALLOWED_PHONE_NUMBERS=...    ← DELETE THIS
```

### 5.3 Update Webhook

In Meta App Dashboard → WhatsApp → Configuration:

1. Webhook URL stays the same:
   ```
   https://viaje-grupo-server.onrender.com/webhook
   ```

2. Verify Token stays the same:
   ```
   [Your existing WHATSAPP_VERIFY_TOKEN]
   ```

3. Subscribe to messages (should already be done)

### 5.4 Deploy and Test

1. Deploy new environment variables on Render
2. Have someone NEW (not in old whitelist) message the bot
3. If they get a response, you're live! 🎉

---

## Step 6: Post-Verification Cleanup

### 6.1 Remove Phone Whitelist Code (Optional)

The whitelist check in your code can be removed or made optional:

```javascript
// In whatsapp.js, find the whitelist check and remove/disable it
// After production, anyone can message the bot
```

### 6.2 Update Documentation

Update these docs to reflect production status:
- `docs/product-status.md` - Change "Closed Beta" to "Production"
- `docs/session-handoff.md` - Update WhatsApp API status
- `README.md` - Remove beta limitations mention

### 6.3 Inform Test Users

Let your test groups know:
- New bot phone number (if changed)
- They may need to save the new contact
- No more whitelist restrictions

---

## Troubleshooting

### "Business verification rejected"

| Reason | Solution |
|--------|----------|
| Document unclear | Re-upload higher quality scan/photo |
| Name mismatch | Ensure Business Manager name matches ID exactly |
| Address mismatch | Use document with matching address |
| Document expired | Use valid, non-expired ID |

You can re-submit verification after fixing issues.

### "Phone number already registered"

The number is already on WhatsApp. Solutions:
1. Use the existing WhatsApp on that number to delete the account
2. Wait 24-48 hours
3. Try registering again

### "Verification code not received"

1. Make sure the SIM is active and has signal
2. Wait a few minutes and request resend
3. Try voice call verification instead of SMS

### "Webhook not working with new number"

1. Check Phone Number ID is updated in Render
2. Check Access Token is valid and not expired
3. Verify webhook subscription in Meta Dashboard
4. Check Render logs for errors

---

## Timeline Summary

```
Day 1:  Buy SIM, create Business Manager, submit verification
        ↓
Days 2-4: Wait for Meta review (check email)
        ↓
Day 5:  (If approved) Add WhatsApp number, update credentials
        ↓
Day 5:  Test with new user → LIVE! 🚀
```

---

## Cost Summary

| Item | Cost |
|------|------|
| Prepaid SIM | ~$3-5 USD |
| Business Manager | Free |
| Business Verification | Free |
| WhatsApp Business API | Free (first 1,000 conversations/month) |
| **Total** | **~$3-5 USD** |

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| Facebook Business Manager | https://business.facebook.com |
| Business Verification | https://business.facebook.com/settings/security |
| WhatsApp Business Platform | https://business.facebook.com/wa/manage |
| Meta App Dashboard | https://developers.facebook.com/apps |
| WhatsApp Pricing | https://developers.facebook.com/docs/whatsapp/pricing |
| WhatsApp API Docs | https://developers.facebook.com/docs/whatsapp |

---

## GitHub Issue Template

Copy this to create a GitHub issue:

```markdown
## 🚀 Move to WhatsApp Business Production

### Why
- Test mode limited to 5 phone numbers
- Brazil Trip 2025 has 11 people (BLOCKED)
- Need unlimited users for scaling

### Prerequisites
- [ ] Buy prepaid SIM card
- [ ] Gather ID document (DNI/passport)
- [ ] Gather address proof (utility bill)

### Steps
- [ ] Create Facebook Business Manager account
- [ ] Submit business verification (as individual)
- [ ] Wait for approval (1-7 days)
- [ ] Add WhatsApp number to Business Manager
- [ ] Update Render environment variables
- [ ] Remove ALLOWED_PHONE_NUMBERS whitelist
- [ ] Test with non-whitelisted user
- [ ] Update documentation

### Docs
See: `docs/whatsapp-business-verification-guide.md`

### Deadline
Before Brazil Trip 2025 (~3 weeks from Dec 30, 2024)
```

---

## Notes

- This guide is for **Argentina** - some details may vary by country
- Meta's review process can be faster or slower depending on volume
- Keep your verification documents - you may need them for appeals
- The bot phone number doesn't need to stay active after verification (API doesn't use the actual SIM)

---

**Last Updated:** December 31, 2024  
**Author:** Claude (for Text The Check project)
