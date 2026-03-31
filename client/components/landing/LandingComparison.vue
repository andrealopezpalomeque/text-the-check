<template>
  <section class="relative py-16 md:py-24 px-5 overflow-hidden">
    <!-- Background glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-ttc-primary opacity-[0.03] pointer-events-none" style="filter: blur(100px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-14">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3">
          la diferencia
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text">
          ¿Todavía con Splitwise o Excel?
        </h2>
      </div>

      <!-- 3-column comparison -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">

        <!-- Splitwise -->
        <div class="comparison-card opacity-0" style="transition-delay: 0ms;">
          <div class="p-6">
            <div class="w-10 h-10 rounded-lg bg-ttc-text-dim/10 flex items-center justify-center mb-4">
              <Scissors :size="20" class="text-ttc-text-dim" />
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-3">Splitwise</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed">
              Solo divide cuentas. No entiende español argentino, no maneja multi-moneda real. Y necesita que todos se descarguen la app.
            </p>
            <!-- Pain points -->
            <ul class="mt-4 space-y-2">
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">No entiende cómo hablás</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Sin dólar blue</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Todos tienen que instalar</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- WhatsApp + Excel -->
        <div class="comparison-card opacity-0" style="transition-delay: 100ms;">
          <div class="p-6">
            <div class="w-10 h-10 rounded-lg bg-ttc-text-dim/10 flex items-center justify-center mb-4">
              <Sheet :size="20" class="text-ttc-text-dim" />
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-3">Grupo de WA + Excel</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed">
              Alguien anota en una planilla... cuando se acuerda. Se pierden gastos, nadie sabe cuánto debe, y al final del viaje es un quilombo.
            </p>
            <ul class="mt-4 space-y-2">
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Se pierde info</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Carga manual</span>
              </li>
              <li class="flex items-center gap-2">
                <X :size="14" class="text-ttc-danger flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text-muted">Nadie sabe cuánto debe</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Text the Check (highlighted) -->
        <div class="comparison-card comparison-card--highlight opacity-0" style="transition-delay: 200ms;">
          <div class="p-6">
            <div class="w-10 h-10 rounded-lg bg-ttc-primary/10 flex items-center justify-center mb-4">
              <Zap :size="20" class="text-ttc-primary" />
            </div>
            <h3 class="font-nunito font-bold text-base text-ttc-primary mb-3">text the check</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed">
              Un mensaje y listo. Se registra solo, sabe quién debe a quién, entiende cómo hablás y funciona directo desde WhatsApp. Sin descargar nada.
            </p>
            <ul class="mt-4 space-y-2">
              <li class="flex items-center gap-2">
                <Check :size="14" class="text-ttc-success flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text">100% desde WhatsApp</span>
              </li>
              <li class="flex items-center gap-2">
                <Check :size="14" class="text-ttc-success flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text">IA que te entiende</span>
              </li>
              <li class="flex items-center gap-2">
                <Check :size="14" class="text-ttc-success flex-shrink-0" />
                <span class="font-body text-xs text-ttc-text">Grupos sin instalar nada</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { Scissors, Sheet, Zap, X, Check } from 'lucide-vue-next'

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
    { threshold: 0.15 }
  )

  document.querySelectorAll('.comparison-card').forEach((card) => observer.observe(card))
})
</script>

<style scoped>
.comparison-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(16px);
}

.comparison-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.comparison-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
}

.comparison-card--highlight {
  border-color: var(--color-primary);
  border-width: 2px;
  background: linear-gradient(
    135deg,
    var(--color-card) 0%,
    color-mix(in srgb, var(--color-primary) 5%, var(--color-card)) 100%
  );
}

.comparison-card--highlight:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 12px 40px -12px color-mix(in srgb, var(--color-primary) 30%, transparent);
}
</style>
