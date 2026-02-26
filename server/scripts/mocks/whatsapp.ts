/**
 * Mock WhatsApp helpers — captures outbound messages to globalThis array.
 */

interface CapturedMessage { to: string; text: string }

declare global {
  var __testCapturedMessages: CapturedMessage[]
}
globalThis.__testCapturedMessages ??= []

export async function sendMessage(to: string, text: string) {
  globalThis.__testCapturedMessages.push({ to, text })
  return { success: true, messageId: 'mock-msg-id' }
}

export async function downloadMedia(_mediaId: string) {
  return null
}
