<template>
  <admin-navigation />
  <div class="container min-h-screen bg-dark text-neutral-200 overflow-auto">

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="flex  items-center justify-between px-6 py-4 border-b border-gray-200">
        <div class="flex flex-col">
          <h1 class="text-md sm:text-xl font-semibold">
            {{ pageTitle }}
          </h1>
          <!-- subtitle -->
          <h2 class="text-sm font-semibold text-gray-500">
            {{ subtitle }}
          </h2>
        </div>
        <!-- Avatar -->
        <!-- <UButton variant="ghost" size="lg" icon="i-heroicons-user-circle text-3xl" /> -->
      </header>

      <!-- Page Content -->
      <UContainer class="py-3">
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

const subtitle = computed(() => {
  return route.meta.subtitle || ''
})

</script>
