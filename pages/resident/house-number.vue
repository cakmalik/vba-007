<template>
  <NuxtLayout>
    <div class="relative">
      <UTable :data="houseData" :columns="columns" :loading="pending" loading-color="primary"
        loading-animation="carousel" />
    </div>

    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1 || pending" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Hal {{ page }}</span>
      <UButton :disabled="!hasNextPage || pending" @click="nextPage" icon="i-heroicons-chevron-right" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Daftar Nomor Rumah',
  subtitle: 'Kelola Daftar Nomor Rumah'
})
const supabase = useSupabaseClient()

const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)

const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

// Gunakan useAsyncData agar data tetap sinkron saat SSR dan CSR
const { data: houseData, refresh, pending } = await useAsyncData(
  () => `house-numbers-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from('house_number')
      .select(`name, profiles(full_name)`, { count: 'exact' })
      .range(from.value, to.value)

    if (error) throw error

    hasNextPage.value = data.length === pageSize
    return data
  }
)

// Kolom untuk UTable
type HouseNumber = {
  name: string
}

const columns: TableColumn<HouseNumber>[] = [
  {
    accessorKey: 'name',
    header: 'Nomor Rumah',
    cell: ({ row }) => row.getValue('name'),
  },
  {
    accessorKey: 'profiles',
    header: 'Nama Warga',
    cell: ({ row }) => {
      const profiles = row.original.profiles
      return profiles?.full_name ?? ''
    }
  },
]

// Pagination
const nextPage = () => page.value++
const prevPage = () => page.value--

// Refresh saat ganti page
watch(page, async () => {
  await refresh()
})
</script>
