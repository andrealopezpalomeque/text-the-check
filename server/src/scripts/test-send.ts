/**
 * Quick test: send a WhatsApp message via the API.
 *
 * Usage:
 *   npx tsx scripts/test-send.ts
 */

import 'dotenv/config'
import { sendMessage } from '../helpers/whatsapp.js'

// ─── Edit this ───────────────────────────────────────────────────
const PHONE = '5493794702813'
const TEXT = 'Test desde Text The Check server 🚀'
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Sending to ${PHONE}...`)
  const result = await sendMessage(PHONE, TEXT)
  console.log('Result:', result)
  process.exit(result.success ? 0 : 1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
