<template>
  <section class="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 px-5">
    <!-- Background: subtle dot grid pattern -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dotGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
      </svg>
    </div>

    <!-- Primary glow -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-ttc-primary opacity-[0.04] pointer-events-none" style="filter: blur(120px);" />

    <div class="relative z-10 max-w-6xl mx-auto">
      <div class="flex flex-col-reverse lg:flex-row lg:items-center lg:gap-16">

        <!-- Text column -->
        <div class="lg:w-[45%] text-center lg:text-left mt-10 lg:mt-0">
          <!-- Pill badge -->
          <div class="animate-fade-up">
            <span class="inline-flex items-center gap-2 rounded-full border border-[#4A90D9]/30 bg-[#4A90D9]/[0.08] px-5 py-2 font-body text-[11px] font-semibold uppercase tracking-[2px] text-ttc-primary">
              <svg width="14" height="14" viewBox="0 0 160 200" fill="none" class="inline-block">
                <path d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 136,40 131,80 134,115 C 137,148 131,167 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 24,162 32,125 28,88 C 24,55 33,35 28,25 Z" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Tu plata, a un mensaje
            </span>
          </div>

          <!-- Main heading -->
          <h1 class="mt-6 font-nunito font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] text-balance animate-fade-up" style="animation-delay: 0.1s;">
            Controla tus gastos
            <span class="relative inline-block">
              <span class="text-ttc-primary">desde WhatsApp</span>
              <svg class="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                <path d="M 0,4 l 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3 5,-3 5,3" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>

          <!-- Subtitle -->
          <p class="mt-5 font-body text-base md:text-lg text-ttc-text-muted leading-relaxed max-w-[480px] mx-auto lg:mx-0 animate-fade-up" style="animation-delay: 0.2s;">
            Dividi cuentas con amigos, registra gastos diarios y recibi resumenes inteligentes. Todo con un simple mensaje.
          </p>

          <!-- Buttons -->
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fade-up" style="animation-delay: 0.3s;">
            <a
              href="/login"
              class="inline-flex items-center gap-2 bg-ttc-primary text-white rounded-xl px-7 py-3.5 font-body text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Empezar gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <button
              @click="scrollToComoFunciona"
              class="inline-flex items-center gap-2 border border-ttc-border bg-transparent text-ttc-text rounded-xl px-7 py-3.5 font-body text-sm font-semibold hover:bg-ttc-card hover:border-ttc-text-dim transition-colors cursor-pointer"
            >
              Ver como funciona
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
        </div>

        <!-- Visual column: Phone + Recibito -->
        <div class="lg:w-[55%] flex justify-center items-center relative animate-fade-up" style="animation-delay: 0.15s;">

          <!-- Phone + Recibito wrapper (for hover zone) -->
          <div class="phone-recibito-zone" @mouseenter="onPhoneHover" @mouseleave="onPhoneLeave">

            <!-- RECIBITO: Peeking from behind the phone -->
            <div
              :class="[
                'recibito-peek',
                recibitoRevealed ? 'recibito-revealed' : '',
                !hasInteracted ? 'recibito-idle' : ''
              ]"
            >
              <svg width="120" height="150" viewBox="0 0 160 200" fill="none" class="text-ttc-primary">
                <!-- Receipt body with slight tilt -->
                <g transform="rotate(3, 80, 100)">
                  <path
                    d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 136,40 131,80 134,115 C 137,148 131,167 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 24,162 32,125 28,88 C 24,55 33,35 28,25 Z"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <!-- Eyes: change expression based on state -->
                  <!-- Curious eyes (peeking) when hidden -->
                  <g v-if="!recibitoRevealed">
                    <circle cx="62" cy="90" r="5" fill="currentColor"/>
                    <circle cx="100" cy="87" r="5" fill="currentColor"/>
                  </g>
                  <!-- Happy eyes (smiling arcs) when revealed -->
                  <g v-else>
                    <path d="M 55,88 Q 62,80 69,88" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none" />
                    <path d="M 93,88 Q 100,80 107,88" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none" />
                  </g>
                </g>
                <!-- Wave motion lines (only when revealed) -->
                <g :class="['wave-lines', recibitoRevealed ? 'wave-active' : '']">
                  <path d="M 145,60 Q 153,56 158,62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5" />
                  <path d="M 147,72 Q 155,68 160,74" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.35" />
                  <path d="M 146,84 Q 154,80 159,86" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.2" />
                </g>
                <!-- Floating "!" when revealed (excited) -->
                <g v-if="recibitoRevealed" class="exclaim-pop">
                  <path d="M 135,30 L 135,18" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5" />
                  <circle cx="135" cy="36" r="2" fill="currentColor" opacity="0.5" />
                </g>
                <!-- Floating "?" when peeking (curious) -->
                <g v-else opacity="0.3">
                  <path d="M 130,34 C 130,26 138,23 142,28 C 146,33 140,38 136,40 L 136,46" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" />
                  <circle cx="136" cy="52" r="2" fill="currentColor"/>
                </g>
              </svg>
            </div>

            <!-- Phone mockup -->
            <div class="phone-frame">
              <div class="phone-island" />

              <div class="phone-screen">
                <!-- WhatsApp header -->
                <div class="flex items-center gap-2.5 px-4 py-3 border-b border-ttc-border">
                  <div class="w-8 h-8 rounded-full bg-[#4A90D9]/15 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 160 200" fill="none" class="text-ttc-primary">
                      <path d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 136,40 131,80 134,115 C 137,148 131,167 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 24,162 32,125 28,88 C 24,55 33,35 28,25 Z" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p class="font-nunito text-xs font-bold text-ttc-text leading-tight">Text the Check</p>
                    <p class="font-body text-[10px] text-ttc-accent leading-tight">en linea</p>
                  </div>
                </div>

                <!-- Chat messages: fixed height, crossfade -->
                <div class="chat-area">
                  <Transition name="chat-fade" mode="out-in">
                    <div :key="activeMode" class="chat-messages px-3 py-3 space-y-2">
                      <div
                        v-for="(msg, i) in currentMessages"
                        :key="i"
                        :class="['flex', msg.sender === 'user' ? 'justify-end' : 'justify-start']"
                        class="chat-msg-stagger"
                        :style="{ animationDelay: i * 0.08 + 's' }"
                      >
                        <div
                          :class="[
                            'max-w-[82%] rounded-2xl px-3 py-2',
                            msg.sender === 'user'
                              ? activeMode === 'viajes' ? 'bg-ttc-bubble-user-primary' : 'bg-ttc-bubble-user-accent'
                              : 'bg-ttc-bubble-bot'
                          ]"
                        >
                          <p class="font-body text-[11px] leading-relaxed text-ttc-text">{{ msg.text }}</p>
                          <p class="font-body text-[9px] text-ttc-text-muted text-right mt-0.5">{{ msg.time }}</p>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Input bar -->
                <div class="px-3 py-2 border-t border-ttc-border">
                  <div class="flex items-center gap-2 rounded-full border border-ttc-border bg-ttc-surface px-3 py-1.5">
                    <span class="flex-1 font-body text-[10px] text-ttc-text-muted">Escribi un mensaje...</span>
                    <div :class="['w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500', activeMode === 'viajes' ? 'bg-ttc-primary' : 'bg-ttc-accent']">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mode indicator pills -->
              <div class="flex justify-center gap-2 mt-4">
                <button
                  @click="switchMode('viajes')"
                  :class="[
                    'px-3 py-1 rounded-full font-body text-[10px] font-semibold transition-all duration-300 cursor-pointer',
                    activeMode === 'viajes'
                      ? 'bg-[#4A90D9]/15 text-ttc-primary border border-[#4A90D9]/30'
                      : 'text-ttc-text-muted border border-transparent hover:text-ttc-text'
                  ]"
                >
                  Grupos
                </button>
                <button
                  @click="switchMode('finanzas')"
                  :class="[
                    'px-3 py-1 rounded-full font-body text-[10px] font-semibold transition-all duration-300 cursor-pointer',
                    activeMode === 'finanzas'
                      ? 'bg-[#34D399]/15 text-ttc-accent border border-[#34D399]/30'
                      : 'text-ttc-text-muted border border-transparent hover:text-ttc-text'
                  ]"
                >
                  Finanzas
                </button>
              </div>
            </div>
          </div>

          <!-- Decorative floating elements -->
          <div class="absolute -bottom-4 left-4 lg:left-0 opacity-20 pointer-events-none">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-ttc-primary">
              <circle cx="12" cy="12" r="10" stroke-dasharray="3 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt-edge section divider -->
    <div class="absolute bottom-0 left-0 right-0 h-3 overflow-hidden opacity-10">
      <svg width="100%" height="12" preserveAspectRatio="none">
        <path d="M 0,6 l 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5" stroke="var(--color-primary)" stroke-width="1.5" fill="none" />
      </svg>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const activeMode = ref('viajes')
