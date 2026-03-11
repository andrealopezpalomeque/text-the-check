<template>
  <footer class="border-t border-ttc-border bg-ttc-surface py-6">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-5">
      <!-- Left: Logo + tagline -->
      <div class="flex flex-col">
        <AppLogo variant="horizontal" />
        <p class="hidden text-xs uppercase tracking-[3px] text-ttc-text-muted mt-1 sm:block">
          Tu plata, a un mensaje
        </p>
      </div>

      <!-- Right: Links + social -->
      <div class="flex items-center gap-4 text-xs text-ttc-text-dim">
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
          Política de Privacidad
        </NuxtLink>
        <a
          href="https://www.instagram.com/textthecheck"
          target="_blank"
          rel="noopener noreferrer"
          class="text-ttc-text-muted hover:text-ttc-text transition-colors"
          aria-label="Instagram @textthecheck"
        >
          <Instagram :size="16" :stroke-width="1.5" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
