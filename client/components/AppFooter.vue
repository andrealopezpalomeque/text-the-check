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
          class="font-body text-xs text-ttc-text-dim hover:text-ttc-text-muted transition-colors"
        >
          @textthecheck
        </a>
      </div>

      <!-- Copyright + Buenos Aires -->
      <div class="flex flex-col items-center gap-1">
        <p class="font-body text-xs text-ttc-text-dim">
          &copy; 2026 Text the Check
        </p>
        <p class="font-body text-xs text-ttc-text-dim">
          Hecho en Buenos Aires 🇦🇷
        </p>
      </div>
    </div>
  </footer>
</template>
