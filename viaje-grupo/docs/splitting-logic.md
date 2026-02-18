# Smart Splitting Logic

**Last updated:** December 29, 2025

This document explains how Text The Check calculates who owes whom.

---

## Quick Reference: Who Gets Included?

| Pattern | Payer Included? | Example |
| :--- | :---: | :--- |
| No mentions | ✅ Yes (everyone splits) | `2000 taxi` |
| "con [names]" | ✅ Yes | `2000 taxi con Juan` |
| "@[names]" | ❌ No | `2000 taxi @Juan` |
| "para [name]" | ❌ No | `2000 regalo para Juan` |
| Payer mentions self | ✅ Yes | `2000 taxi @Juan @Pipi` |

> **Splitting Rules:**
>
> 1. **No mentions** → Everyone in the group splits equally
>
> 2. **Natural language "con/with"** → Payer + mentioned people split
>    - "cena con Juan" = You + Juan
>    - The word "con" implies you participated
>
> 3. **Explicit @mentions** → Only mentioned people split (payer NOT auto-included)
>    - "cena @Juan" = Only Juan owes
>    - Use this to log expenses on behalf of others
>    - To include yourself, mention yourself: "@Juan @Pipi"

---

## 1. The Core Variable: `splitAmong`
Every expense has a field called `splitAmong`. This is a list of User IDs derived from @mentions in the WhatsApp message, or from checkbox selection in the web dashboard.

## 2. Input Rules

### WhatsApp: Explicit @Mentions

The parser scans the message for `@Mentions`. With explicit mentions, the payer is **NOT** automatically included.

| Message | Parsed `splitAmong` | Who Splits |
| :--- | :--- | :--- |
| `2000 Sushi` | `[]` (Empty) | **Everyone** in the group |
| `2000 Sushi @Juan @Maria` | `['Juan', 'Maria']` | **Only Juan & Maria** (2 people) |
| `2000 Sushi @Pipi @Juan @Maria` | `['Pipi', 'Juan', 'Maria']` | **Pipi, Juan & Maria** (3 people) |

> **Use Case for @mentions:** Log expenses on behalf of others. If Pipi pays for Juan and Maria's lunch (and doesn't eat), Pipi logs: `2000 Almuerzo @Juan @Maria` - and only Juan and Maria will owe Pipi.

### WhatsApp: Natural Language with "con" (AI-Powered)

With AI natural language support, you can use conversational Spanish. The key difference is how **"con" (with)** vs **"@" (mention)** affects who splits:

| Message | Who Splits | Why |
| :--- | :--- | :--- |
| `2000 Sushi` | **Everyone** | No one mentioned |
| `2000 Sushi con Juan` | **Payer + Juan** | "con" implies payer participated |
| `2000 Sushi @Juan` | **Only Juan** | Explicit mention, payer not included |
| `2000 Sushi con Juan y Maria` | **Payer + Juan + Maria** | "con" implies payer participated |
| `2000 Sushi @Juan @Maria` | **Only Juan & Maria** | Explicit mentions only |

> **Key Rule for Natural Language:**
> - **"con/with"** = You participated → You ARE included in the split
> - **"@mention"** = Explicit list → You are NOT included (unless you mention yourself)

**More Examples:**
```
"50 dólares la cena con Gonzalo"     → Payer + Gonzalo split it
"50 dólares la cena @Gonzalo"        → Only Gonzalo owes (payer paid FOR him)
"Gasté 150 en pizza con los chicos"  → Everyone (vague "los chicos")
"5 lucas el taxi con Juan y María"   → Payer + Juan + María
"100 para Juan"                      → Only Juan (like @mention)
"le pagué el almuerzo a Juan"        → Only Juan owes
```

### Web Dashboard
When adding an expense via the dashboard:
- No participants are pre-selected by default
- You must explicitly check the boxes for everyone who participates
- The same rule applies: if you want to be included, check your own name

## 3. Calculation Algorithm
The balance calculation iterates through every expense:

1.  **Identify Participants:**
    *   If `splitAmong` is empty -> Participants = **All group members**.
    *   If `splitAmong` has users -> Participants = **Only those specified users**.

2.  **Calculate Share:**
    *   `Share = Amount / Count(Participants)`

3.  **Update Balances:**
    *   **Payer:** `Paid += Amount`
    *   **Participants:** `Share += Share` (each participant's share)

### Example Scenario 1: Payer included in split
*   **Users:** Pipi, Nico, Juani.
*   **Action:** Pipi pays $3000 for "Cena @Pipi @Nico @Juani".
*   **Math:**
    *   Payer: Pipi.
    *   Mentions: Pipi, Nico, Juani.
    *   Participants: 3 people.
    *   Cost per person: $1000.
*   **Result:**
    *   Pipi: Paid $3000, Share $1000. **Net: +$2000** (Owed back).
    *   Nico: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).
    *   Juani: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).

