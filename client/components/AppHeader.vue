<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-ttc-surface border-b border-ttc-border">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-2.5">
        <img
          src="/img/ttc_symbol.svg"
          alt="Text the Check"
          class="w-7 h-7"
        />
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 text-ttc-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>

        <!-- Theme toggle -->
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
