<template>
  <footer class="relative border-t border-ttc-border py-8 text-center">
    <!-- Receipt edge top -->
    <svg class="absolute -top-[1px] left-0 w-full h-3 text-ttc-border" preserveAspectRatio="none" viewBox="0 0 1200 12">
      <path d="M0,12 L0,6 Q15,0 30,6 Q45,12 60,6 Q75,0 90,6 Q105,12 120,6 Q135,0 150,6 Q165,12 180,6 Q195,0 210,6 Q225,12 240,6 Q255,0 270,6 Q285,12 300,6 Q315,0 330,6 Q345,12 360,6 Q375,0 390,6 Q405,12 420,6 Q435,0 450,6 Q465,12 480,6 Q495,0 510,6 Q525,12 540,6 Q555,0 570,6 Q585,12 600,6 Q615,0 630,6 Q645,12 660,6 Q675,0 690,6 Q705,12 720,6 Q735,0 750,6 Q765,12 780,6 Q795,0 810,6 Q825,12 840,6 Q855,0 870,6 Q885,12 900,6 Q915,0 930,6 Q945,12 960,6 Q975,0 990,6 Q1005,12 1020,6 Q1035,0 1050,6 Q1065,12 1080,6 Q1095,0 1110,6 Q1125,12 1140,6 Q1155,0 1170,6 Q1185,12 1200,6 L1200,12 Z" fill="var(--color-bg)"/>
    </svg>

    <!-- Wordmark -->
    <div class="font-outfit font-semibold text-xs tracking-[3px] text-ttc-text-dim mb-2">
      text <span class="text-ttc-primary">the</span> check
    </div>

    <!-- Links -->
    <div class="flex flex-wrap gap-5 justify-center mb-3">
      <NuxtLink
        to="/faq"
        class="text-xs text-ttc-text-muted hover:text-ttc-primary-light transition-colors"
      >
        Preguntas Frecuentes
      </NuxtLink>
      <NuxtLink
        to="/privacy"
        class="text-xs text-ttc-text-muted hover:text-ttc-primary-light transition-colors"
      >
        Política de Privacidad
      </NuxtLink>
      <a
        href="https://instagram.com/textthecheck"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-ttc-text-muted hover:text-ttc-primary-light transition-colors"
      >
        Instagram
      </a>
      <a
        href="mailto:hola@textthecheck.app"
        class="text-xs text-ttc-text-muted hover:text-ttc-primary-light transition-colors"
      >
        Contacto
      </a>
    </div>

    <!-- Copyright -->
    <div class="text-[11px] text-ttc-text-dim">&copy; 2026 Text the Check. Hecho en Argentina.</div>
  </footer>
</template>
