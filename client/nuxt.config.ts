export default defineNuxtConfig({
  compatibilityDate: '2026-02-14',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],
  googleFonts: {
    families: {
      'Outfit': [500, 600],
      'Nunito': [700, 800],
      'DM Sans': [400, 500, 600, 700],
    },
    display: 'swap',
  },
  app: {
    head: {
      title: 'Text the Check — Tu plata, a un mensaje',
      meta: [
        { name: 'description', content: 'Tu compañero financiero por WhatsApp. Dividí gastos de viajes con amigos o llevá tus finanzas personales, todo en un mensaje.' },
        { name: 'theme-color', content: '#0C1017' },
        { property: 'og:title', content: 'Text the Check — Tu plata, a un mensaje' },
        { property: 'og:description', content: 'Tu compañero financiero por WhatsApp. Dividí gastos de viajes con amigos o llevá tus finanzas personales, todo en un mensaje.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://textthecheck.app' },
        { property: 'og:image', content: 'https://textthecheck.app/img/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Text the Check — Tu compañero financiero por WhatsApp' },
        { property: 'og:locale', content: 'es_AR' },
        { property: 'og:site_name', content: 'Text the Check' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Text the Check — Tu plata, a un mensaje' },
        { name: 'twitter:description', content: 'Tu compañero financiero por WhatsApp. Dividí gastos de viajes con amigos o llevá tus finanzas personales, todo en un mensaje.' },
        { name: 'twitter:image', content: 'https://textthecheck.app/img/og-image.png' },
      ],
      htmlAttrs: {
        lang: 'es',
      },
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'canonical', href: 'https://textthecheck.app' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  ssr: false,
  nitro: {
    preset: 'static',
  },
})
