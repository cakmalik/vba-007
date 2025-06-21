<template>
  <NuxtLayout>
    <div class="relative">
      <UTable :data="houseData" :columns="columns" />
      <div v-if="pending" class="absolute inset-0 bg-dark/70 backdrop-blur-sm flex items-center justify-center z-10">
        <span class="text-white text-sm">Memuat data...</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1 || pending" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Halaman {{ page }}</span>
      <UButton :disabled="!hasNextPage || pending" @click="nextPage" icon="i-heroicons-chevron-right" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Data Warga',
  subtitle: 'Kelola Data Warga'
})
const supabase = useSupabaseClient()

const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)

const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

// Gunakan useAsyncData agar data tetap sinkron saat SSR dan CSR
const { data: houseData, refresh, pending } = await useAsyncData(
  () => `resident-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name', { count: 'exact' })
      .range(from.value, to.value)

    if (error) throw error

    hasNextPage.value = data.length === pageSize
    return data
  }
)

// Kolom untuk UTable
type Resident = {
  full_name: string
}

const columns: TableColumn<HouseNumber>[] = [
  {
    accessorKey: 'full_name',
    header: 'Nama Lengkap',
    cell: ({ row }) => row.getValue('full_name'),
  }
]

// Pagination
const nextPage = () => page.value++
const prevPage = () => page.value--

// Refresh saat ganti page
watch(page, async () => {
  await refresh()
})
</script>
