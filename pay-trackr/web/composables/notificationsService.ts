export function useNotifications() {
  const notificationsSupported = ref(
    'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  );
  const notificationPermission = ref(
    notificationsSupported.value ? Notification.permission : 'denied'
  );

  // Request permission for notifications
  async function requestPermission() {
    if (!notificationsSupported.value) return false;
    
    try {
      const permission = await Notification.requestPermission();
      notificationPermission.value = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Send a notification for a payment due
  function sendPaymentDueNotification(payment: any) {
    if (!notificationsSupported.value || notificationPermission.value !== 'granted') {
      return false;
    }

    try {
      const { title, amount, category, dueDateDay } = payment;
      const amountFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(amount);

      const notification = new Notification('Recordatorio de Pago', {
        body: `Tu pago de ${title} (${amountFormatted}) vence el día ${dueDateDay}`,
        icon: '/img/new-logo.png',
        badge: '/img/new-logo.png',
        tag: `payment-${payment.id}`,
        data: { paymentId: payment.id },
        requireInteraction: true,
      });

      notification.onclick = function() {
        window.focus();
        window.open('/fijos', '_self');
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Check for upcoming payments and send notifications
  async function checkForDuePayments(recurrentStore: any) {
    if (!notificationsSupported.value || notificationPermission.value !== 'granted') {
      return;
    }

    try {
      const { $dayjs } = useNuxtApp();
      const today = $dayjs();
      const upcomingThreshold = 3; // days before due date to notify

      // Get recurrent payments that have upcoming due dates
      const payments = recurrentStore.getRecurrentPayments;
      
      for (const payment of payments) {
        // Get the due date for the current month
        const dueDayOfMonth = parseInt(payment.dueDateDay);
        const dueDate = $dayjs().date(dueDayOfMonth);
        
        // If the due day already passed this month, look at next month's due date
        const adjustedDueDate = dueDate.isBefore(today) 
          ? dueDate.add(1, 'month') 
          : dueDate;
        
        // Calculate days until due
        const daysUntilDue = adjustedDueDate.diff(today, 'day');

        // Check if payment is due soon or overdue
        if (daysUntilDue <= upcomingThreshold && daysUntilDue >= 0) {
          // Check if this payment for the current month is already paid
          const currentMonth = today.format('MMM');
          const processedPayments = recurrentStore.getProcessedRecurrents;
          const processedPayment = processedPayments.find((p: any) => p.id === payment.id);
          
          if (processedPayment && 
              processedPayment.months[currentMonth] && 
              !processedPayment.months[currentMonth].isPaid) {
            // Payment is due soon and not paid - send notification
            sendPaymentDueNotification(payment);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for due payments:', error);
    }
  }

  return {
    notificationsSupported,
    notificationPermission,
    requestPermission,
    sendPaymentDueNotification,
    checkForDuePayments
  };
}