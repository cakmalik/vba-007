<template>
  <admin-navigation />
  <div class="flex min-h-screen bg-gray-50 text-gray-800">

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 class="text-xl font-semibold">
          {{ pageTitle }}
        </h1>

        <!-- Avatar -->
        <UButton variant="ghost" size="lg" icon="i-heroicons-user-circle text-3xl" />
      </header>

      <!-- Page Content -->
      <UContainer class="py-6">
        <slot />
      </UContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Tentukan halaman aktif berdasarkan route
const pageTitle = computed(() => {
  return route.meta.title || 'Dashboard'
})

// Link navigasi sidebar
const navLinks = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/admin' },
  { label: 'Users', icon: 'i-heroicons-users', to: '/admin/users' },
  { label: 'Payments', icon: 'i-heroicons-currency-dollar', to: '/admin/payments' },
  { label: 'Settings', icon: 'i-heroicons-cog-6-tooth', to: '/admin/settings' }
]
</script>
