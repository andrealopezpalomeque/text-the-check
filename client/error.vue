<template>
  <div class="error-page">
    <div class="error-content">

      <!-- Recibito character — inline SVG for animation control -->
      <div class="recibito" :class="{ 'recibito--entered': entered }">
        <svg
          width="140"
          height="175"
          viewBox="0 0 160 200"
          fill="none"
          class="recibito__svg"
          aria-hidden="true"
        >
          <!-- Receipt body with head-tilt -->
          <g transform="rotate(-3, 80, 100)">
            <path
              d="
                M 28,25
                l 4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5 4,-3.5 4,3.5
                  4,-3.5 4,3.5
                C 136,40 131,80 134,115
                C 137,148 131,167 132,175
                l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5 -4,3.5 -4,-3.5
                  -4,3.5 -4,-3.5
                C 24,162 32,125 28,88
                C 24,55 33,35 28,25
                Z
              "
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- Eyes -->
            <circle cx="62" cy="90" r="5" fill="currentColor"/>
            <circle cx="100" cy="87" r="5" fill="currentColor"/>
          </g>

          <!-- Floating question mark -->
          <g class="recibito__question" opacity="0.4">
            <path
              d="M 126,36 C 126,28 134,25 138,30 C 142,35 136,40 132,42 L 132,48"
              stroke="currentColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
            />
            <circle cx="132" cy="54" r="2" fill="currentColor"/>
          </g>
        </svg>
      </div>

      <!-- Error code -->
      <p class="error-code" :class="{ 'error-code--entered': entered }">
        {{ error?.statusCode || 404 }}
      </p>

      <!-- Message -->
      <h1 class="error-title" :class="{ 'error-title--entered': entered }">
        {{ is404 ? 'Esta pagina se nos perdio' : 'Algo salio mal' }}
      </h1>

      <p class="error-subtitle" :class="{ 'error-subtitle--entered': entered }">
        {{ is404
          ? 'Parece que este camino no existe, pero podemos ayudarte a volver.'
          : 'Hubo un problema inesperado. Intentalo de nuevo en unos momentos.'
        }}
      </p>

      <!-- Actions -->
      <div class="error-actions" :class="{ 'error-actions--entered': entered }">
        <button class="btn-primary" @click="goHome">
          Ir al inicio
        </button>
        <button class="btn-ghost" @click="goBack">
          Volver atras
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
})

const is404 = computed(() => props.error?.statusCode === 404)

const entered = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    entered.value = true
  })
})

const goHome = () => clearError({ redirect: '/' })

const goBack = () => {
  if (window.history.length > 1) {
    clearError()
    window.history.back()
  } else {
    clearError({ redirect: '/' })
  }
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--color-bg);
  color: var(--color-text);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 380px;
}

/* ─── Recibito character ─── */
.recibito {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.7s ease-out, transform 0.7s ease-out;
}

.recibito--entered {
  opacity: 1;
  transform: translateY(0);
}

.recibito__svg {
  color: var(--color-text);
  animation: float 4s ease-in-out infinite;
  animation-delay: 0.8s;
  animation-fill-mode: backwards;
}

.recibito__question {
  animation: questionPulse 3s ease-in-out infinite;
  animation-delay: 1.2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes questionPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.15; }
}

/* ─── Error code ─── */
.error-code {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 5rem;
  line-height: 1;
  color: var(--color-primary);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s;
  margin-top: 8px;
  /* Soft glow — the number isn't aggressive, it's just context */
  filter: brightness(1);
  -webkit-text-fill-color: transparent;
  background: linear-gradient(
    180deg,
    var(--color-primary) 0%,
    color-mix(in srgb, var(--color-primary) 40%, transparent) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
}

.error-code--entered {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Title ─── */
.error-title {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1.375rem;
  line-height: 1.3;
  color: var(--color-text);
  margin-top: 12px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s;
}

.error-title--entered {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Subtitle ─── */
.error-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin-top: 8px;
  max-width: 320px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease-out 0.45s, transform 0.6s ease-out 0.45s;
}

.error-subtitle--entered {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Action buttons ─── */
.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease-out 0.6s, transform 0.6s ease-out 0.6s;
}

.error-actions--entered {
  opacity: 1;
  transform: translateY(0);
}

.btn-primary {
  padding: 10px 24px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  background-color: var(--color-primary);
  color: #FFFFFF;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-ghost {
  padding: 10px 24px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  cursor: pointer;
  background-color: transparent;
  color: var(--color-text-muted);
  transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.btn-ghost:hover {
  border-color: var(--color-text-dim);
  color: var(--color-text);
}

.btn-ghost:active {
  transform: scale(0.97);
}

/* ─── Mobile adjustments ─── */
@media (max-width: 400px) {
  .error-code {
    font-size: 4rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-primary,
  .btn-ghost {
    width: 100%;
    text-align: center;
  }
}
</style>
