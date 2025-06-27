<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'
const route = useRoute()

const ddItems = ref<DropdownMenuItem[]>([
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    onSelect: handleLogout
  },
])

function handleLogout() {
  console.log('Logout')
  // Logika logout (sesuaikan dengan autentikasi kamu)
  // Misalnya pakai navigateTo + clear token
  alert('Logging out...')
  // Contoh:
  // useAuth().logout()
  // navigateTo('/login')
}
const items = ref<NavigationMenuItem[][]>([
  [
    {
      icon: 'i-lucide-house',
      to: '/dashboard',
      active: false
    },
    {
      label: 'Data',
      icon: 'i-lucide-book-open',
      children: [
        {
          label: 'Warga',
          description: 'Kelola Data Warga',
          icon: 'i-lucide-users',
          to: '/resident',
          active: false
        },
        {
          label: 'Nomor Rumah',
          description: 'Kelola Nomor Rumah',
          icon: 'i-lucide-home',
          to: '/resident/house-number',
          active: false
        },
        {
          label: 'Kategori Blok',
          description: 'Kelola Kategori Blok Perumahan',
          icon: 'i-lucide-grid',
          to: '/resident/block-category',
          active: false
        }
      ],
      active: false
    },
    {
      label: 'Keuangan',
      icon: 'i-lucide-database',
      children: [
        {
          label: 'Iuran',
          description: 'Kelola Iuran Bulanan',
          icon: 'i-lucide-tags',
          to: '/dues/history',
          active: false
        },
        {
          label: 'Periode Iuran',
          description: 'Kelola Periode Iuran Bulanan',
          icon: 'i-lucide-tags',
          to: '/dues/period',
          active: false
        },
        // {
        //   label: 'Pembayaran',
        //   description: 'Kelola Pembayaran Iuran warga',
        //   icon: 'i-lucide-file-text',
        //   to: '/pembayaran',
        //   active: false
        // },
        {
          label: 'Kas',
          description: 'Kelola Keluar masuk kas',
          icon: 'i-lucide-dollar-sign',
          to: '/cashflow',
          active: false
        },
      ],
      active: false
    }
  ],
  // [
  //   {
  //     label: 'Help',
  //     icon: 'i-lucide-circle-help',
  //     to: '/help',
  //     active: false
  //   }
  // ]
])

// 🔁 Update `active` status saat route berubah
watchEffect(() => {
  const currentPath = route.path

  for (const group of items.value) {
    for (const item of group) {
      // Reset active state dulu
      item.active = false

      // Cek apakah parent punya to
      if (item.to && item.to === currentPath) {
        item.active = true
      }

      // Cek child items
      if (item.children) {
        let anyChildActive = false

        for (const child of item.children) {
          child.active = child.to === currentPath

          if (child.active) {
            anyChildActive = true
          }
        }

        if (anyChildActive) {
          item.active = true
        }
      }
    }
  }
})
</script>

<template>
  <div class="flex justify-between items-center px-4 py-2 bg-black border-b border-default sticky top-0 z-50">
    <!-- Navigation Menu -->
    <UNavigationMenu highlight highlight-color="primary" orientation="horizontal" :items="items" color="primary"
      class="data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-48" />
    <UDropdownMenu :items="ddItems" :content="{
      align: 'start',
      side: 'bottom',
      sideOffset: 8
    }" :ui="{
      content: 'w-48'
    }">
      <UButton icon="i-lucide-user" color="neutral" variant="outline" class="" />
    </UDropdownMenu>
  </div>
</template>
