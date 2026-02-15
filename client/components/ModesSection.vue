<template>
  <section class="pt-16 md:pt-20 pb-20 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Section label -->
      <p class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-text-muted text-center mb-3">
        dos modos, un chat
      </p>

      <!-- Section title -->
      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl text-ttc-text text-center mb-3">
        Todo registrado, todo al día — desde un mensaje
      </h2>

      <!-- Subtitle -->
      <p class="font-body text-[15px] text-ttc-text-muted text-center mb-12 max-w-[520px] mx-auto">
        No importa si es una birra con amigos o el alquiler del mes.
      </p>

      <!-- Cards grid -->
      <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <!-- Card 1: Viajes / Grupos -->
        <div class="bg-ttc-card border border-ttc-border rounded-xl overflow-hidden">
          <!-- Top accent bar -->
          <div class="h-[3px] bg-ttc-primary" />

          <div class="p-6">
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-ttc-primary/10 flex items-center justify-center mb-3">
              <Plane :size="22" :stroke-width="1.5" class="text-ttc-primary" />
            </div>

            <!-- Tag -->
            <span class="inline-block font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-primary bg-ttc-primary/10 px-2.5 py-1 rounded-md mb-4">
              Dividí gastos con amigos
            </span>

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
                Escribí como hablás — te entiende perfecto
              </li>
              <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
                <ArrowLeftRight :size="14" :stroke-width="1.5" class="text-ttc-primary mt-0.5 flex-shrink-0" />
                Sabe quién debe a quién, siempre actualizado
              </li>
              <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
                <DollarSign :size="14" :stroke-width="1.5" class="text-ttc-primary mt-0.5 flex-shrink-0" />
                Multi-moneda (ARS, USD, BRL)
              </li>
            </ul>
          </div>
        </div>

        <!-- Card 2: Mis Finanzas -->
        <div class="bg-ttc-card border border-ttc-border rounded-xl overflow-hidden">
          <!-- Top accent bar -->
          <div class="h-[3px] bg-ttc-accent" />

          <div class="p-6">
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-ttc-accent/10 flex items-center justify-center mb-3">
              <Wallet :size="22" :stroke-width="1.5" class="text-ttc-accent" />
            </div>

            <!-- Tag -->
            <span class="inline-block font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-accent bg-ttc-accent/10 px-2.5 py-1 rounded-md mb-4">
              Finanzas personales
            </span>

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
                Un mensaje para registrar cualquier gasto
              </li>
              <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
                <CalendarClock :size="14" :stroke-width="1.5" class="text-ttc-accent mt-0.5 flex-shrink-0" />
                Te avisa antes de que venza el alquiler, Netflix, o lo que sea
              </li>
              <li class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted">
                <ChartLine :size="14" :stroke-width="1.5" class="text-ttc-accent mt-0.5 flex-shrink-0" />
                Resumen semanal de en qué se te fue la plata
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Plane, Wallet, MessageSquareText, ArrowLeftRight, DollarSign, CalendarClock, ChartLine } from 'lucide-vue-next'
</script>
