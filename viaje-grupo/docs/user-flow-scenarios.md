# User Flow Scenarios - Text The Check

**Last updated:** December 30, 2025

---

## Overview: Two Entry Points, Same Features

```
┌─────────────────────────────────────────────────────────────┐
│  USER TYPES IN TEXT THE CHECK                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Type A: WhatsApp-Only User                                 │
│  └── Has: phone number in group                             │
│  └── Can: Log expenses, view balances, record payments      │
│  └── Cannot: Access dashboard (no email linked)             │
│                                                             │
│  Type B: Dashboard-Only User                                │
│  └── Has: email linked to account                           │
│  └── Can: Full dashboard access including expense creation  │
│  └── Cannot: Use WhatsApp bot (phone not whitelisted)       │
│                                                             │
│  Type C: Full Access User                                   │
│  └── Has: phone + email linked                              │
│  └── Can: Everything - WhatsApp + Dashboard                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Capability Matrix

| Capability | WhatsApp | Dashboard | Notes |
|------------|:--------:|:---------:|-------|
| **Create** expense | ✅ Natural language | ✅ Form | Both work |
| **View** expenses | ✅ `/lista` | ✅ Feed | Both work |
| **Delete** expense | ❌ | ✅ Button | Dashboard only |
| **Edit** expense | ❌ | ✅ Form | Dashboard only |
| **Create** payment | ✅ `pagué/recibí` | ✅ Button | Both work |
| **View** balances | ✅ `/balance` | ✅ Summary | Both work |
| **Settlement recs** | ❌ | ✅ | Dashboard only |
| **Payment info** | ❌ | ✅ CBU/alias | Dashboard only |
| **Switch groups** | ✅ `/grupo` | ✅ Dropdown | Both work |

---

## Scenario 1: WhatsApp-Only User

**Profile:** Juan is in the trip group, has phone registered, but NO email linked.

### What Juan CAN Do:
- ✅ Create expenses via WhatsApp ("150 pizza con María")
- ✅ View balances via WhatsApp (/balance)
- ✅ View expense list (/lista)
- ✅ Record payments ("pagué 5000 @María")
- ✅ Switch groups (/grupo)

### What Juan CANNOT Do:
- ❌ Access textthecheck.app (requires Google Auth with linked email)
- ❌ See settlement recommendations with payment info
- ❌ See other members' payment details (CBU, alias)
- ❌ Edit expenses (amount, description, split)
- ❌ Delete expenses (must use dashboard)

**Is this OK?** ✅ YES - This is the core use case! Most users will be WhatsApp-only.

---

## Scenario 2: Dashboard-Only User

**Profile:** María has email linked, can log into dashboard, but phone is NOT in ALLOWED_PHONE_NUMBERS.

### What María CAN Do:
- ✅ Create expenses via dashboard form
- ✅ View all expenses in the group (real-time feed)
- ✅ View balances and settlements
- ✅ Record payments via dashboard button
- ✅ See payment info (CBU, alias, MercadoPago)
- ✅ Switch between groups
- ✅ Edit/Delete any expense in the group

### What María CANNOT Do:
- ❌ Send expenses via WhatsApp (phone not whitelisted)
- ❌ Use bot commands (/balance, /lista, etc.)

**Is this OK?** ⚠️ Rare scenario - after public launch, whitelist is removed.

---

## Scenario 3: Full Access User

**Profile:** Pipi has phone in ALLOWED_PHONE_NUMBERS AND email linked.

### What Pipi CAN Do:
- ✅ EVERYTHING from WhatsApp (natural language, commands, payments)
- ✅ EVERYTHING from Dashboard (create, edit, delete, settlements, payment info)

**This is the ideal user experience.**

---

## Data Sync: WhatsApp ↔ Dashboard

All data syncs in real-time via Firestore:

- Juan logs expense via WhatsApp → María sees it instantly on dashboard
- María records payment on dashboard → Juan gets WhatsApp notification
- Either changes group → activeGroupId syncs to both interfaces

---

## WhatsApp Bot Scope (Focused)

| Does | Doesn't |
|------|---------|
| ✅ Log expenses (AI natural language) | ❌ Edit expenses (dashboard only) |
| ✅ Log payments | ❌ Delete expenses (dashboard only) |
| ✅ View balances (`/balance`) | ❌ Edit payments |
| ✅ View expenses (`/lista`) | ❌ Complex multi-step flows |
| ✅ Switch groups (`/grupo`) | ❌ Settlement calculations |
| ✅ Get help (`/ayuda`) | ❌ Payment info display |

**Design principle:** Bot does ONE thing well - log expenses quickly with minimal friction. Edit/delete operations require the dashboard for a better UX.

---

## Dashboard Scope (Full Control)

| Feature | Description |
|---------|-------------|
| Create expense | Form with amount, description, currency, participants |
| Edit expense | Modify any field of existing expense |
| Delete expense | Remove any expense in the group |
| View feed | Real-time list of expenses + payments |
| Balances | Personal summary + group overview |
| Settlements | Recommended transfers with payment info |
| Payment info | CBU, alias, MercadoPago with copy button |
| Record payment | Button on settlement to log payment made |
| Multi-group | Dropdown to switch between groups |
