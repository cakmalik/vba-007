<template>
  <div class="min-h-screen bg-dark text-neutral-200 flex flex-col">
    <div class="fixed top-0 right-0 p-4 z-50">
      <ColorModeButton />
      <UButton to="/login" variant="default" icon="i-lucide-key-round" />
    </div>
    <!-- Main Layout -->
    <div class="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <header class="w-full max-w-5xl py-4 mb-4 text-center">
        <h1 class="text-xl font-semibold text-primary">
          {{ pageTitle }}
        </h1>
        <p v-if="subtitle" class="text-sm text-gray-400 mt-1">{{ subtitle }}</p>
      </header>

      <!-- Page Content -->
      <div class="w-full max-w-5xl flex-1 pb-14">
        <slot />
      </div>

      <nav
        class="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50"
      >
        <ul class="flex justify-around items-center h-16">
          <li>
            <NuxtLink
              to="/dashboard-public"
              class="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-primary-600"
              :class="{
                'text-primary-600 dark:text-primary-600 font-semibold':
                  $route.path === '/dashboard-public',
              }"
            >
              <UIcon name="i-lucide-house" class="size-5" />
              <span class="text-xs">Beranda</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/dues/history"
              class="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-primary-600"
              :class="{
                'text-primary-600 dark:text-primary-600 font-semibold':
                  $route.path === '/dues/history',
              }"
            >
              <UIcon name="i-lucide-history" class="size-5" />
              <span class="text-xs">Iuran</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/cashflow"
              class="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-primary-600"
              :class="{
                'text-primary-600 dark:text-primary-600 font-semibold':
                  $route.path === '/cashflow',
              }"
            >
              <UIcon name="i-lucide-arrow-left-right" class="size-5" />
              <span class="text-xs">Kas</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/pay"
              class="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-primary-600"
              :class="{
                'text-primary-600 dark:text-primary-600 font-semibold':
                  $route.path === '/pay',
              }"
            >
              <UIcon name="i-lucide-banknote" class="size-5" />
              <span class="text-xs">Bayar</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const pageTitle = computed(() => route.meta.title || "Dashboard");
const subtitle = computed(() => route.meta.subtitle || "");
</script>
