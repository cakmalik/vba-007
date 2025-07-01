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
    '@nuxtjs/supabase'
  ],
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
