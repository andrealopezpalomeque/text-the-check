<template>
  <section class="relative py-20 md:py-28 px-5 overflow-hidden">
    <!-- Receipt-edge top border -->
    <div class="absolute top-0 left-0 right-0 h-3 overflow-hidden opacity-10">
      <svg width="100%" height="12" preserveAspectRatio="none">
        <path d="M 0,6 l 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5" stroke="var(--color-primary)" stroke-width="1.5" fill="none" />
      </svg>
    </div>

    <!-- Glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-ttc-primary/[0.04] pointer-events-none" style="filter: blur(100px);" />

    <div class="relative z-10 max-w-2xl mx-auto text-center">
      <!-- Recibito happy character — BIG, interactive -->
      <div class="mb-8 flex justify-center">
        <div
          :class="['recibito-cta', ctaHover ? 'recibito-cta-dancing' : '']"
          @mouseenter="ctaHover = true"
          @mouseleave="ctaHover = false"
          class="cursor-pointer"
        >
          <svg width="140" height="175" viewBox="0 0 160 200" fill="none" class="text-ttc-primary" style="filter: drop-shadow(0 8px 20px rgba(74, 144, 217, 0.15));">
            <g transform="rotate(2, 80, 100)">
              <path
                d="M 28,25 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 136,40 131,80 134,115 C 137,148 131,167 132,175 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 24,162 32,125 28,88 C 24,55 33,35 28,25 Z"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Happy eyes (smiling arcs) -->
              <g v-if="!ctaHover">
                <path d="M 55,90 Q 62,83 69,90" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
                <path d="M 93,90 Q 100,83 107,90" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
              </g>
              <!-- Super happy on hover: bigger smiles + blush -->
              <g v-else>
                <path d="M 52,90 Q 62,79 72,90" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none" />
                <path d="M 90,90 Q 100,79 110,90" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" fill="none" />
                <!-- Blush circles -->
                <circle cx="50" cy="98" r="6" fill="currentColor" opacity="0.08" />
                <circle cx="112" cy="98" r="6" fill="currentColor" opacity="0.08" />
              </g>
            </g>
            <!-- Sparkles (always) -->
            <g :class="ctaHover ? 'sparkles-party' : 'sparkles-calm'" >
              <path d="M 140,50 l 0,-7 M 136.5,46.5 l 7,0" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4" />
              <path d="M 18,60 l 0,-5 M 15.5,57.5 l 5,0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3" />
            </g>
            <!-- Extra sparkles on hover -->
            <g v-if="ctaHover" class="party-sparkles">
              <path d="M 6,45 l 0,-5 M 3.5,42.5 l 5,0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
              <path d="M 155,80 l 0,-5 M 152.5,77.5 l 5,0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
              <circle cx="10" cy="110" r="2.5" fill="currentColor" opacity="0.3" />
              <circle cx="150" cy="115" r="2" fill="currentColor" opacity="0.25" />
              <circle cx="25" cy="15" r="2" fill="currentColor" opacity="0.35" />
              <circle cx="135" cy="10" r="1.5" fill="currentColor" opacity="0.3" />
              <!-- Confetti-like lines -->
              <line x1="5" y1="75" x2="10" y2="70" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3" />
              <line x1="150" y1="50" x2="155" y2="45" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.25" />
            </g>
          </svg>
        </div>
      </div>

      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text mb-4">
        Tu plata, a un mensaje
      </h2>

      <p class="font-body text-sm md:text-base text-ttc-text-muted leading-relaxed mb-8 max-w-md mx-auto">
        Empeza a controlar tus finanzas hoy. Sin descargas, sin registros largos — solo tu WhatsApp.
      </p>

      <a
        href="/login"
        class="inline-flex items-center gap-2.5 bg-ttc-primary text-white rounded-xl px-8 py-4 font-body text-base font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-ttc-primary/20"
      >
        Empezar gratis
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>

      <p class="mt-4 font-body text-xs text-ttc-text-muted">
        Inicia sesion con Google — sin tarjeta, sin vueltas
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const ctaHover = ref(false)
</script>

<style scoped>
/* Recibito CTA: gentle float by default */
.recibito-cta {
  animation: ctaFloat 4s ease-in-out infinite;
  transition: filter 0.3s ease;
}

@keyframes ctaFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(1deg); }
  75% { transform: translateY(2px) rotate(-1deg); }
}

/* Dancing on hover: happy wiggle */
.recibito-cta-dancing {
  animation: ctaDance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite !important;
}

@keyframes ctaDance {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  12% { transform: translateY(-14px) rotate(-6deg) scale(1.05); }
  25% { transform: translateY(-4px) rotate(4deg) scale(1.02); }
  37% { transform: translateY(-10px) rotate(-3deg) scale(1.04); }
  50% { transform: translateY(-2px) rotate(5deg) scale(1); }
  62% { transform: translateY(-12px) rotate(-4deg) scale(1.03); }
  75% { transform: translateY(-3px) rotate(3deg) scale(1.01); }
  87% { transform: translateY(-8px) rotate(-2deg) scale(1.02); }
}

/* Sparkles calm */
.sparkles-calm {
  animation: sparkleCalm 3s ease-in-out infinite;
}
@keyframes sparkleCalm {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Sparkles party */
.sparkles-party {
  animation: sparkleParty 0.8s ease-in-out infinite !important;
}
@keyframes sparkleParty {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

/* Party sparkles entrance */
.party-sparkles {
  animation: partyPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes partyPop {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}
</style>
