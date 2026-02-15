<template>
  <div
    @click="$emit('select')"
    :class="[
      'bg-ttc-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
      isActive
        ? mode === 'viajes'
          ? 'border-ttc-primary/40 ring-1 ring-ttc-primary/20'
          : 'border-ttc-accent/40 ring-1 ring-ttc-accent/20'
        : 'border-ttc-border'
    ]"
  >
    <!-- Top accent bar -->
    <div
      :class="[
        'h-[3px] transition-colors duration-200',
        isActive
          ? mode === 'viajes' ? 'bg-ttc-primary' : 'bg-ttc-accent'
          : 'bg-transparent'
      ]"
    />

    <div class="p-6">
      <!-- Icon -->
      <div
        :class="[
          'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200',
          isActive
            ? mode === 'viajes' ? 'bg-ttc-primary/15' : 'bg-ttc-accent/15'
            : 'bg-ttc-border/50'
        ]"
      >
        <component
          :is="mode === 'viajes' ? Plane : Wallet"
          :size="22"
          :stroke-width="1.5"
          :class="[
            'transition-colors duration-200',
            isActive
              ? mode === 'viajes' ? 'text-ttc-primary' : 'text-ttc-accent'
              : 'text-ttc-text-dim'
          ]"
        />
      </div>

      <!-- Tag -->
      <span
        :class="[
          'inline-block font-body font-semibold text-[11px] tracking-[1px] uppercase px-2.5 py-1 rounded-md mb-4 transition-colors duration-200',
          isActive
            ? mode === 'viajes'
              ? 'text-ttc-primary bg-ttc-primary/10'
              : 'text-ttc-accent bg-ttc-accent/10'
            : 'text-ttc-text-dim bg-ttc-border/50'
        ]"
      >
        {{ mode === 'viajes' ? 'Viajes y salidas' : 'Finanzas personales' }}
      </span>

      <!-- Title -->
      <h3 class="font-nunito font-bold text-xl text-ttc-text mb-3">
        {{ mode === 'viajes' ? 'Viajes y Grupos' : 'Mis Finanzas' }}
      </h3>

      <!-- Description -->
      <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-5">
        {{ mode === 'viajes'
          ? 'Mandá un mensaje como "50 cena con Gonza" y listo. Se calcula solo quién debe a quién. Cuando termina el viaje, todos saben cuánto poner.'
          : 'Anotá lo que gastás en el día, configurá tus pagos fijos y que te avise antes de cada vencimiento. Sin planillas, sin apps que no abrís.'
        }}
      </p>

      <!-- Features -->
      <ul class="space-y-2.5">
        <li
          v-for="(feature, i) in features"
          :key="i"
          class="flex items-center gap-2.5 font-body text-sm text-ttc-text-muted"
        >
          <component
            :is="feature.icon"
            :size="14"
            :stroke-width="1.5"
            :class="[
              'mt-0.5 flex-shrink-0 transition-colors duration-200',
              isActive
                ? mode === 'viajes' ? 'text-ttc-primary' : 'text-ttc-accent'
                : 'text-ttc-text-dim'
            ]"
          />
          {{ feature.text }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import {
  Plane, Wallet,
  MessageSquareText, ArrowLeftRight, DollarSign,
  CalendarClock, ChartLine,
} from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (v) => ['viajes', 'finanzas'].includes(v),
  },
  isActive: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const features = computed(() => {
  if (props.mode === 'viajes') {
    return [
      { icon: MessageSquareText, text: 'Escribí como hablás — te entiende perfecto' },
      { icon: ArrowLeftRight, text: 'Sabe quién debe a quién, siempre actualizado' },
      { icon: DollarSign, text: 'Pesos, dólares o reales — vos elegís' },
    ]
  }
  return [
    { icon: MessageSquareText, text: 'Un mensaje para registrar cualquier gasto' },
    { icon: CalendarClock, text: 'Te avisa antes de que venza el alquiler, Netflix, o lo que sea' },
    { icon: ChartLine, text: 'Resumen semanal de en qué se te fue la plata' },
  ]
})
</script>
