// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/assets/css/main.css", "~/assets/css/style.css", "vue3-toastify/dist/index.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  modules: [
    "dayjs-nuxt",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "@vite-pwa/nuxt",
    "unplugin-icons/nuxt"
  ],

  dayjs: {
    locales: ['es'],
    defaultLocale: 'es',
  },

  routeRules: {
    // Public pages: prerendered at build time for SEO
    '/': { prerender: true },
    '/welcome': { prerender: true },
    '/faq': { prerender: true },
    '/term-of-service': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/404': { prerender: true },
    // Auth-protected pages: SPA mode (no SSR)
    '/fijos': { ssr: false },
    '/one-time': { ssr: false },
    '/summary': { ssr: false },
    '/weekly-summary': { ssr: false },
    '/contact-us': { ssr: false },
    '/settings/**': { ssr: false },
    '/edit/**': { ssr: false },
    '/history': { ssr: false },
    '/new-payment': { ssr: false },
  },

  runtimeConfig: {
    public: {
      contactEmail: process.env.CONTACT_EMAIL || 'andrealopezpalomeque@gmail.com',
      // Firebase configuration
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || 'viaje-grupo.firebaseapp.com',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'viaje-grupo.firebasestorage.app',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '354390404090',
      firebaseAppId: process.env.FIREBASE_APP_ID || '1:354390404090:web:ad36b54ab66bc7bc66d243',
      // FCM Push Notifications
      firebaseVapidKey: process.env.FIREBASE_VAPID_KEY || ''
    }
  },

  // @ts-ignore
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "PayTrackr",
      short_name: "PayTrackr",
      description: "Track and manage your recurring and one-time payments",
      theme_color: "#27292D", // Assuming this is your primary color
      background_color: "#27292D",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        {
          src: "/img/icon-192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/img/icon-512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/img/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,png,svg,ico,woff,woff2}'],
      navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js$/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20 // check for updates every 20 minutes
    },
    devOptions: {
      enabled: false,
      type: "module"
    }
  },

  app: {
    head: {
      htmlAttrs: { dir: "ltr", lang: "es" },
      link: [{ rel: "icon", type: "image/png", href: "/img/icon-192.png" }],
      meta: [
        {
          name: "google-site-verification",
          content: "E0U6Yf1iG222FwlRLisvf7JLYZLZQnT8CLJ3QKo4tjQ"
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        }
      ]
    }
  },

  compatibilityDate: "2025-07-15"
});
