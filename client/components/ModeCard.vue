<template>
  <div
    @click="$emit('select')"
    :class="[
      'bg-ttc-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
      isActive
        ? mode === 'viajes'
          ? 'border-[#4A90D9]/40 ring-1 ring-[#4A90D9]/20'
          : 'border-[#34D399]/40 ring-1 ring-[#34D399]/20'
        : 'border-ttc-border'
    ]"
  >
    <!-- Top accent bar -->
    <div
      :class="[
        'h-[3px] transition-colors duration-200',
        isActive
          ? mode === 'viajes' ? 'bg-[#4A90D9]' : 'bg-[#34D399]'
          : 'bg-transparent'
      ]"
    />

    <div class="p-6">
      <!-- Icon + Tag row -->
      <div class="flex items-center gap-3 mb-5">
        <div
          :class="[
            'w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200',
            isActive
              ? mode === 'viajes' ? 'bg-ttc-toggle-primary text-ttc-primary' : 'bg-ttc-toggle-accent text-ttc-accent'
              : 'bg-ttc-surface text-ttc-text-dim'
          ]"
        >
          <component
            :is="mode === 'viajes' ? Plane : Wallet"
            :size="20"
            :stroke-width="1.5"
          />
        </div>
        <span
          :class="[
            'font-body font-semibold text-[11px] tracking-[1px] uppercase transition-colors duration-200',
            isActive
              ? mode === 'viajes' ? 'text-ttc-primary' : 'text-ttc-accent'
              : 'text-ttc-text-muted'
          ]"
        >
          {{ mode === 'viajes' ? 'Dividí gastos con amigos' : 'Finanzas personales' }}
        </span>
      </div>

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
      <ul class="space-y-3">
        <li
          v-for="(feature, i) in features"
          :key="i"
          class="flex items-start gap-3 font-body text-sm leading-relaxed text-ttc-text-muted"
        >
          <div
            :class="[
              'mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              mode === 'viajes' ? 'bg-ttc-toggle-primary text-ttc-primary' : 'bg-ttc-toggle-accent text-ttc-accent'
            ]"
          >
            <component
              :is="feature.icon"
              :size="16"
              :stroke-width="1.5"
            />
          </div>
          <span class="pt-1">{{ feature.text }}</span>
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
