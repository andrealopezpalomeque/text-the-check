# Test Curls — Text The Check API (Render)

Base URL: `https://text-the-check.onrender.com`
Phone: `5493513467739`
App Secret: `e28b0b1b89d3533ef501d05554074fcc`

Every POST curl below computes HMAC SHA256 signature automatically.

---

## Health & Info

### Root
```bash
curl https://text-the-check.onrender.com/
```

### Health
```bash
curl https://text-the-check.onrender.com/health
```

### Webhook Verification (should return challenge)
```bash
curl "https://text-the-check.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=text_the_check_12_dec_2025&hub.challenge=test_challenge_123"
```

### 404
```bash
curl -s -o /dev/null -w "%{http_code}" https://text-the-check.onrender.com/nonexistent
```

---

## Mode Switching

### MODE FINANZAS
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.mode-fin-001","timestamp":"1700000001","type":"text","text":{"body":"MODE FINANZAS"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### MODE GRUPOS
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.mode-grp-001","timestamp":"1700000002","type":"text","text":{"body":"MODE GRUPOS"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

---

## Unlinked User

### Hola (no account — should get "No encontré tu cuenta" message)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.unlinked-001","timestamp":"1700000003","type":"text","text":{"body":"Hola"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

---

## Finanzas Commands

### VINCULAR (link account with code)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-vincular-001","timestamp":"1700000010","type":"text","text":{"body":"vincular ABC123"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### DESVINCULAR (unlink account)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-desvinc-001","timestamp":"1700000011","type":"text","text":{"body":"desvincular"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### AYUDA
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-ayuda-001","timestamp":"1700000012","type":"text","text":{"body":"ayuda"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### CATEGORIAS
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-cat-001","timestamp":"1700000013","type":"text","text":{"body":"categorias"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### RESUMEN (monthly summary)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-resumen-001","timestamp":"1700000014","type":"text","text":{"body":"resumen"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### FIJOS (recurring payments)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-fijos-001","timestamp":"1700000015","type":"text","text":{"body":"fijos"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### ANALISIS (AI financial analysis)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-analisis-001","timestamp":"1700000016","type":"text","text":{"body":"analisis"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — simple
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-001","timestamp":"1700000017","type":"text","text":{"body":"$500 Super"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — with category
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-002","timestamp":"1700000018","type":"text","text":{"body":"$1500 Cena con amigos #salidas"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — with category + description
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-003","timestamp":"1700000019","type":"text","text":{"body":"$2.500 Nafta #transporte d:Cargué full el auto"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

---

## Grupos Commands

> Note: These require the user to exist in `ttc_user` and belong to a `ttc_group`.

### /ayuda
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-ayuda-001","timestamp":"1700000020","type":"text","text":{"body":"/ayuda"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### /balance
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-balance-001","timestamp":"1700000021","type":"text","text":{"body":"/balance"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### /lista
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-lista-001","timestamp":"1700000022","type":"text","text":{"body":"/lista"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### /grupo
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-grupo-001","timestamp":"1700000023","type":"text","text":{"body":"/grupo"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### /borrar
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-borrar-001","timestamp":"1700000024","type":"text","text":{"body":"/borrar"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — simple (ARS)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-001","timestamp":"1700000025","type":"text","text":{"body":"Puse 5 lucas en la pizza"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — with mentions
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-002","timestamp":"1700000026","type":"text","text":{"body":"3000 taxi con @Juan y @Maria"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Expense — foreign currency (USD)
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-003","timestamp":"1700000027","type":"text","text":{"body":"50 dolares la cena"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Payment — I paid someone
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-pay-001","timestamp":"1700000028","type":"text","text":{"body":"Le pagué 5000 a @Juan"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Payment — I received
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-recv-001","timestamp":"1700000029","type":"text","text":{"body":"Recibí 3000 de @Maria"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### AI Confirmation — Yes
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-confirm-001","timestamp":"1700000030","type":"text","text":{"body":"si"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### AI Confirmation — No
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-confirm-002","timestamp":"1700000031","type":"text","text":{"body":"no"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```

### Group Selection — pick group 1
```bash
BODY='{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-select-001","timestamp":"1700000032","type":"text","text":{"body":"1"}}]},"field":"messages"}]}]}' && SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "e28b0b1b89d3533ef501d05554074fcc" | awk '{print $2}') && curl -X POST https://text-the-check.onrender.com/webhook -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$SIG" -d "$BODY"
```
