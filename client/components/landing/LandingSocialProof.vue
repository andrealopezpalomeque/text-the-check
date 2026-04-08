<template>
  <section ref="sectionRef" class="relative py-14 md:py-20 overflow-hidden bg-ttc-surface">
    <div class="relative z-10 max-w-4xl mx-auto px-5">
      <!-- Single small question — not the formula -->
      <p class="font-body italic text-lg md:text-xl text-ttc-text-muted text-center mb-10">
        ...¿te suena?
      </p>

      <!-- Illustration: Recibito + chaotic floating bubbles -->
      <div class="relative flex justify-center items-center min-h-[260px] md:min-h-[300px]">
        <!-- Desktop bubbles — scattered chaotically -->
        <template v-if="isVisible">
          <div class="hidden md:block">
            <div
              v-for="(b, i) in desktopBubbles"
              :key="i"
              class="bubble-chaos absolute"
              :style="{
                top: b.top,
                left: b.left,
                right: b.right,
                bottom: b.bottom,
                fontSize: b.size,
                animationDelay: b.delay,
                '--rot-end': b.rotate,
              }"
            >
              {{ b.text }}
            </div>
          </div>

          <!-- Mobile bubbles — scattered flex, not a grid -->
          <div class="md:hidden flex flex-wrap justify-center gap-2 absolute inset-0 items-center px-4">
            <div
              v-for="(b, i) in mobileBubbles"
              :key="i"
              class="bubble-chaos"
              :style="{
                fontSize: b.size,
                animationDelay: b.delay,
                '--rot-end': b.rotate,
                transform: `rotate(${b.rotate})`,
              }"
            >
              {{ b.text }}
            </div>
          </div>
        </template>

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
    </div>
  </section>
</template>

<script setup>
const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)

const desktopBubbles = [
  { text: '¿quién pagó la pizza? 🍕', top: '-8px', left: '-40px', size: '16px', delay: '0ms', rotate: '-4deg' },
  { text: 'pará que reviso el historial 😅', top: '10px', right: '-60px', size: '14px', delay: '250ms', rotate: '3deg' },
  { text: 'te debo del viaje anterior', bottom: '20px', left: '-20px', size: '15px', delay: '120ms', rotate: '5deg' },
  { text: 'no sé cuánto puse yo 😬', bottom: '-10px', right: '-30px', size: '17px', delay: '400ms', rotate: '-2deg' },
  { text: 'pero eso ya lo pagué! 🤦', top: '50%', left: '-70px', size: '13px', delay: '320ms', rotate: '-6deg' },
]

const mobileBubbles = [
  { text: '¿quién pagó? 🍕', size: '14px', delay: '0ms', rotate: '-3deg' },
  { text: 'pará que reviso 😅', size: '13px', delay: '200ms', rotate: '2deg' },
  { text: 'te debo del viaje', size: '15px', delay: '80ms', rotate: '4deg' },
  { text: 'no sé cuánto puse 😬', size: '14px', delay: '350ms', rotate: '-5deg' },
  { text: 'ya lo pagué! 🤦', size: '13px', delay: '150ms', rotate: '3deg' },
]
</script>

<style scoped>
@keyframes chaosPopIn {
  0% {
    opacity: 0;
    transform: scale(0.7) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(var(--rot-end, 0deg));
  }
}

.bubble-chaos {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 8px 18px;
  font-family: 'DM Sans', sans-serif;
  color: var(--color-text-muted);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  animation: chaosPopIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
