<template>
  <div ref="rootEl" class="whatsapp-hero-demo">
    <!-- Phone Frame -->
    <div class="phone-frame">
      <!-- Notch -->
      <div class="phone-notch" />

      <!-- Screen -->
      <div class="phone-screen">
        <!-- WhatsApp Header -->
        <div class="wa-header">
          <div class="wa-header-back">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="#aaa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="wa-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 3c-.5 0-1 .1-1.2.5C4.5 4 5 4.5 5 5v14c0 .5-.3 1 .2 1.3.3.2.7.2 1 0L8 19h10c1 0 2-1 2-2V5c0-1-1-2-2-2H6z" fill="white" opacity="0.9" />
              <path d="M9 9h6M9 12h4" stroke="#4A90D9" stroke-width="1.2" stroke-linecap="round" />
            </svg>
          </div>
          <div class="wa-header-info">
            <div class="wa-header-name">Text the Check</div>
            <div class="wa-header-status" :class="{ 'wa-header-status--typing': isTypingStatus }">
              {{ statusText }}
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div ref="chatEl" class="wa-chat">
          <TransitionGroup name="bubble">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="wa-msg-row"
              :class="msg.sent ? 'wa-msg-row--sent' : 'wa-msg-row--received'"
            >
              <!-- Date badge -->
              <template v-if="msg.type === 'date'">
                <div class="wa-date-badge">
                  <span>Hoy</span>
                </div>
              </template>

              <!-- Typing indicator -->
              <template v-else-if="msg.type === 'typing'">
                <div class="wa-bubble wa-bubble--received">
                  <div class="wa-typing-dots">
                    <div class="wa-typing-dot" />
                    <div class="wa-typing-dot" />
                    <div class="wa-typing-dot" />
                  </div>
                </div>
              </template>

              <!-- Chat bubble -->
              <template v-else>
                <div
                  class="wa-bubble"
                  :class="msg.sent ? 'wa-bubble--sent' : 'wa-bubble--received'"
                >
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div class="wa-bubble-text" v-html="msg.html" />
                  <div class="wa-bubble-meta">
                    <span class="wa-bubble-time">{{ msg.time }}</span>
                    <svg v-if="msg.sent" class="wa-checkmarks" width="16" height="10" viewBox="0 0 16 10">
                      <path d="M1 5l3 3 7-7" stroke="#53bdeb" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M4 5l3 3 7-7" stroke="#53bdeb" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                </div>
              </template>
            </div>
          </TransitionGroup>
        </div>

        <!-- Input Bar -->
        <div class="wa-input-bar">
          <div class="wa-input-emoji">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8696a0">
              <circle cx="12" cy="12" r="10" fill="none" stroke="#8696a0" stroke-width="1.5" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" fill="none" stroke="#8696a0" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="9" cy="10" r="1" />
              <circle cx="15" cy="10" r="1" />
            </svg>
          </div>
          <div class="wa-input-field" :class="{ 'wa-input-field--active': inputText }">
            {{ inputText }}
          </div>
          <Transition name="send-fade">
            <div v-if="inputText" class="wa-send-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Brand Tagline -->
    <div class="wa-brand-tag" :class="{ 'wa-brand-tag--visible': showTagline }">
      Tu plata, a un mensaje
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  speed: { type: Number, default: 1 },
  autoplay: { type: Boolean, default: true },
})

const rootEl = ref(null)
const chatEl = ref(null)

const messages = ref([])
const inputText = ref('')
const statusText = ref('en línea')
const isTypingStatus = ref(false)
const showTagline = ref(false)

let msgIdCounter = 0
let timeouts = []
let typingInterval = null
let isVisible = false
let observer = null
let animationRunning = false

function delay(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms / props.speed)
    timeouts.push(id)
  })
}

function scrollChat() {
  nextTick(() => {
    if (chatEl.value) {
      chatEl.value.scrollTop = chatEl.value.scrollHeight
    }
  })
}

function addMessage(msg) {
  messages.value.push({ ...msg, id: ++msgIdCounter })
  scrollChat()
}

function removeLastMessage() {
  messages.value.pop()
}

function typeInInput(text) {
  return new Promise((resolve) => {
    inputText.value = ''
    let i = 0
    typingInterval = setInterval(() => {
      inputText.value = text.slice(0, ++i)
      if (i >= text.length) {
        clearInterval(typingInterval)
        typingInterval = null
        const id = setTimeout(resolve, 400 / props.speed)
        timeouts.push(id)
      }
    }, 45 / props.speed)
  })
}

