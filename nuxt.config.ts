// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: '123',
    // supabaseUrl: '',
    // supabaseKey: '',

    public: {
      supabaseRedirectUrl: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3000/confirm',
      apiBase: '/api',
      emailRedirect: 'http://localhost:3000/confirm'
    }
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt'
  ],

  pwa: {
    manifest: {
      name: "RT007 VBA",
      short_name: "007",
      description: "Perumahan Villa Bintaro Asri RT007",
      icons: [
        {
          src: "icons/icon_64x64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "icons/icon_144x144.png",
          sizes: "144x144",
          type: "image/png",
        },
        {
          src: "icons/icon_192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "icons/icon_512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      transitions: true
    }
  },
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/dashboard-public',
      callback: '/confirm',
      exclude: ['/login', '/confirm', '/dues/history', '/cashflow', '/pay', '/dashboard-public', '/resident'],
    }
  }
  // image: {
  //   provider: 'none' // atau disable sepenuhnya
  // }
})
