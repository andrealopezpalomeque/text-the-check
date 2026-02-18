# Resumen
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"5493513467739","text":{"body":"resumen"}}],"contacts":[{"profile":{"name":"Test User"}}]}}]}]}'

# Fijos
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"5493513467739","text":{"body":"fijos"}}],"contacts":[{"profile":{"name":"Test User"}}]}}]}]}'

# Analisis
curl -X POST http://localhost:4000/webhook -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"5493513467739","text":{"body":"analisis"}}],"contacts":[{"profile":{"name":"Test User"}}]}}]}]}'