function clearInput() {
  inputText.value = ''
}

function setBotTyping(active) {
  isTypingStatus.value = active
  statusText.value = active ? 'escribiendo...' : 'en línea'
}

async function runDemo() {
  if (!isVisible) {
    animationRunning = false
    return
  }
  animationRunning = true

  messages.value = []
  clearInput()
  showTagline.value = false

  await delay(800)
  if (!isVisible) { animationRunning = false; return }

  // Date badge
  addMessage({ type: 'date' })

  await delay(600)
  if (!isVisible) { animationRunning = false; return }

  // Step 1: User types expense
  await typeInInput('gasté 150 en pizza con Juan')
  if (!isVisible) { animationRunning = false; return }
  clearInput()

  addMessage({
    type: 'text',
    sent: true,
    html: 'gasté 150 en pizza con Juan',
    time: '18:42',
  })

  await delay(500)
  if (!isVisible) { animationRunning = false; return }

  // Step 2: Bot typing
  setBotTyping(true)
  addMessage({ type: 'typing' })

  await delay(1800)
  if (!isVisible) { animationRunning = false; return }
  removeLastMessage()
  setBotTyping(false)

  // Step 3: Bot confirmation card
  addMessage({
    type: 'text',
    sent: false,
    html:
      'Entendido. Registré esto:<br><br>' +
      '<div class="wa-card">' +
        '<div class="wa-card-label">Monto</div>' +
        '<div class="wa-card-amount">$150</div>' +
        '<div class="wa-card-label">Descripción</div>' +
        '<div class="wa-card-value">Pizza</div>' +
        '<div class="wa-card-label">Pagó</div>' +
        '<div class="wa-card-value">Vos</div>' +
        '<div class="wa-card-label">Dividido con</div>' +
        '<div class="wa-card-value">Juan</div>' +
      '</div>' +
      '<div class="wa-confirm-row">¿Confirmo? ' +
        '<span class="wa-btn-yes">Sí</span> / ' +
        '<span class="wa-btn-no">No</span>' +
      '</div>',
    time: '18:42',
  })

  await delay(2000)
  if (!isVisible) { animationRunning = false; return }

  // Step 4: User confirms
  await typeInInput('Sí')
  if (!isVisible) { animationRunning = false; return }
  clearInput()

  addMessage({ type: 'text', sent: true, html: 'Sí', time: '18:42' })

  await delay(400)
  if (!isVisible) { animationRunning = false; return }

  // Bot typing again
  setBotTyping(true)
  addMessage({ type: 'typing' })

  await delay(1200)
  if (!isVisible) { animationRunning = false; return }
  removeLastMessage()
  setBotTyping(false)

  // Step 5: Bot confirms expense
  addMessage({
    type: 'text',
    sent: false,
    html:
      '<div class="wa-success-row">' +
        '<div class="wa-success-icon">' +
          '<svg width="10" height="10" viewBox="0 0 16 16"><path d="M3 8l4 4 6-7" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<span class="wa-success-text">Gasto registrado</span>' +
      '</div>' +
      'Pizza — $150<br>' +
      'Juan te debe <span class="wa-success-text" style="font-weight:600;">$75</span>',
    time: '18:42',
  })

  await delay(1500)
  if (!isVisible) { animationRunning = false; return }

  showTagline.value = true

  await delay(4000)

  // Loop
  if (isVisible) {
    runDemo()
  } else {
    animationRunning = false
  }
}

onMounted(() => {
  if (!props.autoplay) return

  observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && !animationRunning) {
        runDemo()
      }
    },
    { threshold: 0.3 },
  )

  if (rootEl.value) {
    observer.observe(rootEl.value)
  }
})

onBeforeUnmount(() => {
  timeouts.forEach(clearTimeout)
  timeouts = []
  if (typingInterval) clearInterval(typingInterval)
  if (observer) {
    observer.disconnect()
    observer = null
  }
  animationRunning = false
  isVisible = false
})
</script>

<style scoped>
.whatsapp-hero-demo {
  width: 320px;
  flex-shrink: 0;
}

/* Phone Frame */
.phone-frame {
  background: #1a1a2e;
  border-radius: 36px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.phone-notch {
  width: 40px;
  height: 5px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  margin: 0 auto 8px;
}

.phone-screen {
  border-radius: 24px;
  overflow: hidden;
  height: 460px;
  display: flex;
  flex-direction: column;
  background: #0b141a;
}

/* WhatsApp Header */
.wa-header {
  background: #1f2c34;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.wa-header-back {
  width: 8px;
  height: 14px;
  display: flex;
  align-items: center;
}

.wa-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #4A90D9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wa-header-info {
  flex: 1;
  min-width: 0;
}

