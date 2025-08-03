<template>
  <div class="min-h-screen bg-dark text-neutral-200 flex flex-col">
    <!-- Navigation -->
    <admin-navigation />

    <!-- Main Layout -->
    <div class="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <header class="w-full max-w-5xl py-4 mb-4 text-center">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ pageTitle }}
        </h1>
        <p
          v-if="subtitle"
          class="text-sm text-gray-400 mt-1 dark:text-gray-400"
        >
          {{ subtitle }}
        </p>
      </header>

      <!-- Page Content -->
      <div class="w-full max-w-5xl flex-1 pb-14">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const pageTitle = computed(() => route.meta.title || "Dashboard");
const subtitle = computed(() => route.meta.subtitle || "");
</script>
