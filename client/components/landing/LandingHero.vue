<template>
  <section class="relative pt-16 md:pt-[84px] pb-8 md:pb-20 overflow-hidden">
    <div class="relative z-10 px-5 max-w-6xl mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        <!-- Left column: text + CTAs -->
        <div class="text-left lg:flex-1">
          <span class="inline-flex items-center gap-1.5 font-body font-bold text-[10px] tracking-[1.5px] uppercase text-ttc-whatsapp bg-ttc-whatsapp/10 border border-ttc-whatsapp/20 px-3 py-1.5 rounded-full mb-4 animate-fade-up">
            ✦ beta gratuita — sin tarjeta
          </span>

          <div class="font-body font-medium text-base md:text-lg italic text-ttc-primary-light mb-5 animate-fade-up stagger-1">
            Tu plata, a un mensaje
          </div>

          <h1 class="font-outfit font-bold uppercase text-[clamp(32px,7.5vw,56px)] leading-[1.1] tracking-[0.08em] text-ttc-text mb-7 animate-fade-up stagger-2">
            Dividí gastos en grupo.<br />
            <span class="text-ttc-primary">Sin planillas.</span><br />
            <span class="text-ttc-whatsapp">Sin discusiones.</span>
          </h1>

          <p class="text-base md:text-lg text-ttc-text-muted max-w-[520px] mb-9 leading-relaxed animate-fade-up stagger-3">
            Mandale un mensaje al bot de WhatsApp con lo que gastaste y listo.
            La IA entiende tu mensaje, registra el gasto, y todos saben cuánto deben.
          </p>

          <!-- CTA buttons -->
          <div class="flex gap-3.5 flex-col sm:flex-row items-start animate-fade-up stagger-4">
            <a
              :href="whatsappLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2.5 font-body font-bold text-base text-white bg-ttc-whatsapp px-8 py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-ttc-whatsapp/20 w-full sm:w-auto justify-center"
            >
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span class="sm:hidden">Escribile al bot por WhatsApp</span>
              <span class="hidden sm:inline">Escribile al bot</span>
            </a>
            <NuxtLink
              to="/iniciar-sesion"
              class="font-body text-sm text-ttc-text-muted hover:text-ttc-text transition-colors underline underline-offset-4 decoration-ttc-border py-4 px-2"
            >
              Ya tengo cuenta &rarr;
            </NuxtLink>
          </div>
        </div>

        <!-- Right column: animated WhatsApp demo -->
        <div class="mt-10 lg:mt-0 lg:flex-shrink-0 flex justify-center animate-fade-up stagger-3">
          <WhatsAppHeroDemo />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { whatsappLink } = useLandingWhatsApp()
</script>
