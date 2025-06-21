<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

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
          label: 'Pembayaran',
          description: 'Kelola Pembayaran Iuran warga',
          icon: 'i-lucide-file-text',
          to: '/pembayaran',
          active: false
        },
        {
          label: 'Kas',
          description: 'Kelola Keluar masuk kas',
          icon: 'i-lucide-dollar-sign',
          to: '/kas',
          active: false
        },
        {
          label: 'Kategori Pembayaran',
          description: 'Kelola Kategori Pembayaran',
          icon: 'i-lucide-tags',
          to: '/kategori-pembayaran',
          active: false
        }
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
  <UNavigationMenu highlight highlight-color="primary" orientation="horizontal" :items="items" color="primary"
    class="z-50 data-[orientation=horizontal]:border-b border-default data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-48 sticky top-0 bg-black" />
</template>
