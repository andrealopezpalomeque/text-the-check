<template>
  <footer class="border-t border-ttc-border bg-ttc-surface py-10">
    <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 text-center">
      <!-- Logo wordmark -->
      <AppLogo variant="horizontal" />

      <!-- Tagline -->
      <p class="text-xs uppercase tracking-[3px] text-ttc-text-muted">
        Tu plata, a un mensaje
      </p>

      <!-- Social -->
      <a
        href="https://www.instagram.com/textthecheck"
        target="_blank"
        rel="noopener noreferrer"
        class="text-ttc-text-muted hover:text-ttc-text transition-colors"
        aria-label="Instagram @textthecheck"
      >
        <Instagram :size="16" :stroke-width="1.5" />
      </a>

      <!-- Links -->
      <nav class="flex items-center gap-4 text-xs text-ttc-text-dim">
        <NuxtLink
          to="/faq"
          class="hover:text-ttc-text transition-colors"
        >
          Preguntas frecuentes
        </NuxtLink>
        <NuxtLink
          to="/privacy"
          class="hover:text-ttc-text transition-colors"
        >
          Politica de Privacidad
        </NuxtLink>
      </nav>

      <!-- Domain -->
      <p class="text-xs text-ttc-text-dim">
        textthecheck.app
      </p>
    </div>
  </footer>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