### Example Scenario 2: Payer NOT included (paying for others)
*   **Users:** Pipi, Nico, Juani.
*   **Action:** Pipi pays $2000 for "Regalo @Nico @Juani" (gift for them, Pipi doesn't get one).
*   **Math:**
    *   Payer: Pipi.
    *   Mentions: Nico, Juani (Pipi NOT mentioned).
    *   Participants: 2 people (only Nico and Juani).
    *   Cost per person: $1000.
*   **Result:**
    *   Pipi: Paid $2000, Share $0. **Net: +$2000** (Owed back in full).
    *   Nico: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).
    *   Juani: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).

### Example Scenario 3: No mentions (everyone splits)
*   **Users:** Pipi, Nico, Juani.
*   **Action:** Pipi pays $3000 for "Taxi" (no @mentions).
*   **Math:**
    *   Payer: Pipi.
    *   Mentions: None.
    *   Participants: Everyone (3 people).
    *   Cost per person: $1000.
*   **Result:**
    *   Pipi: Paid $3000, Share $1000. **Net: +$2000** (Owed back).
    *   Nico: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).
    *   Juani: Paid $0, Share $1000. **Net: -$1000** (Owes Pipi).

### Example Scenario 4: Natural language "con" (payer included automatically)
*   **Users:** Pipi, Nico, Juani.
*   **Action:** Pipi sends "3000 Cena con Nico" (natural language with "con").
*   **AI Interpretation:** `includesSender = true` (because of "con")
*   **Math:**
    *   Payer: Pipi.
    *   Participants: Pipi + Nico (2 people, Pipi auto-included).
    *   Cost per person: $1500.
*   **Result:**
    *   Pipi: Paid $3000, Share $1500. **Net: +$1500** (Owed back).
    *   Nico: Paid $0, Share $1500. **Net: -$1500** (Owes Pipi).
    *   Juani: Paid $0, Share $0. **Net: $0** (Not involved).

### Example Scenario 5: Explicit @mention (payer NOT included)
*   **Users:** Pipi, Nico, Juani.
*   **Action:** Pipi sends "3000 Cena @Nico" (explicit @mention).
*   **AI Interpretation:** `includesSender = false` (explicit mention)
*   **Math:**
    *   Payer: Pipi.
    *   Participants: Only Nico (1 person, Pipi NOT included).
    *   Cost per person: $3000.
*   **Result:**
    *   Pipi: Paid $3000, Share $0. **Net: +$3000** (Owed back in full).
    *   Nico: Paid $0, Share $3000. **Net: -$3000** (Owes Pipi everything).
    *   Juani: Paid $0, Share $0. **Net: $0** (Not involved).

> **Comparison:** Notice how "3000 Cena con Nico" vs "3000 Cena @Nico" produce completely different results:
> - **"con Nico"** → Pipi + Nico split it (each owes $1500)
> - **"@Nico"** → Only Nico owes the full $3000

## 4. Edge Cases

### General
*   **Unknown Names:** If you type `@Unknown`, the system ignores it. If no valid users are found in the mentions, it falls back to **Everyone**.
*   **Self-Mention:** With @mentions, if you want to be included, mention yourself (e.g., `@Pipi`). With "con", you're included automatically.
*   **Empty Web Selection:** On the dashboard, you must select at least one participant or the form won't submit.

### AI Natural Language
*   **Vague References:** If AI can't identify specific names (e.g., "con los chicos", "con todos"), it splits among **Everyone**.
*   **Mixed Patterns:** If message has both "con" and "@" (e.g., "cena con Juan @Maria"), AI prioritizes the dominant pattern.
*   **Low Confidence:** If AI isn't sure (confidence < 0.7), it falls back to the regex parser.
*   **AI Timeout:** If AI takes longer than 5 seconds, the system falls back to regex parsing.

## 5. Payments (Settling Debts)

Payments represent real money transfers between users to settle debts. Unlike expenses, payments directly reduce what one person owes another.

### Recording Payments

Payments can be recorded via:

**WhatsApp:**
| Command | Meaning |
| :--- | :--- |
| `pagué 5000 @Maria` | I paid 5000 to Maria |
| `recibí 5000 @Juan` | I received 5000 from Juan |

**Dashboard:**
- Click the payment button on a settlement recommendation
- Confirm the payment amount

### How Payments Affect Balances

Payments are factored into balance calculations after expenses are processed:

1. **Calculate expense-based balances** (as described in Section 3)
2. **Apply payment adjustments:**
   - Payment **from** A **to** B: A's net balance increases, B's net balance decreases
   - This reflects that A has partially or fully settled their debt to B

### Example with Payments

*   **Starting State (from expenses):**
    *   Nico owes Pipi $2000

*   **Action:** Nico pays Pipi $1000 (bank transfer) and records: `pagué 1000 @Pipi`

*   **Result:**
    *   Nico's debt reduced: Now owes Pipi **$1000** (was $2000)
    *   Pipi is owed less: Is owed **$1000** (was $2000)

### Who Can Record Payments

Either party involved in a payment can record it:
- The person who paid (using `pagué`)
- The person who received (using `recibí`)

When a payment is recorded, the other party receives a WhatsApp notification informing them of the recorded payment.

### Settlement Recommendations

The dashboard shows optimized settlement recommendations that consider:
1. Current expense-based balances
2. Payments already made

If Nico originally owed Pipi $2000 and already paid $1000, the settlement recommendation will show: "Nico → Pipi: $1000" (the remaining balance).
