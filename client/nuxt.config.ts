export default defineNuxtConfig({
  compatibilityDate: '2026-02-14',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'unplugin-icons/nuxt',
    'dayjs-nuxt'
  ],
  imports: {
    dirs: [
      'stores',
      'stores/grupos',
      'stores/finanzas',
      'composables',
      'composables/finanzas',
    ]
  },
  googleFonts: {
    families: {
      'Outfit': [500, 600],
      'Nunito': [700, 800],
      'DM Sans': [400, 500, 600, 700],
      'Poppins': [600, 700],
      'Inter': [400, 500, 600],
    },
    display: 'swap',
  },
  dayjs: {
    locales: ['es'],
    defaultLocale: 'es'
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  app: {
    head: {
      title: 'Text the Check — Tu plata, a un mensaje',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
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
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
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
  experimental: {
    appManifest: false
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3002',
      whatsappPhoneNumber: process.env.WHATSAPP_LANDING_PHONE || '',
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || ''
    }
  },
  routeRules: {
    '/login': { prerender: false },
    '/profile': { prerender: false },
    '/grupos/**': { ssr: false },
    '/finanzas/**': { ssr: false }
  }
})
