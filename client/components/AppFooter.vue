<template>
  <footer class="py-8 px-4 border-t border-ttc-border">
    <div class="max-w-5xl mx-auto">
      <!-- Desktop: single row -->
      <div class="hidden md:flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <TtcSymbol size-class="w-5 h-5 opacity-50" />
          <span class="font-outfit font-medium text-xs tracking-[3px] text-ttc-text-dim">
            text <span class="text-ttc-primary/60">the</span> check
          </span>
        </div>

        <!-- Copyright -->
        <p class="font-body text-xs text-ttc-text-dim">
          &copy; 2026 Text the Check &middot; Hecho en Argentina
        </p>

        <!-- Instagram icon -->
        <a
          href="https://www.instagram.com/textthecheck"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-lg hover:bg-ttc-card transition-colors"
          aria-label="Instagram @textthecheck"
        >
          <Instagram :size="16" :stroke-width="1.5" class="text-ttc-text-dim hover:text-ttc-text-muted" />
        </a>
      </div>

      <!-- Mobile: two rows -->
      <div class="flex flex-col items-center gap-3 md:hidden">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <TtcSymbol size-class="w-5 h-5 opacity-50" />
            <span class="font-outfit font-medium text-xs tracking-[3px] text-ttc-text-dim">
              text <span class="text-ttc-primary/60">the</span> check
            </span>
          </div>
          <a
            href="https://www.instagram.com/textthecheck"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-lg hover:bg-ttc-card transition-colors"
            aria-label="Instagram @textthecheck"
          >
            <Instagram :size="16" :stroke-width="1.5" class="text-ttc-text-dim" />
          </a>
        </div>
        <p class="font-body text-xs text-ttc-text-dim">
          &copy; 2026 Text the Check &middot; Hecho en Argentina
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
