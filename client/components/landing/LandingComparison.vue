<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 px-5 overflow-hidden">
    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header — just the h2 -->
      <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,38px)] text-ttc-text mb-14 text-left md:text-center leading-tight">
        ¿Todavía con Splitwise o Excel?
      </h2>

      <!-- Desktop: flex layout with asymmetric sizing -->
      <div class="hidden md:flex md:items-start md:gap-6">
        <!-- PAIN column (smaller) -->
        <div
          class="flex-[2] space-y-4 scale-[0.95] origin-top-right"
          :class="isVisible ? 'animate-slide-in-left' : 'opacity-0'"
        >
          <!-- Splitwise -->
          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-60">
            <div class="flex items-center gap-3 mb-3">
              <Scissors :size="18" class="text-ttc-text-dim/60" />
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
          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-60">
            <div class="flex items-center gap-3 mb-3">
              <Sheet :size="18" class="text-ttc-text-dim/60" />
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
        <div class="flex items-center justify-center self-center">
          <div class="w-12 h-12 rounded-full bg-ttc-card border-2 border-ttc-border flex items-center justify-center">
            <span class="font-nunito font-extrabold text-sm text-ttc-text-dim">vs</span>
          </div>
        </div>

        <!-- TTC column (larger, dominant) -->
        <div
          class="flex-[4]"
          :class="isVisible ? 'animate-slide-in-right stagger-2' : 'opacity-0'"
        >
          <div class="bg-ttc-card border-2 border-ttc-primary rounded-2xl p-7 relative overflow-hidden shadow-lg shadow-ttc-primary/10 scale-[1.02] origin-top-left">
            <div class="absolute inset-0 pointer-events-none opacity-[0.06]"
              style="background: linear-gradient(135deg, #25D366 0%, transparent 60%);"
            />
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <Zap :size="20" class="text-ttc-primary" />
                <h3 class="font-nunito font-bold text-lg text-ttc-primary">text the check</h3>
              </div>
              <p class="font-body text-sm text-ttc-text leading-relaxed mb-5">
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

      <!-- Mobile: stacked with VS divider -->
      <div class="md:hidden space-y-4">
        <!-- Pain cards -->
        <div
          :class="isVisible ? 'animate-fade-up' : 'opacity-0'"
        >
          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-60 mb-4">
            <div class="flex items-center gap-3 mb-3">
              <Scissors :size="18" class="text-ttc-text-dim/60" />
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

          <div class="bg-ttc-card border border-ttc-border rounded-2xl p-5 opacity-60">
            <div class="flex items-center gap-3 mb-3">
              <Sheet :size="18" class="text-ttc-text-dim/60" />
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

        <!-- Mobile VS divider -->
        <div class="flex items-center gap-3 my-2">
          <div class="flex-1 h-px bg-ttc-border" />
          <span class="font-nunito font-extrabold text-xs text-ttc-text-dim">vs</span>
          <div class="flex-1 h-px bg-ttc-border" />
        </div>

        <!-- TTC card -->
        <div
          :class="isVisible ? 'animate-fade-up stagger-2' : 'opacity-0'"
        >
          <div class="bg-ttc-card border-2 border-ttc-primary rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-ttc-primary/10">
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