const recibitoRevealed = ref(false)
const hasInteracted = ref(false)
let modeInterval = null

const chatData = {
  viajes: [
    { sender: 'user', text: 'Pague 12.000 la cena para todos', time: '21:32' },
    { sender: 'bot', text: 'Listo, gasto registrado! Gonza, Mili y Sofi te deben $3.000 c/u.', time: '21:32' },
    { sender: 'user', text: 'Cuanto me deben en total?', time: '21:33' },
    { sender: 'bot', text: 'Te deben $14.500 en total. Gonza: $6.500, Mili: $4.000, Sofi: $4.000.', time: '21:33' },
  ],
  finanzas: [
    { sender: 'user', text: 'Gaste 2.500 en el super', time: '18:15' },
    { sender: 'bot', text: 'Registrado en Supermercado. Llevas $18.200 esta semana.', time: '18:15' },
    { sender: 'user', text: 'Como vengo este mes?', time: '18:16' },
    { sender: 'bot', text: 'Llevas $85.400 de $120.000. Vas bien, te quedan 12 dias.', time: '18:16' },
  ],
}

const currentMessages = computed(() => chatData[activeMode.value])

function switchMode(mode) {
  activeMode.value = mode
  resetInterval()
}

function resetInterval() {
  if (modeInterval) clearInterval(modeInterval)
  modeInterval = setInterval(() => {
    activeMode.value = activeMode.value === 'viajes' ? 'finanzas' : 'viajes'
  }, 8000)
}

