import { spawn } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const port = process.env.PORT || '4000'
const extraArgs = process.argv.slice(2)

console.log(`🔌 Starting ngrok tunnel for http://localhost:${port}`)
console.log(`   Extra args: ${extraArgs.length ? extraArgs.join(' ') : '(none)'}`)
console.log('')

const child = spawn('ngrok', ['http', String(port), ...extraArgs], {
  stdio: 'inherit'
})

child.on('error', (err) => {
  if (err && err.code === 'ENOENT') {
    console.error('❌ ngrok binary not found on PATH.')
    console.error('   Install ngrok (or use the ngrok Desktop app) and try again.')
    console.error('   Quick check: `ngrok version`')
    process.exitCode = 127
    return
  }
  console.error('❌ Failed to start ngrok:', err)
  process.exitCode = 1
})

child.on('exit', (code, signal) => {
  if (signal) process.exitCode = 1
  else process.exitCode = code ?? 0
})
