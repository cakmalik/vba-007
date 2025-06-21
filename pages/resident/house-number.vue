<template>
  <NuxtLayout>
    <UTable :data="houseData" :columns="columns" />
    <div v-if="pending" class="absolute inset-0 bg-dark/70 backdrop-blur-sm flex items-center justify-center z-10">
      <span class="text-white text-sm">Memuat data...</span>
    </div>
    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Halaman {{ page }}</span>
      <UButton :disabled="!hasNextPage" @click="nextPage" icon="i-heroicons-chevron-right" />
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
      .select('nomor_rumah', { count: 'exact' })
      .range(from.value, to.value)

    if (error) throw error

    hasNextPage.value = data.length === pageSize
    return data
  }
)

// Kolom untuk UTable
type HouseNumber = {
  nomor_rumah: string
}

const columns: TableColumn<HouseNumber>[] = [
  {
    accessorKey: 'nomor_rumah',
    header: 'Nomor Rumah',
    cell: ({ row }) => row.getValue('nomor_rumah'),
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
