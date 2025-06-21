<script setup lang="ts">
const isSidebarOpen = ref(false)

const links = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/admin' },
  { label: 'Users', icon: 'i-heroicons-user-group', to: '/admin/users' },
  { label: 'Settings', icon: 'i-heroicons-cog-6-tooth', to: '/admin/settings' }
]
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:block w-64 bg-gray-100 border-r">
      <div class="p-4 font-bold text-lg">My App</div>
      <UVerticalNavigation :links="links" class="p-4" />
    </aside>

    <!-- Slideover (Mobile) -->
    <USlideover v-model="isSidebarOpen" class="md:hidden">
      <div class="p-4 font-bold text-lg">My App</div>
      <UVerticalNavigation :links="links" class="p-4" />
    </USlideover>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="flex items-center justify-between p-4 border-b">
        <button class="md:hidden" @click="isSidebarOpen = true">
          <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
        </button>
        <div class="font-semibold">Admin Panel</div>
        <UAvatar size="sm" src="https://i.pravatar.cc/300" />
      </header>

      <!-- Page content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
