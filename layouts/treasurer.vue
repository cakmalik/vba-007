<template>
  <admin-navigation />
  <div class="flex min-h-screen bg-gray-50 text-gray-800">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header
        class="flex items-center justify-between px-6 py-1 border-b border-gray-200"
      >
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ pageTitle }}
        </h1>

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
const route = useRoute();

// Tentukan halaman aktif berdasarkan route
const pageTitle = computed(() => {
  return route.meta.title || "Dashboard";
});
</script>
