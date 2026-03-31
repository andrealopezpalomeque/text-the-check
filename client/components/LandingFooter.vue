<template>
  <footer class="border-t border-ttc-border py-8 text-center">
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
