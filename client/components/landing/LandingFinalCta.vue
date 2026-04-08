<template>
  <section ref="sectionRef" class="relative py-20 md:py-28 px-5 overflow-hidden">
    <!-- Receipt edge top -->
    <svg class="absolute top-0 left-0 w-full h-3 text-ttc-border" preserveAspectRatio="none" viewBox="0 0 1200 12">
      <path d="M0,0 L0,6 Q15,12 30,6 Q45,0 60,6 Q75,12 90,6 Q105,0 120,6 Q135,12 150,6 Q165,0 180,6 Q195,12 210,6 Q225,0 240,6 Q255,12 270,6 Q285,0 300,6 Q315,12 330,6 Q345,0 360,6 Q375,12 390,6 Q405,0 420,6 Q435,12 450,6 Q465,0 480,6 Q495,12 510,6 Q525,0 540,6 Q555,12 570,6 Q585,0 600,6 Q615,12 630,6 Q645,0 660,6 Q675,12 690,6 Q705,0 720,6 Q735,12 750,6 Q765,0 780,6 Q795,12 810,6 Q825,0 840,6 Q855,12 870,6 Q885,0 900,6 Q915,12 930,6 Q945,0 960,6 Q975,12 990,6 Q1005,0 1020,6 Q1035,12 1050,6 Q1065,0 1080,6 Q1095,12 1110,6 Q1125,0 1140,6 Q1155,12 1170,6 Q1185,0 1200,6 L1200,0 Z" fill="var(--color-bg)"/>
    </svg>

    <!-- Warm glow -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none opacity-[0.06]"
      style="background: radial-gradient(ellipse, #4A90D9 0%, #25D366 40%, transparent 70%); filter: blur(80px);"
    />

    <div
      class="relative z-10 max-w-[560px] mx-auto"
      :class="isVisible ? 'animate-pop-in' : 'opacity-0'"
    >
      <!-- Beta badge -->
      <div class="flex justify-center md:justify-start mb-6">
        <span class="inline-flex items-center gap-1.5 font-body font-bold text-[10px] tracking-[1.5px] uppercase text-ttc-whatsapp bg-ttc-whatsapp/10 border border-ttc-whatsapp/20 px-3 py-1.5 rounded-full">
          ✦ beta gratuita — sin tarjeta
        </span>
      </div>

      <h2 class="font-nunito font-extrabold text-[clamp(26px,5vw,40px)] text-ttc-text mb-4 leading-tight text-center md:text-left">
        Empezá a dividir gastos con un mensaje.
      </h2>
      <p class="text-ttc-text-muted text-[15px] mb-8 text-center md:text-left">
        Estamos construyendo esto con los primeros usuarios. Entrá, probá, y contanos qué te parece.
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row items-center md:items-start gap-3">
        <a
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2.5 font-body font-bold text-base text-white bg-ttc-whatsapp px-10 py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-ttc-whatsapp/20 w-full sm:w-auto justify-center"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Escribile al bot
        </a>
        <NuxtLink
          to="/iniciar-sesion"
          class="font-body text-sm text-ttc-text-muted hover:text-ttc-text transition-colors underline underline-offset-4 decoration-ttc-border py-3"
        >
          Ya tengo cuenta &rarr;
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)
const { whatsappLink } = useLandingWhatsApp()
</script>
