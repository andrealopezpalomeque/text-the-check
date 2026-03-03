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
        <div class="relative bg-ttc-card rounded-xl shadow-xl max-w-md w-full p-6">
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
                <h3 class="text-lg font-semibold text-ttc-text">
                  {{ user?.name }}
                </h3>
                <p class="text-sm text-ttc-text-muted">Datos de pago</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="text-ttc-text-muted hover:text-ttc-text p-1"
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

            <div v-if="user?.paymentInfo?.bankName" class="bg-ttc-surface rounded-lg px-3 py-2">
              <p class="text-xs text-ttc-text-muted">Banco/Plataforma</p>
              <p class="text-sm text-ttc-text">
                {{ user.paymentInfo.bankName }}
              </p>
            </div>
          </div>

          <!-- No payment info -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-ttc-input rounded-full flex items-center justify-center">
              <IconCreditCard class="w-8 h-8 text-ttc-text-muted" />
            </div>
            <p class="text-ttc-text-muted">
              {{ user?.name }} no ha configurado sus datos de pago.
            </p>
          </div>

          <!-- Close button -->
          <div class="mt-6">
            <button
              @click="$emit('close')"
              class="w-full px-4 py-2.5 bg-ttc-input hover:bg-ttc-card-hover text-ttc-text rounded-xl transition-colors font-medium"
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