.wa-header-name {
  color: #e9edef;
  font-size: 13px;
  font-weight: 500;
  font-family: system-ui, sans-serif;
}

.wa-header-status {
  color: #8696a0;
  font-size: 11px;
  font-family: system-ui, sans-serif;
  transition: color 0.3s;
}

.wa-header-status--typing {
  color: #00a884;
}

/* Chat Area */
.wa-chat {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #0b141a;
}

/* Message rows */
.wa-msg-row {
  display: flex;
}

.wa-msg-row--sent {
  justify-content: flex-end;
}

.wa-msg-row--received {
  justify-content: flex-start;
}

/* Bubbles */
.wa-bubble {
  padding: 6px 8px 4px;
  position: relative;
}

.wa-bubble--sent {
  background: #005c4b;
  border-radius: 8px 2px 8px 8px;
  max-width: 78%;
}

.wa-bubble--received {
  background: #1f2c34;
  border-radius: 2px 8px 8px 8px;
  max-width: 82%;
}

.wa-bubble-text {
  color: #e9edef;
  font-size: 13px;
  font-family: system-ui, sans-serif;
  line-height: 1.35;
}

.wa-bubble-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
}

.wa-bubble-time {
  color: #8696a0;
  font-size: 10px;
  font-family: system-ui, sans-serif;
}

.wa-checkmarks {
  flex-shrink: 0;
}

/* Typing indicator */
.wa-typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 6px;
}

.wa-typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8696a0;
  animation: typingDot 1.4s ease-in-out infinite;
}

.wa-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.wa-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Date badge */
.wa-date-badge {
  text-align: center;
  margin: 8px 0;
  width: 100%;
}

.wa-date-badge span {
  background: #1a2630;
  color: #8696a0;
  font-size: 11px;
  font-family: system-ui, sans-serif;
  padding: 4px 12px;
  border-radius: 6px;
}

/* Confirmation card (inside bubble) */
:deep(.wa-card) {
  background: rgba(74, 144, 217, 0.12);
  border-left: 3px solid #4A90D9;
  border-radius: 0 6px 6px 0;
  padding: 8px 10px;
  margin: 4px 0;
}

:deep(.wa-card-label) {
  font-size: 12px;
  color: #8696a0;
  margin-top: 4px;
}

:deep(.wa-card-label:first-child) {
  margin-top: 0;
}

:deep(.wa-card-amount) {
  font-size: 18px;
  font-weight: 600;
  color: #4A90D9;
  margin: 2px 0;
}

:deep(.wa-card-value) {
  color: #e9edef;
  font-size: 13px;
}

:deep(.wa-confirm-row) {
  margin-top: 6px;
  color: #e9edef;
  font-size: 13px;
}

:deep(.wa-btn-yes) {
  background: rgba(0, 168, 132, 0.15);
  color: #00a884;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

:deep(.wa-btn-no) {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Success row */
:deep(.wa-success-row) {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

:deep(.wa-success-icon) {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #34D399;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.wa-success-text) {
  color: #34D399;
  font-weight: 600;
  font-size: 13px;
}

/* Input Bar */
.wa-input-bar {
  background: #1f2c34;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.wa-input-emoji {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wa-input-field {
  flex: 1;
  background: #2a3942;
  border-radius: 20px;
  padding: 8px 14px;
  color: #8696a0;
  font-size: 13px;
  font-family: system-ui, sans-serif;
  min-height: 18px;
  transition: color 0.3s;
}

.wa-input-field--active {
  color: #e9edef;
}

.wa-send-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Transitions */
.bubble-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.bubble-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.bubble-leave-active {
  transition: all 0.2s ease;
}

.bubble-leave-to {
  opacity: 0;
}

.send-fade-enter-active,
.send-fade-leave-active {
  transition: opacity 0.3s;
}

.send-fade-enter-from,
.send-fade-leave-to {
  opacity: 0;
}

/* Brand Tagline */
.wa-brand-tag {
  text-align: center;
  margin-top: 16px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 1s;
}

.wa-brand-tag--visible {
  opacity: 1;
}

/* Responsive scaling */
@media (max-width: 767px) {
  .whatsapp-hero-demo {
    width: 280px;
  }

  .phone-screen {
    height: 400px;
  }
}
</style>
