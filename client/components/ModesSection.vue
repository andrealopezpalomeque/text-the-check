<template>
  <section class="py-20 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Section label -->
      <p class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-text-dim text-center mb-3">
        un ecosistema, dos modos
      </p>

      <!-- Section title -->
      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl text-ttc-text text-center mb-12">
        Todo lo que necesitás, en un solo lugar
      </h2>

      <!-- Cards grid -->
      <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <!-- Card 1: Viajes / Grupos -->
        <div class="bg-ttc-card border border-ttc-border rounded-xl p-6">
          <!-- Icon + tag -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-ttc-primary/10 flex items-center justify-center">
              <Plane :size="22" :stroke-width="1.5" class="text-ttc-primary" />
            </div>
            <span class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-primary bg-ttc-primary/10 px-2.5 py-1 rounded-md">
              Dividí gastos con amigos
            </span>
          </div>

          <!-- Title -->
          <h3 class="font-nunito font-bold text-xl text-ttc-text mb-3">
            Viajes y Grupos
          </h3>

          <!-- Description -->
          <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-5">
            Registrá gastos grupales por WhatsApp, calculá quién debe a quién y resolvé todo fácil. Ideal para viajes, convivencias y salidas.
          </p>

          <!-- Features -->
          <ul class="space-y-2.5">
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <MessageSquareText :size="14" :stroke-width="1.5" class="text-ttc-primary mt-0.5 flex-shrink-0" />
              Gastos por WhatsApp con IA
            </li>
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <ArrowLeftRight :size="14" :stroke-width="1.5" class="text-ttc-primary mt-0.5 flex-shrink-0" />
              Balances automáticos y justos
            </li>
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <DollarSign :size="14" :stroke-width="1.5" class="text-ttc-primary mt-0.5 flex-shrink-0" />
              Multi-moneda (ARS, USD, BRL)
            </li>
          </ul>
        </div>

        <!-- Card 2: Mis Finanzas -->
        <div class="bg-ttc-card border border-ttc-border rounded-xl p-6">
          <!-- Icon + tag -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-ttc-accent/10 flex items-center justify-center">
              <Wallet :size="22" :stroke-width="1.5" class="text-ttc-accent" />
            </div>
            <span class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-accent bg-ttc-accent/10 px-2.5 py-1 rounded-md">
              Tu día a día financiero
            </span>
          </div>

          <!-- Title -->
          <h3 class="font-nunito font-bold text-xl text-ttc-text mb-3">
            Mis Finanzas
          </h3>

          <!-- Description -->
          <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-5">
            Llevá el control de tus gastos diarios, pagos recurrentes y tarjetas. Recibí análisis inteligentes de tus hábitos financieros.
          </p>

          <!-- Features -->
          <ul class="space-y-2.5">
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <MessageSquareText :size="14" :stroke-width="1.5" class="text-ttc-accent mt-0.5 flex-shrink-0" />
              Registro rápido por WhatsApp
            </li>
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <CalendarClock :size="14" :stroke-width="1.5" class="text-ttc-accent mt-0.5 flex-shrink-0" />
              Pagos recurrentes y recordatorios
            </li>
            <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
              <ChartLine :size="14" :stroke-width="1.5" class="text-ttc-accent mt-0.5 flex-shrink-0" />
              Análisis con IA de tus gastos
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Plane, Wallet, MessageSquareText, ArrowLeftRight, DollarSign, CalendarClock, ChartLine } from 'lucide-vue-next'
</script>
