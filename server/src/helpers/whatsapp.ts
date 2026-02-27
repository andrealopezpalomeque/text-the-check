/**
 * WhatsApp Cloud API helpers — send messages & download media.
 * Stateless functions used by both handlers.
 */

import { normalizeForSending } from './phone.js'

const GRAPH_API_VERSION = 'v21.0'

interface SendMessageResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a text message via WhatsApp Business API.
 * Phone is normalized (549→54) before sending.
 */
export async function sendMessage(to: string, text: string): Promise<SendMessageResponse> {
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!apiToken || !phoneNumberId) {
    console.log(`[SEND] Credentials not configured, would send to ${to}: ${text.slice(0, 60)}...`)
    return { success: false, error: 'WhatsApp credentials not configured' }
  }

  const normalizedTo = normalizeForSending(to)
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    })

    const data: any = await response.json()

    if (!response.ok) {
      console.error('[SEND] WhatsApp API error:', data)
      return { success: false, error: data.error?.message || 'Unknown API error' }
    }

    console.log(`[SEND] Message sent to ${normalizedTo} (id: ${data.messages?.[0]?.id || 'unknown'})`)
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('[SEND] Error sending WhatsApp message:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Download media (audio/image/PDF) from WhatsApp Graph API.
 * Returns base64 + mimeType, or null on failure.
 */
export async function downloadMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  const apiToken = process.env.WHATSAPP_API_TOKEN
  if (!apiToken) {
    console.log('[MEDIA] WhatsApp credentials not configured, cannot download media')
    return null
  }

  try {
    // Step 1: Get the media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    )
    if (!mediaResponse.ok) {
      console.error('[MEDIA] Error getting media URL:', await mediaResponse.text())
      return null
    }

    const mediaInfo: any = await mediaResponse.json()
    const mediaUrl = mediaInfo.url
    const mimeType = mediaInfo.mime_type || 'application/octet-stream'

    // Step 2: Download the actual media
    const downloadResponse = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    })
    if (!downloadResponse.ok) {
      console.error('[MEDIA] Error downloading media')
      return null
    }

    const buffer = await downloadResponse.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { base64, mimeType }
  } catch (error) {
    console.error('[MEDIA] Error downloading WhatsApp media:', error)
    return null
  }
}
