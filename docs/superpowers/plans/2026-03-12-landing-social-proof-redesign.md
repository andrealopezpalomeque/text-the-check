# Landing Social Proof Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `LandingSocialProof.vue` (fake stats + testimonials) with a combined pain-recognition + beta signal section featuring a new "Overwhelmed" Recibito SVG expression.

**Architecture:** Two deliverables — a new SVG asset (`recibito-overwhelmed.svg`) and a fully rewritten Vue component (`LandingSocialProof.vue`). The component renders the SVG via `<img>`, wraps it in absolutely-positioned chat bubble chips on desktop, falls back to a chip grid on mobile, and closes with a beta banner CTA.

**Tech Stack:** Nuxt 3 (SPA), Tailwind CSS (CSS variable tokens), Lucide Vue (not used here), IntersectionObserver for scroll animations, SVG hand-coded.

**Spec:** `docs/superpowers/specs/2026-03-12-landing-social-proof-redesign.md`

---

## Chunk 1: SVG Asset

### Task 1: Create `recibito-overwhelmed.svg`

**Files:**
- Create: `client/public/img/recibito/recibito-overwhelmed.svg`
- Reference: `client/public/img/recibito/recibito-v2.svg` (existing style baseline)

- [ ] **Step 1: Create the SVG file**

Same receipt body path and stroke style as `recibito-v2.svg` (`#4A90D9`, 2.5px stroke). Changes: tilt `-6deg` (vs `-3deg`), large surprised eyes, more chaotic chat lines, three floating marks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 220" fill="none">
  <!--
    Recibito — "Overwhelmed" expression
    Same receipt body, tilted further. Big surprised eyes with dark pupils.
    Chaotic chat lines at slight angles. Floating !, ?, ? marks.
  -->

  <!-- Receipt body with more dramatic tilt -->
  <g transform="rotate(-6, 90, 110)">
    <path
      d="M 32,28 l 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 4,-3.5 4,3.5 C 152,40 134,82 148,118 C 153,152 134,174 142,179 l -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 -4,3.5 -4,-3.5 C 22,162 40,130 26,92 C 21,56 40,36 32,28 Z"
      stroke="#4A90D9"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Big surprised eyes: large circle + small dark pupil offset upward -->
    <circle cx="68" cy="72" r="8" fill="#4A90D9"/>
    <circle cx="71" cy="69" r="3" fill="#0C1017"/>
    <circle cx="108" cy="69" r="8" fill="#4A90D9"/>
    <circle cx="111" cy="66" r="3" fill="#0C1017"/>

    <!-- Chaotic chat lines at slight random angles -->
    <rect x="48" y="106" width="40" height="7" rx="3.5" fill="#4A90D9" opacity="0.28" transform="rotate(-2, 68, 109)"/>
    <rect x="86" y="120" width="34" height="7" rx="3.5" fill="#4A90D9" opacity="0.20" transform="rotate(3, 103, 123)"/>
    <rect x="50" y="136" width="26" height="7" rx="3.5" fill="#4A90D9" opacity="0.28" transform="rotate(-1, 63, 139)"/>
    <rect x="80" y="150" width="38" height="7" rx="3.5" fill="#4A90D9" opacity="0.14" transform="rotate(2, 99, 153)"/>
  </g>

  <!-- Floating ! top-right -->
  <g opacity="0.50">
    <line x1="152" y1="26" x2="152" y2="44" stroke="#4A90D9" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="152" cy="51" r="2" fill="#4A90D9"/>
  </g>

  <!-- Floating ? top-left -->
  <g opacity="0.35">
    <path
      d="M 22,46 C 22,38 30,35 34,40 C 38,45 32,50 28,52 L 28,58"
      stroke="#4A90D9"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
    />
    <circle cx="28" cy="64" r="2" fill="#4A90D9"/>
  </g>

  <!-- Floating ? bottom-right -->
  <g opacity="0.22">
    <path
      d="M 162,148 C 162,141 169,138 172,143 C 175,148 170,152 167,154 L 167,159"
      stroke="#4A90D9"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
    />
    <circle cx="167" cy="164" r="1.5" fill="#4A90D9"/>
  </g>
</svg>
```

- [ ] **Step 2: Verify the SVG renders correctly**

Open `client/public/img/recibito/recibito-overwhelmed.svg` in a browser directly (drag-and-drop or `open` command). Confirm:
- Receipt body is visible with zigzag edges
- Two large eyes with small dark pupils visible
- Four horizontal lines in the body (chat lines)
- Three floating marks: `!` top-right, `?` top-left, `?` bottom-right (faint)
- Overall tilt is slightly more dramatic than the original

- [ ] **Step 3: Commit**

```bash
git add client/public/img/recibito/recibito-overwhelmed.svg
git commit -m "feat: add recibito-overwhelmed SVG expression"
```

---

## Chunk 2: Vue Component

### Task 2: Rewrite `LandingSocialProof.vue`

**Files:**
- Modify: `client/components/landing/LandingSocialProof.vue` (full rewrite)

No unit tests for this component — it's a static presentational section with scroll animations. Visual verification is the test.

- [ ] **Step 1: Rewrite the component**

Replace the entire file with:

```vue
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
            ✦ beta abierta
          </p>
          <p class="font-body text-sm text-ttc-text leading-relaxed">
            Estamos construyendo esto con los primeros usuarios.
            <span class="text-ttc-text-muted"> Sin tarjeta. Sin vueltas.</span>
          </p>
        </div>
        <NuxtLink
          to="/login"
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
```

- [ ] **Step 2: Start the dev server and visually verify**

```bash
cd client && npm run dev
```

Open `http://localhost:3000` and scroll to the section. Confirm:
- Label, headline, subtitle render correctly in Spanish
- Recibito "Overwhelmed" SVG appears centered
- On desktop (≥768px): 4 chat bubbles float around Recibito at slight angles
- On mobile (<768px): bubbles appear as 2-col chip grid below illustration
- Beta banner renders below with green "✦ beta abierta" label and CTA button
- Scrolling into view triggers fade-up animation for both illustration block and beta banner
- Light mode toggle: section remains legible (border, text, background all adapt via CSS vars)

- [ ] **Step 3: Commit**

```bash
git add client/components/landing/LandingSocialProof.vue
git commit -m "feat: redesign social proof section with pain recognition and beta signal"
```
