<template>
  <div>
    <VitePwaManifest />
    <NuxtLoadingIndicator color="#a0a4d9" :height="10" :throttle="0" :rtl="false" :continuous="true" />
    <NotificationManager v-if="user" />
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>

<script setup>

useHead({
  titleTemplate: "%s | WiseUtils",
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'PayTrackr',
        url: 'https://paytrackr.wiseutils.com',
        logo: 'https://paytrackr.wiseutils.com/img/new-logo.png',
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PayTrackr',
        url: 'https://paytrackr.wiseutils.com',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        description: 'Plataforma web para seguir tus gastos y mantener tus finanzas organizadas. Integración con WhatsApp para registrar gastos y notificaciones inteligentes con análisis de IA.',
        featureList: [
          'Seguimiento de pagos fijos y únicos',
          'Resúmenes y gráficos de gastos',
          'Integración con WhatsApp',
          'Notificaciones con análisis de IA',
          'Exportación de datos',
        ],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ARS',
        },
      }),
    },
  ],
});

const { $pwa } = useNuxtApp();
const user = import.meta.server ? null : getCurrentUser();

onMounted(() => {
  // PWA installation status available via $pwa?.isPWAInstalled
});
</script>