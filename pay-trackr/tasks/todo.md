# PayTrackr - Task Tracking

<!-- Format: - [ ] Task description | - [x] Completed task -->

## Completed Tasks

### WhatsApp Media Processing + Recipient Recognition + Needs Revision

#### Phase 1: GeminiHandler Extensions [server]
- [x] 1A. Make `generateContent` support multimodal (inline media parts)
- [x] 1B. Add `transcribeAudio(base64, mimeType, userCategories)`
- [x] 1C. Add `parseTransferImage(base64, mimeType)`
- [x] 1D. Add `parseTransferPDF(base64, mimeType)`
- [x] 1E. Add `categorizeExpense(title, description, userCategories)`

#### Phase 2: Data Model Changes [frontend + server]
- [x] 2A. Payment schema — add source, needsRevision, recipient, audioTranscription
- [x] 2B. Payment interface — add new fields to interface
- [x] 2C. Update existing text flow — add source/needsRevision/recipient/audioTranscription to paymentData

#### Phase 3: Webhook Media Processing [server]
- [x] 3A. Add `downloadWhatsAppMedia(mediaId)` helper
- [x] 3B. Message type routing in POST handler
- [x] 3C. Recipient history matching (`findRecipientHistory`)
- [x] 3D. Shared transfer processing (`processTransferData`)
- [x] 3E. `processAudioMessage` handler
- [x] 3F. `processImageMessage` handler
- [x] 3G. `processPDFMessage` handler
- [x] 3H. Update AYUDA command help text

#### Phase 4: Frontend — Needs Revision Highlighting [frontend]
- [x] 4A. "Needs Revision" badge on payment cards
- [x] 4B. Source-specific icon on WhatsApp badge
- [x] 4C. Recipient data + audio transcription in edit modal
- [x] 4D. Clear `needsRevision` on save/review
- [x] 4E. Filter for "needs revision" payments (sort first)

#### Phase 5: Error Handling [server]
- [x] Integrated into Phase 3 handlers

### Weekly Summary Notification Feature
- [x] Create `server/handlers/GeminiHandler.js` — extracted Gemini API logic
- [x] Refactor `server/webhooks/wp_webhook.js` — uses GeminiHandler, removed inline getAIAnalysis
- [x] Create `server/scripts/send-weekly-summary.js` — CRON script with per-user stats + AI insight
- [x] Clean up `server/package.json` — removed test scripts, added weekly-summary script
- [x] Create `web/pages/weekly-summary.vue` — notification landing page with 3 cards
- [x] Create `.github/workflows/send-weekly-summary.yml` — Monday 9AM ART schedule

### UX Improvement - Laws of UX Audit
- [x] Batch 1: Dark Theme & Touch Fixes (C-1 through C-8)
- [x] Batch 2: Experience Improvements (I-1 through I-9)
- [x] Batch 3: Polish (P-1 through P-10)
