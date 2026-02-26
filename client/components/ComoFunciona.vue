<template>
  <section id="como-funciona" class="relative py-20 md:py-28 px-5 overflow-hidden">
    <!-- Subtle accent glow -->
    <div class="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-ttc-accent opacity-[0.025] pointer-events-none" style="filter: blur(100px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-16">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-accent mb-3">
          asi de facil
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text">
          Como funciona
        </h2>
        <p class="mt-3 font-body text-sm md:text-base text-ttc-text-muted max-w-md mx-auto">
          Tres pasos. Cero complicaciones.
        </p>
      </div>

      <!-- Steps -->
      <div class="relative">
        <!-- Connecting dotted line (desktop only) -->
        <div class="hidden md:block absolute top-[80px] left-[calc(16.67%+50px)] right-[calc(16.67%+50px)] pointer-events-none">
          <svg width="100%" height="4" class="overflow-visible">
            <line x1="0" y1="2" x2="100%" y2="2" stroke="var(--color-border)" stroke-width="2" stroke-dasharray="6 6" />
          </svg>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          <!-- Step 1: Send a message -->
          <div class="flex flex-col items-center text-center group">
            <div class="relative mb-6">
              <div class="w-40 h-40 rounded-2xl bg-ttc-card border border-ttc-border flex items-center justify-center transition-all duration-300 group-hover:border-[#4A90D9]/40 group-hover:shadow-[0_0_30px_-8px_var(--color-primary)]">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="text-ttc-primary">
                  <rect x="16" y="8" width="32" height="48" rx="6" stroke="currentColor" stroke-width="2" />
                  <rect x="19" y="14" width="26" height="36" rx="2" fill="currentColor" opacity="0.06" />
                  <g class="step-1-bubble">
                    <rect x="24" y="22" width="18" height="8" rx="4" fill="currentColor" opacity="0.2" />
                    <rect x="22" y="34" width="14" height="6" rx="3" fill="currentColor" opacity="0.12" />
                  </g>
                  <path d="M 50,30 l 6,-4 -6,-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" class="step-1-arrow" />
                  <line x1="28" y1="52" x2="36" y2="52" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3" />
                </svg>
              </div>
              <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ttc-primary text-white font-nunito font-bold text-xs flex items-center justify-center">1</div>
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">Manda un mensaje</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed max-w-[240px]">
              Escribi como hablas: "Pague 5.000 la pizza" o "Gaste 800 en el kiosco"
            </p>
          </div>

          <!-- Step 2: Recibito processes (INTERACTIVE) -->
          <div class="flex flex-col items-center text-center group">
            <div class="relative mb-6">
              <div
                class="w-40 h-40 rounded-2xl bg-ttc-card border border-ttc-border flex items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer group-hover:border-[#34D399]/40 group-hover:shadow-[0_0_30px_-8px_var(--color-accent)]"
                @mouseenter="step2Hover = true"
                @mouseleave="step2Hover = false"
              >
                <!-- Recibito: gets excited on hover -->
                <div :class="['transition-transform duration-500', step2Hover ? 'scale-110' : '']">
                  <svg width="72" height="90" viewBox="0 0 160 200" fill="none" class="text-ttc-accent">
                    <g :class="['recibito-step2-body', step2Hover ? 'recibito-step2-excited' : '']">
                      <g transform="rotate(-2, 80, 100)">
                        <path
                          d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 136,40 131,80 134,115 C 137,148 131,167 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 24,162 32,125 28,88 C 24,55 33,35 28,25 Z"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <!-- Normal eyes (thinking) -->
                        <g v-if="!step2Hover">
                          <circle cx="62" cy="88" r="5" fill="currentColor" />
                          <circle cx="100" cy="88" r="5" fill="currentColor" />
                        </g>
                        <!-- Excited eyes (big + sparkly) on hover -->
                        <g v-else>
                          <circle cx="62" cy="86" r="6.5" fill="currentColor" />
                          <circle cx="100" cy="86" r="6.5" fill="currentColor" />
                          <!-- Eye shine -->
                          <circle cx="65" cy="83" r="2" fill="var(--color-card)" />
                          <circle cx="103" cy="83" r="2" fill="var(--color-card)" />
                        </g>
                      </g>
                    </g>
                    <!-- Sparkles (always visible, more on hover) -->
                    <g :class="['step-2-sparkle', step2Hover ? 'step-2-sparkle-active' : '']">
                      <circle cx="20" cy="65" r="2.5" fill="currentColor" />
                      <circle cx="12" cy="80" r="1.5" fill="currentColor" />
                      <circle cx="140" cy="60" r="2" fill="currentColor" />
                      <circle cx="148" cy="75" r="1.5" fill="currentColor" />
                    </g>
                    <!-- Extra sparkles on hover -->
                    <g v-if="step2Hover" class="extra-sparkles">
                      <path d="M 22,45 l 0,-8 M 18,41 l 8,0" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
                      <path d="M 142,42 l 0,-6 M 139,39 l 6,0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
                      <circle cx="8" cy="100" r="2" fill="currentColor" opacity="0.4" />
                      <circle cx="152" cy="95" r="1.5" fill="currentColor" opacity="0.3" />
                    </g>
                    <!-- Processing arcs -->
                    <path d="M 15,95 A 8,8 0 0 1 15,110" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.2" />
                    <path d="M 145,90 A 8,8 0 0 0 145,105" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.2" />
                  </svg>
                </div>
              </div>
              <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ttc-accent text-white font-nunito font-bold text-xs flex items-center justify-center">2</div>
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">Recibito entiende</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed max-w-[240px]">
              Nuestra IA interpreta tu mensaje: monto, categoria, quien pago y a quien
            </p>
          </div>

          <!-- Step 3: Everything tracked -->
          <div class="flex flex-col items-center text-center group">
            <div class="relative mb-6">
              <div class="w-40 h-40 rounded-2xl bg-ttc-card border border-ttc-border flex items-center justify-center transition-all duration-300 group-hover:border-[#4A90D9]/40 group-hover:shadow-[0_0_30px_-8px_var(--color-primary)]">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="text-ttc-primary">
                  <path d="M 12,10 l 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 2,-2 2,2 L 52,10 L 52,54 l -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 -2,2 -2,-2 L 12,54 Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-opacity="0.05" />
                  <rect x="18" y="32" width="5" height="14" rx="1.5" fill="currentColor" opacity="0.3" />
                  <rect x="26" y="26" width="5" height="20" rx="1.5" fill="currentColor" opacity="0.5" />
                  <rect x="34" y="20" width="5" height="26" rx="1.5" fill="currentColor" opacity="0.7" />
                  <rect x="42" y="28" width="5" height="18" rx="1.5" fill="currentColor" opacity="0.4" />
                  <g class="step-3-check">
                    <circle cx="48" cy="16" r="7" fill="currentColor" opacity="0.15" />
                    <path d="M 44,16 l 3,3 5,-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <line x1="18" y1="18" x2="35" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.2" />
                </svg>
              </div>
              <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ttc-primary text-white font-nunito font-bold text-xs flex items-center justify-center">3</div>
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">Todo registrado</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed max-w-[240px]">
              Gastos, deudas y resumenes siempre al dia. Sin abrir ninguna app extra.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const step2Hover = ref(false)
