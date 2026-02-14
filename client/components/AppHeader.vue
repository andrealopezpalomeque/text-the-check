<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-ttc-surface/85 backdrop-blur-xl border-b border-ttc-border">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-2.5">
        <TtcSymbol size-class="w-7 h-7" />
        <span class="font-outfit font-semibold text-sm tracking-[3px] text-ttc-text">
          text <span class="text-ttc-primary">the</span> check
        </span>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-1">
        <!-- Instagram link -->
        <a
          href="https://instagram.com/textthecheck"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-lg hover:bg-ttc-card transition-colors"
          aria-label="Instagram @textthecheck"
        >
          <Instagram :size="18" :stroke-width="1.5" class="text-ttc-text-muted" />
        </a>

        <!-- Theme toggle -->
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
