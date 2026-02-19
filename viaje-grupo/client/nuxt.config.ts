// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'unplugin-icons/nuxt',
    'dayjs-nuxt'
  ],

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

  typescript: {
    strict: true,
    typeCheck: false
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Text The Check',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Collaborative expense tracking platform for group vacations'
        },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || ''
    }
  },

  // Route rules for static generation
  // Auth-protected pages use ssr: false and shouldn't be prerendered
  routeRules: {
    '/': { prerender: false },
    '/login': { prerender: false },
    '/profile': { prerender: false },
    '/grupos/**': { ssr: false },
    '/finanzas/**': { ssr: false }
  }
})
