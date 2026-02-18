import process from 'node:process'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const token = process.env.WHATSAPP_API_TOKEN
const wabaId = process.env.WHATSAPP_ACCOUNT_ID

if (!token) {
  console.error('❌ Missing WHATSAPP_API_TOKEN in server/.env')
  process.exit(1)
}

if (!wabaId) {
  console.error('❌ Missing WHATSAPP_ACCOUNT_ID (WABA ID) in server/.env')
  process.exit(1)
}

const url = `https://graph.facebook.com/v18.0/${wabaId}/subscribed_apps`

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  const bodyText = await response.text()
  let body
  try {
    body = JSON.parse(bodyText)
  } catch {
    body = bodyText
  }

  if (!response.ok) {
    console.error(`❌ Graph API error (${response.status}) calling ${url}`)
    console.error(body)
    process.exit(1)
  }

  console.log('✅ Subscribed apps (WABA):')
  console.log(JSON.stringify(body, null, 2))
} catch (err) {
  console.error('❌ Failed to call Graph API:', err)
  process.exit(1)
}
