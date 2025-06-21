<template>
  <NuxtLayout>
    <div class="relative">
      <div class="flex px-4 py-3.5 border-b border-accented">
        <UInput v-model="globalFilter" class="max-w-sm" placeholder="Filter..." />
      </div>
      <UTable v-model:global-filter="globalFilter" :data="residentData" :columns="columns" :loading="pending"
        loading-color="primary" loading-animation="carousel" />
    </div>

    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1 || pending" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Hal {{ page }}</span>
      <UButton :disabled="!hasNextPage || pending" @click="nextPage" icon="i-heroicons-chevron-right" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const UAvatar = resolveComponent('UAvatar')

definePageMeta({
  title: 'Data Warga',
  subtitle: 'Kelola Data Warga RT007'
})
const supabase = useSupabaseClient()

const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)
const globalFilter = ref('')

const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

// Gunakan useAsyncData agar data tetap sinkron saat SSR dan CSR
const { data: residentData, refresh, pending } = await useAsyncData(
  () => `resident-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*,house_number(name)`, { count: 'exact' })
      .eq('role', 'resident')
      // .ilike('full_name', `%${globalFilter.value}%`)
      .or(`full_name.ilike.%${globalFilter.value}%,phone_number.ilike.%${globalFilter.value}%`)
      .range(from.value, to.value)

    console.log('daata', data)
    if (error) throw error
    hasNextPage.value = data.length === pageSize
    return data
  }
)

// Kolom untuk UTable
type Resident = {
  full_name: string,
  nickname: string,
  phone_number: string,
  image_url?: string
}
const getProxyImageUrl = (url?: string) => {
  if (!url) return ''
  const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/)
  const fileId = match?.[1]
  return fileId ? `/api/image/${fileId}` : ''
}

const columns: TableColumn<Resident>[] = [
  {
    accessorKey: 'full_name',
    header: 'Nama Warga',
    cell: ({ row }) => {

      const avatarSrc =
        getProxyImageUrl(row.original.image_url) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(row.original.full_name)}`

      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'w-8 h-8 rounded-full overflow-hidden' }, [
          h('img', {
            src: avatarSrc,
            alt: row.original.full_name,
            class: 'w-full h-full object-cover'
          })
        ]),
        h('div', undefined, [
          h('div', { class: 'uppercase' }, row.original.full_name),
          h('div', { class: 'text-sm text-muted capitalize' }, row.original.nickname),
        ]),
      ])
    }
  },
  // {
  //   accessorKey: 'nickname',
  //   header: 'Nama Panggilan',
  //   cell: ({ row }) => row.getValue('nickname'),
  // },
  {
    accessorKey: 'phone_number',
    header: 'Nomor Telepon',
    cell: ({ row }) => row.getValue('phone_number'),
  },
  {
    accessorKey: 'house_number',
    header: 'Nomor Rumah',
    cell: ({ row }) => {
      const houses = row.original.house_number
      return houses.map((house: any) => house.name).join(', ')
    }
  },
]

// Pagination
const nextPage = () => page.value++
const prevPage = () => page.value--

// Refresh saat ganti page
watch([page, globalFilter], async () => {
  await refresh()
})
</script>
