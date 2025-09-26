// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/docs/api/configuration/nuxt-config
  runtimeConfig: {
    apiSecret: '123',
    fonnte: process.env.fonnte,
    TRANSFER_ONLY: process.env.TRANSFER_ONLY || true,
    // supabaseUrl: '',
    // supabaseKey: '',

    public: {
      supabaseRedirectUrl: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3000/confirm',
      apiBase: '/api',
      emailRedirect: 'http://localhost:3000/confirm',
      transferOnly: process.env.NUXT_PUBLIC_TRANSFER_ONLY || true
    }
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/supabase',
  ],


  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      transitions: true
    },
  },
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/dashboard-public',
      callback: '/confirm',
      exclude: ['/login', '/confirm', '/dues/history', '/cashflow', '/pay', '/about', '/dashboard-public', '/resident', '/invoice*'],
    }
  }
  // image: {
  //   provider: 'none' // atau disable sepenuhnya
  // }
})
