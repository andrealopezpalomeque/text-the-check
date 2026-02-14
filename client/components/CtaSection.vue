<template>
  <section class="py-20 px-4">
    <div class="max-w-md mx-auto">
      <div class="bg-ttc-card border border-ttc-border rounded-2xl p-8 text-center">
        <!-- Badge -->
        <span class="inline-block font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-secondary bg-ttc-secondary/10 px-3 py-1.5 rounded-md mb-5">
          Próximamente
        </span>

        <!-- Copy -->
        <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-6">
          Estamos construyendo algo grande. Seguinos para enterarte primero.
        </p>

        <!-- Instagram link -->
        <a
          href="https://www.instagram.com/textthecheck"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2.5 bg-ttc-primary text-white font-body font-semibold text-sm py-2.5 px-5 rounded-btn hover:opacity-90 transition-opacity"
        >
          <Instagram :size="18" :stroke-width="1.5" />
          @textthecheck
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Instagram } from 'lucide-vue-next'
</script>
