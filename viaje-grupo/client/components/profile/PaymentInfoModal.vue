<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="$emit('close')"
      />

      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <UserAvatar
                :name="user?.name"
                :photo-url="null"
                size="md"
                variant="positive"
              />
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ user?.name }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Datos de pago</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <IconClose class="w-6 h-6" />
            </button>
          </div>

          <!-- Payment Info -->
          <div v-if="hasPaymentInfo" class="space-y-3">
            <PaymentInfoRow
              v-if="user?.paymentInfo?.cbu"
              label="CBU"
              :value="user.paymentInfo.cbu"
              field-key="modal-cbu"
            />

            <PaymentInfoRow
              v-if="user?.paymentInfo?.cvu"
              label="CVU"
              :value="user.paymentInfo.cvu"
              field-key="modal-cvu"
            />

            <PaymentInfoRow
              v-if="user?.paymentInfo?.alias"
              label="Alias"
              :value="user.paymentInfo.alias"
              field-key="modal-alias"
              :mono="false"
            />

            <div v-if="user?.paymentInfo?.bankName" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <p class="text-xs text-gray-500 dark:text-gray-400">Banco/Plataforma</p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ user.paymentInfo.bankName }}
              </p>
            </div>
          </div>

          <!-- No payment info -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <IconCreditCard class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-gray-500 dark:text-gray-400">
              {{ user?.name }} no ha configurado sus datos de pago.
            </p>
          </div>

          <!-- Close button -->
          <div class="mt-6">
            <button
              @click="$emit('close')"
              class="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import IconClose from '~icons/mdi/close'
import IconCreditCard from '~icons/mdi/credit-card-outline'

const props = defineProps({
  user: { type: Object, default: null }
})

defineEmits(['close'])

const hasPaymentInfo = computed(() => {
  const info = props.user?.paymentInfo
  if (!info) return false
  return !!(info.cbu || info.cvu || info.alias || info.bankName)
})
</script>
