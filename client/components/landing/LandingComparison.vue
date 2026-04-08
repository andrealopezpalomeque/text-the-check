<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 px-5 overflow-hidden">
    <div class="relative z-10 max-w-4xl mx-auto">
      <!-- Section header -->
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary-light mb-3 text-left md:text-center">
        la diferencia
      </p>
      <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,38px)] text-ttc-text mb-14 text-left md:text-center leading-tight">
        ¿Todavía con Splitwise o Excel?
      </h2>

      <!-- 2-column before/after -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-6 items-start">

        <!-- PAIN column (spans 2) -->
        <div
          class="md:col-span-2 space-y-4"
          :class="isVisible ? 'animate-slide-in-left' : 'opacity-0'"
        >
          <!-- Splitwise -->
          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-70">
            <div class="flex items-center gap-3 mb-3">
              <Scissors :size="18" class="text-ttc-text-dim" />
              <h3 class="font-nunito font-bold text-base text-ttc-text-dim line-through decoration-ttc-red/50">Splitwise</h3>
            </div>
            <ul class="space-y-2">
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">No entiende cómo hablás</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Sin dólar blue</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Todos tienen que instalar</span>
              </li>
            </ul>
          </div>

          <!-- WhatsApp + Excel -->
          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-70">
            <div class="flex items-center gap-3 mb-3">
              <Sheet :size="18" class="text-ttc-text-dim" />
              <h3 class="font-nunito font-bold text-base text-ttc-text-dim line-through decoration-ttc-red/50">Grupo de WA + Excel</h3>
            </div>
            <ul class="space-y-2">
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Se pierde info en el chat</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Carga manual, nadie anota</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-red flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Nadie sabe cuánto debe</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- VS divider -->
        <div class="hidden md:flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-ttc-card border-2 border-ttc-border flex items-center justify-center">
            <span class="font-nunito font-extrabold text-sm text-ttc-text-dim">vs</span>
          </div>
        </div>

        <!-- TTC column (spans 2, highlighted, visually dominant) -->
        <div
          class="md:col-span-2"
          :class="isVisible ? 'animate-slide-in-right stagger-2' : 'opacity-0'"
        >
          <div class="bg-ttc-card border-2 border-ttc-primary rounded-2xl p-6 relative overflow-hidden">
            <!-- Warm gradient overlay -->
            <div class="absolute inset-0 pointer-events-none opacity-[0.06]"
              style="background: linear-gradient(135deg, #25D366 0%, transparent 60%);"
            />
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <Zap :size="20" class="text-ttc-primary" />
                <h3 class="font-nunito font-bold text-lg text-ttc-primary">text the check</h3>
              </div>
              <p class="font-body text-sm text-ttc-text leading-relaxed mb-4">
                Un mensaje y listo. Se registra solo, sabe quién debe a quién, entiende cómo hablás y funciona directo desde WhatsApp.
              </p>
              <ul class="space-y-2.5">
                <li class="flex items-center gap-2">
                  <Check :size="16" class="text-ttc-primary flex-shrink-0" />
                  <span class="font-body text-sm text-ttc-text">100% desde WhatsApp</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check :size="16" class="text-ttc-primary flex-shrink-0" />
                  <span class="font-body text-sm text-ttc-text">IA que te entiende</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check :size="16" class="text-ttc-primary flex-shrink-0" />
                  <span class="font-body text-sm text-ttc-text">Grupos sin instalar nada</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check :size="16" class="text-ttc-primary flex-shrink-0" />
                  <span class="font-body text-sm text-ttc-text">Multi-moneda con blue</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check :size="16" class="text-ttc-primary flex-shrink-0" />
                  <span class="font-body text-sm text-ttc-text">Texto, foto, audio o PDF</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Scissors, Sheet, Zap, X, Check } from 'lucide-vue-next'

const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)
</script>
