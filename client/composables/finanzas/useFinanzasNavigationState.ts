export const useFinanzasNavigationState = () => {
  const isNewPaymentModalOpen = useState<boolean>('finanzas-new-modal-open', () => false)
  const newPaymentModalType = useState<'recurrent' | 'one-time'>('finanzas-new-modal-type', () => 'one-time')

  const openNewPaymentModal = (type: 'recurrent' | 'one-time' = 'one-time') => {
    newPaymentModalType.value = type
    isNewPaymentModalOpen.value = true
  }

  const closeNewPaymentModal = () => {
    isNewPaymentModalOpen.value = false
  }

  return {
    isNewPaymentModalOpen: readonly(isNewPaymentModalOpen),
    newPaymentModalType: readonly(newPaymentModalType),
    openNewPaymentModal,
    closeNewPaymentModal,
  }
}
