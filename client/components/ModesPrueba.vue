<template>
  <section class="relative py-16 md:py-24 px-5 overflow-hidden">
    <!-- Background glows -->
    <div class="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-ttc-primary/[0.03] pointer-events-none" style="filter: blur(80px);" />
    <div class="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-ttc-accent/[0.03] pointer-events-none" style="filter: blur(80px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-14">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3">
          dos modos, un chat
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text">
          Para vos y para tu grupo
        </h2>
      </div>

      <!-- Two mode cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

        <!-- Viajes / Grupos mode -->
        <div class="mode-card group">
          <div class="p-6 md:p-8">
            <!-- Header with icon -->
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl bg-ttc-primary/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3-2.8 2.8L4 13.5c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.8.2 1l3.3 2.5 2.5 3.3c.2.3.7.4 1 .2l.3-.2c.3-.2.4-.6.3-1L9.9 17l2.8-2.8 3 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1Z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-nunito font-bold text-lg text-ttc-text">Viajes y Grupos</h3>
                <p class="font-body text-[11px] text-ttc-primary font-semibold uppercase tracking-wider">Dividi gastos con amigos</p>
              </div>
            </div>

            <!-- Description -->
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-6">
              Manda un mensaje como "50 cena con Gonza" y listo. Se calcula solo quien debe a quien.
            </p>

            <!-- Features with receipt-line decoration -->
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-primary">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Escribi como hablas — te entiende perfecto</span>
              </li>
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-primary">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="m7 12 3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Sabe quien debe a quien, siempre actualizado</span>
              </li>
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-primary">
                  <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Pesos, dolares o reales — vos elegis</span>
              </li>
            </ul>
          </div>
          <!-- Bottom accent -->
          <div class="h-[3px] bg-gradient-to-r from-transparent via-ttc-primary to-transparent opacity-40 group-hover:opacity-70 transition-opacity" />
        </div>

        <!-- Finanzas mode -->
        <div class="mode-card group">
          <div class="p-6 md:p-8">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl bg-ttc-accent/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-nunito font-bold text-lg text-ttc-text">Mis Finanzas</h3>
                <p class="font-body text-[11px] text-ttc-accent font-semibold uppercase tracking-wider">Finanzas personales</p>
              </div>
            </div>

            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-6">
              Anota lo que gastas en el dia, configura tus pagos fijos y que te avise antes de cada vencimiento.
            </p>

            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-accent">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Un mensaje para registrar cualquier gasto</span>
              </li>
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-accent">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Te avisa antes de que venza el alquiler, Netflix, o lo que sea</span>
              </li>
              <li class="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5 text-ttc-accent">
                  <path d="M3 3v18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="m19 9-5 5-4-4-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-body text-sm text-ttc-text-muted">Resumen semanal de en que se te fue la plata</span>
              </li>
            </ul>
          </div>
          <div class="h-[3px] bg-gradient-to-r from-transparent via-ttc-accent to-transparent opacity-40 group-hover:opacity-70 transition-opacity" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.mode-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mode-card:hover {
  border-color: var(--color-text-dim);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
}
</style>