function onPhoneHover() {
  recibitoRevealed.value = true
  hasInteracted.value = true
}

function onPhoneLeave() {
  recibitoRevealed.value = false
}

onMounted(() => {
  resetInterval()
})

onUnmounted(() => {
  if (modeInterval) clearInterval(modeInterval)
})

const scrollToComoFunciona = () => {
  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
/* Phone + Recibito hover zone */
.phone-recibito-zone {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Extra padding for recibito overflow */
  padding: 20px 60px 0 20px;
}

/* Phone frame */
.phone-frame {
  width: 280px;
  position: relative;
  z-index: 2;
}

@media (min-width: 640px) {
  .phone-frame {
    width: 300px;
  }
}

.phone-screen {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 0 1px var(--color-border),
    0 20px 60px -12px rgba(0, 0, 0, 0.4),
    0 0 80px -20px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.phone-island {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 22px;
  background: var(--color-bg);
  border-radius: 20px;
  z-index: 10;
  border: 1px solid var(--color-border);
}

/* Fixed-height chat area to prevent layout shifts */
.chat-area {
  height: 260px;
  overflow: hidden;
  position: relative;
}

/* Chat crossfade transition */
.chat-fade-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.chat-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.chat-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Staggered message entrance */
.chat-msg-stagger {
  animation: msgFadeIn 0.4s ease-out both;
}

@keyframes msgFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================================
   RECIBITO: Peek from behind phone
   ======================================== */
.recibito-peek {
  position: absolute;
  right: -20px;
  top: 50%;
  z-index: 1;
  /* Start mostly hidden behind the phone */
  transform: translateY(-50%) translateX(20px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

/* Idle state: gentle peek animation to attract attention */
.recibito-idle {
  animation: recibItoPeek 4s ease-in-out infinite;
}

@keyframes recibItoPeek {
  0%, 100% {
    transform: translateY(-50%) translateX(20px);
  }
  30%, 50% {
    transform: translateY(-50%) translateX(5px);
  }
  35%, 45% {
    transform: translateY(-52%) translateX(3px) rotate(-3deg);
  }
  40% {
    transform: translateY(-48%) translateX(5px) rotate(2deg);
  }
}

/* Revealed state: slides out, bounces, waves */
.recibito-revealed {
  transform: translateY(-55%) translateX(-30px) rotate(5deg) !important;
  animation: recibitoWave 1.2s ease-in-out infinite !important;
}

@keyframes recibitoWave {
  0%, 100% {
    transform: translateY(-55%) translateX(-30px) rotate(5deg);
  }
  15% {
    transform: translateY(-58%) translateX(-32px) rotate(8deg);
  }
  30% {
    transform: translateY(-52%) translateX(-28px) rotate(2deg);
  }
  50% {
    transform: translateY(-56%) translateX(-30px) rotate(6deg);
  }
  70% {
    transform: translateY(-54%) translateX(-31px) rotate(3deg);
  }
}

/* Wave lines animation */
.wave-lines {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.wave-active {
  opacity: 1;
  animation: wavePulse 1.5s ease-in-out infinite;
}

@keyframes wavePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Exclamation pop-in */
.exclaim-pop {
  animation: exclaimPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes exclaimPop {
  from {
    opacity: 0;
    transform: scale(0) translateY(5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Mobile adjustments */
@media (max-width: 639px) {
  .phone-recibito-zone {
    padding: 10px 40px 0 10px;
  }
  .recibito-peek {
    right: -15px;
  }
  .recibito-peek svg {
    width: 90px;
    height: 112px;
  }
  .recibito-revealed {
    transform: translateY(-55%) translateX(-15px) rotate(5deg) !important;
  }
  @keyframes recibitoWave {
    0%, 100% { transform: translateY(-55%) translateX(-15px) rotate(5deg); }
    15% { transform: translateY(-58%) translateX(-17px) rotate(8deg); }
    30% { transform: translateY(-52%) translateX(-13px) rotate(2deg); }
    50% { transform: translateY(-56%) translateX(-15px) rotate(6deg); }
    70% { transform: translateY(-54%) translateX(-16px) rotate(3deg); }
  }
}
</style>
