<template>
  <section class="relative py-16 md:py-20 px-5 overflow-hidden">
    <!-- Subtle background glow -->
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none opacity-[0.04]"
      style="background: radial-gradient(ellipse, #4A90D9 0%, transparent 70%); filter: blur(60px);"
    />

    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Section label -->
      <div class="text-center mb-4">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary">
          ¿te suena esto?
        </p>
      </div>

      <!-- Headline -->
      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text text-center mb-4 leading-tight">
        El chat que nadie termina<br class="hidden sm:block"> de entender
      </h2>

      <!-- Subtitle -->
      <p class="font-body text-sm sm:text-base text-ttc-text-muted text-center max-w-md mx-auto mb-12 leading-relaxed">
        "¿quién pagó la pizza?", "yo te debo del viaje anterior", "no sé cuánto puse yo"&hairsp;—&hairsp;todos en el mismo grupo, nadie con la cuenta clara.
      </p>

      <!-- Illustration area: Recibito + floating bubbles -->
      <div
        ref="illustrationRef"
        class="relative flex justify-center items-center mb-10 illustration-block opacity-0"
      >
        <!-- Desktop bubbles (absolute, hidden on mobile) -->
        <div class="hidden md:block">
          <!-- Top-left bubble -->
          <div class="bubble absolute -top-4 -left-8 lg:-left-16" style="transform: rotate(-3deg)">
            ¿quién pagó la pizza? 🍕
          </div>
          <!-- Top-right bubble -->
          <div class="bubble absolute -top-2 -right-4 lg:-right-12" style="transform: rotate(2deg)">
            pará que reviso el historial 😅
          </div>
          <!-- Bottom-left bubble -->
          <div class="bubble absolute -bottom-2 -left-4 lg:-left-14" style="transform: rotate(2deg)">
            te debo del viaje anterior
          </div>
          <!-- Bottom-right bubble -->
          <div class="bubble absolute -bottom-4 -right-6 lg:-right-14" style="transform: rotate(-2deg)">
            no sé cuánto puse yo 😬
          </div>
        </div>

        <!-- Recibito centered -->
        <img
          src="/img/recibito/recibito-overwhelmed.svg"
          alt="Recibito mirando confundido el quilombo de gastos"
          width="160"
          height="200"
          class="relative z-10 select-none"
          draggable="false"
        />
      </div>

      <!-- Mobile bubbles: 2-col chip grid below illustration -->
      <div class="md:hidden grid grid-cols-2 gap-2 mb-10 px-2">
        <div class="bubble text-center">¿quién pagó la pizza? 🍕</div>
        <div class="bubble text-center">pará que reviso 😅</div>
        <div class="bubble text-center">te debo del viaje</div>
        <div class="bubble text-center">no sé cuánto puse 😬</div>
      </div>

      <!-- Beta banner -->
      <div
        ref="bannerRef"
        class="beta-banner opacity-0 rounded-2xl border border-ttc-border px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p class="font-body font-bold text-[11px] tracking-[1.5px] uppercase text-ttc-accent mb-1">
            ✦ versión beta — acceso gratuito
          </p>
          <p class="font-body text-sm text-ttc-text leading-relaxed">
            Estamos construyendo esto con los primeros usuarios.
            <span class="text-ttc-text-muted"> Sin tarjeta. Sin vueltas.</span>
          </p>
        </div>
        <NuxtLink
          to="/iniciar-sesion"
          class="shrink-0 inline-flex items-center gap-1.5 bg-ttc-primary hover:bg-ttc-primary-light transition-colors duration-200 text-white font-body font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer"
        >
          Ser de los primeros
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const illustrationRef = ref(null)
const bannerRef = ref(null)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2 }
  )

  if (illustrationRef.value) observer.observe(illustrationRef.value)
  if (bannerRef.value) observer.observe(bannerRef.value)
})
</script>

<style scoped>
.bubble {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

.beta-banner {
  background: linear-gradient(135deg, rgba(74, 144, 217, 0.06), rgba(52, 211, 153, 0.04));
  transform: translateY(14px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: 100ms;
}

.illustration-block {
  transform: translateY(16px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.illustration-block.is-visible,
.beta-banner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .illustration-block,
  .beta-banner {
    transition: opacity 0.3s ease;
    transform: none !important;
  }
}
</style>
