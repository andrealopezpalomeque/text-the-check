<template>
  <footer class="py-10 px-4 border-t border-ttc-border">
    <div class="max-w-5xl mx-auto flex flex-col items-center gap-4">
      <!-- Logo (small) -->
      <div class="flex items-center gap-2">
        <img
          src="/img/ttc_symbol.svg"
          alt=""
          class="w-5 h-5 opacity-50"
          aria-hidden="true"
        />
        <span class="font-outfit font-medium text-xs tracking-[3px] text-ttc-text-dim">
          text <span class="text-ttc-primary/60">the</span> check
        </span>
      </div>

      <!-- Links -->
      <div class="flex items-center gap-4">
        <a
          href="https://instagram.com/textthecheck"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 font-body text-xs text-ttc-text-dim hover:text-ttc-text-muted transition-colors"
        >
          <Instagram :size="14" :stroke-width="1.5" />
          @textthecheck
        </a>
      </div>

      <!-- Copyright + Argentina -->
      <div class="flex flex-col items-center gap-1">
        <p class="font-body text-xs text-ttc-text-dim">
          &copy; 2026 Text the Check
        </p>
        <p class="font-body text-xs text-ttc-text-dim">
          Hecho en Argentina
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
