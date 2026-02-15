<template>
  <footer class="border-t border-ttc-border bg-ttc-surface py-10">
    <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 text-center">
      <!-- Logo wordmark -->
      <span class="font-outfit font-semibold text-sm tracking-[3px] text-ttc-text">
        text <span class="text-ttc-primary">the</span> check
      </span>

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
