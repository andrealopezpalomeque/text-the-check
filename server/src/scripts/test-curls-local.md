# Test Curls — Text The Check API (Localhost)

Base URL: `http://localhost:4000`
Phone: `5493513467739`

> Signature verification is skipped locally when `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true` and `NODE_ENV=development`.
>
> Start server: `npx tsx watch webhooks/wp_webhook.ts`
>
> **Dedup note:** Each `wamid` can only be used once. Increment the suffix (e.g. `001` → `002`) to reuse a curl.

---

## Health & Info

### Root
```bash
curl http://localhost:4000/
```

### Health
```bash
curl http://localhost:4000/health
```

### Webhook Verification (should return challenge)
```bash
curl "http://localhost:4000/webhook?hub.mode=subscribe&hub.verify_token=text_the_check_12_dec_2025&hub.challenge=test_challenge_123"
```

### 404
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/nonexistent
```

---

## Mode Switching

### MODE FINANZAS
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.mode-fin-001","timestamp":"1700000001","type":"text","text":{"body":"MODE FINANZAS"}}]},"field":"messages"}]}]}'
```

### MODE GRUPOS
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.mode-grp-001","timestamp":"1700000002","type":"text","text":{"body":"MODE GRUPOS"}}]},"field":"messages"}]}]}'
```

---

## Unlinked User

### Hola (no account — should get "No encontré tu cuenta" message)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.unlinked-001","timestamp":"1700000003","type":"text","text":{"body":"Hola"}}]},"field":"messages"}]}]}'
```

---

## Finanzas Commands

### VINCULAR (link account with code)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-vincular-001","timestamp":"1700000010","type":"text","text":{"body":"vincular ABC123"}}]},"field":"messages"}]}]}'
```

### DESVINCULAR (unlink account)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-desvinc-001","timestamp":"1700000011","type":"text","text":{"body":"desvincular"}}]},"field":"messages"}]}]}'
```

### AYUDA
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-ayuda-001","timestamp":"1700000012","type":"text","text":{"body":"ayuda"}}]},"field":"messages"}]}]}'
```

### CATEGORIAS
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-cat-001","timestamp":"1700000013","type":"text","text":{"body":"categorias"}}]},"field":"messages"}]}]}'
```

### RESUMEN (monthly summary)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-resumen-001","timestamp":"1700000014","type":"text","text":{"body":"resumen"}}]},"field":"messages"}]}]}'
```

### FIJOS (recurring payments)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-fijos-001","timestamp":"1700000015","type":"text","text":{"body":"fijos"}}]},"field":"messages"}]}]}'
```

### ANALISIS (AI financial analysis)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-analisis-001","timestamp":"1700000016","type":"text","text":{"body":"analisis"}}]},"field":"messages"}]}]}'
```

### Expense — simple
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-001","timestamp":"1700000017","type":"text","text":{"body":"$500 Super"}}]},"field":"messages"}]}]}'
```

### Expense — with category
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-002","timestamp":"1700000018","type":"text","text":{"body":"$1500 Cena con amigos #salidas"}}]},"field":"messages"}]}]}'
```

### Expense — with category + description
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.fin-expense-003","timestamp":"1700000019","type":"text","text":{"body":"$2.500 Nafta #transporte d:Cargué full el auto"}}]},"field":"messages"}]}]}'
```

---

## Grupos Commands

> Note: These require the user to exist in `ttc_user` and belong to a `ttc_group`.

### /ayuda
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-ayuda-001","timestamp":"1700000020","type":"text","text":{"body":"/ayuda"}}]},"field":"messages"}]}]}'
```

### /balance
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-balance-001","timestamp":"1700000021","type":"text","text":{"body":"/balance"}}]},"field":"messages"}]}]}'
```

### /lista
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-lista-001","timestamp":"1700000022","type":"text","text":{"body":"/lista"}}]},"field":"messages"}]}]}'
```

### /grupo
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-grupo-001","timestamp":"1700000023","type":"text","text":{"body":"/grupo"}}]},"field":"messages"}]}]}'
```

### /borrar
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-borrar-001","timestamp":"1700000024","type":"text","text":{"body":"/borrar"}}]},"field":"messages"}]}]}'
```

### Expense — simple (ARS)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-001","timestamp":"1700000025","type":"text","text":{"body":"Puse 5 lucas en la pizza"}}]},"field":"messages"}]}]}'
```

### Expense — with mentions
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-002","timestamp":"1700000026","type":"text","text":{"body":"3000 taxi con @Juan y @Maria"}}]},"field":"messages"}]}]}'
```

### Expense — foreign currency (USD)
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-expense-003","timestamp":"1700000027","type":"text","text":{"body":"50 dolares la cena"}}]},"field":"messages"}]}]}'
```

### Payment — I paid someone
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-pay-001","timestamp":"1700000028","type":"text","text":{"body":"Le pagué 5000 a @Juan"}}]},"field":"messages"}]}]}'
```

### Payment — I received
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-recv-001","timestamp":"1700000029","type":"text","text":{"body":"Recibí 3000 de @Maria"}}]},"field":"messages"}]}]}'
```

### AI Confirmation — Yes
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-confirm-001","timestamp":"1700000030","type":"text","text":{"body":"si"}}]},"field":"messages"}]}]}'
```

### AI Confirmation — No
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-confirm-002","timestamp":"1700000031","type":"text","text":{"body":"no"}}]},"field":"messages"}]}]}'
```

### Group Selection — pick group 1
```bash
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"906522075885946"},"contacts":[{"profile":{"name":"Imanol"},"wa_id":"5493513467739"}],"messages":[{"from":"5493513467739","id":"wamid.grp-select-001","timestamp":"1700000032","type":"text","text":{"body":"1"}}]},"field":"messages"}]}]}'
```