</script>

<style scoped>
/* Step 1 animations */
.step-1-arrow {
  animation: arrowPulse 2s ease-in-out infinite;
}
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 0.5; }
  50% { transform: translateX(3px); opacity: 0.8; }
}
.step-1-bubble {
  animation: bubblePulse 3s ease-in-out infinite;
}
@keyframes bubblePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Step 2: Recibito body idle float */
.recibito-step2-body {
  animation: step2Float 3.5s ease-in-out infinite;
  transform-origin: center;
}
@keyframes step2Float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Step 2: Recibito excited on hover - little jump/wiggle */
.recibito-step2-excited {
  animation: step2Excited 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both !important;
}
@keyframes step2Excited {
  0% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(-10px) rotate(-4deg); }
  40% { transform: translateY(-2px) rotate(3deg); }
  60% { transform: translateY(-6px) rotate(-2deg); }
  80% { transform: translateY(-1px) rotate(1deg); }
  100% { transform: translateY(-3px) rotate(0deg); }
}

/* Step 2 sparkles */
.step-2-sparkle {
  opacity: 0.3;
  animation: sparkleFloat 3s ease-in-out infinite;
}
.step-2-sparkle-active {
  opacity: 0.7 !important;
  animation: sparkleOrbit 1.5s ease-in-out infinite !important;
}
@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes sparkleOrbit {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-4px) scale(1.2); }
  75% { transform: translateY(2px) scale(0.9); }
}

/* Extra sparkles pop-in */
.extra-sparkles {
  animation: sparklesPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes sparklesPop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

/* Step 3 */
.step-3-check {
  animation: checkBounce 2.5s ease-in-out infinite;
}
@keyframes checkBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
