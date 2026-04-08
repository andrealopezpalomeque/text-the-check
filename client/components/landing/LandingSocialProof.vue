<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 overflow-hidden">
    <!-- Full-bleed warm glow -->
    <div
      class="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[400px] rounded-full pointer-events-none opacity-[0.05]"
      style="background: radial-gradient(ellipse, #E8533F 0%, #4A90D9 50%, transparent 70%); filter: blur(80px);"
    />

    <div class="relative z-10 max-w-4xl mx-auto px-5">
      <!-- Section label -->
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary-light mb-3 text-left md:text-center">
        ¿te suena esto?
      </p>

      <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,40px)] text-ttc-text text-left md:text-center mb-4 leading-tight">
        El chat que nadie termina<br class="hidden sm:block"> de entender
      </h2>

      <p class="font-body text-sm sm:text-base text-ttc-text-muted text-left md:text-center max-w-md md:mx-auto mb-12 leading-relaxed">
        "¿quién pagó la pizza?", "yo te debo del viaje anterior", "no sé cuánto puse yo"&hairsp;—&hairsp;todos en el mismo grupo, nadie con la cuenta clara.
      </p>

      <!-- Illustration: Recibito + floating bubbles -->
      <div class="relative flex justify-center items-center mb-10">
        <!-- Desktop bubbles (absolute positioned) -->
        <div class="hidden md:block" v-if="isVisible">
          <div class="bubble absolute -top-4 -left-8 lg:-left-20 animate-pop-in stagger-1" style="transform: rotate(-3deg)">
            ¿quién pagó la pizza? 🍕
          </div>
          <div class="bubble absolute -top-2 -right-4 lg:-right-16 animate-pop-in stagger-2" style="transform: rotate(2deg)">
            pará que reviso el historial 😅
          </div>
          <div class="bubble absolute -bottom-2 -left-4 lg:-left-18 animate-pop-in stagger-3" style="transform: rotate(2deg)">
            te debo del viaje anterior
          </div>
          <div class="bubble absolute -bottom-4 -right-6 lg:-right-18 animate-pop-in stagger-4" style="transform: rotate(-2deg)">
            no sé cuánto puse yo 😬
          </div>
        </div>

        <!-- Recibito mascot -->
        <img
          v-if="isVisible"
          src="/img/recibito/recibito-overwhelmed.svg"
          alt="Recibito mirando confundido el quilombo de gastos"
          width="160"
          height="200"
          class="relative z-10 select-none animate-pop-in"
          draggable="false"
        />
        <div v-else class="w-[160px] h-[200px]" />
      </div>

      <!-- Mobile bubbles: scattered chips -->
      <div class="md:hidden grid grid-cols-2 gap-2 mb-10 px-2" v-if="isVisible">
        <div class="bubble text-center animate-fade-up stagger-1">¿quién pagó la pizza? 🍕</div>
        <div class="bubble text-center animate-fade-up stagger-2">pará que reviso 😅</div>
        <div class="bubble text-center animate-fade-up stagger-3">te debo del viaje</div>
        <div class="bubble text-center animate-fade-up stagger-4">no sé cuánto puse 😬</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)
</script>

<style scoped>
.bubble {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
</style>
