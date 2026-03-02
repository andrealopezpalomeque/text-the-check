<template>
  <div class="bg-ttc-card rounded-xl shadow-sm border border-ttc-border">
    <!-- Header with Toggle -->
    <div class="px-3 py-3 border-b border-ttc-border">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <IconSwapHorizontal class="w-5 h-5 text-ttc-text-muted" />
          <h3 class="font-display text-base font-semibold text-ttc-text">
            Para Saldar Deudas
          </h3>
        </div>

        <!-- Simplification Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-ttc-text-muted">Simplificar</span>
          <button
            @click="$emit('toggle-simplify')"
            :class="[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              simplified ? 'bg-blue-600' : 'bg-ttc-border'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                simplified ? 'translate-x-4' : 'translate-x-0.5'
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Info message when simplified but no effect -->
      <p v-if="showNoEffectMessage"
         class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
        <IconInformation class="w-4 h-4 flex-shrink-0" />
        Las deudas ya estan simplificadas al maximo
      </p>

      <!-- Normal explanation text when simplified has effect -->
      <p v-else-if="simplified" class="text-xs text-ttc-text-muted mt-1">
        Transferencias reducidas al minimo. No se muestra desglose por gasto.
      </p>
    </div>

    <!-- All Settled State -->
    <div v-if="settlements.length === 0" class="p-8 text-center">
      <div class="w-14 h-14 mx-auto mb-3 bg-positive-100 dark:bg-positive-900/30 rounded-full flex items-center justify-center">
        <IconCheck class="w-7 h-7 text-positive-600 dark:text-positive-400" />
      </div>
      <p class="text-ttc-text-muted font-medium">Todos al dia</p>
      <p class="text-sm text-ttc-text-muted mt-1">No hay deudas pendientes</p>
    </div>

    <!-- Settlement Items -->
    <div v-else class="divide-y divide-ttc-border">
      <SettlementItem
        v-for="(settlement, index) in settlements"
        :key="`${settlement.fromUserId}-${settlement.toUserId}-${index}`"
        :settlement="settlement"
        :index="index"
        :simplified="simplified"
      />
    </div>
  </div>
</template>

<script setup>
import IconSwapHorizontal from '~icons/mdi/swap-horizontal'
import IconCheck from '~icons/mdi/check'
import IconInformation from '~icons/mdi/information-outline'

defineProps({
  settlements: { type: Array, required: true },
  simplified: { type: Boolean, default: false },
  showNoEffectMessage: { type: Boolean, default: false }
})

defineEmits(['toggle-simplify'])
</script>
