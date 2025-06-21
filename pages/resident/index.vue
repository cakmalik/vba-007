<template>
  <NuxtLayout>
    <!-- Debug output -->
    <!-- <pre class="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{{ data }}</pre> -->

    <!-- Tabel Dummy -->
    <UTable :data="data" />

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1" @click="prevPage" icon="i-heroicons-chevron-left"></UButton>
      <span>Halaman {{ page }}</span>
      <UButton :disabled="!hasNextPage" @click="nextPage" icon="i-heroicons-chevron-right"></UButton>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)

definePageMeta({
  title: 'Nomor Rumah'
})

const columns = [
  { key: 'nomor_rumah', label: 'Nama Rumah', id: 'nomor_rumah' },
  { key: 'id', label: 'ID', id: 'id' }
]

const data = ref([])

const fetchData = async () => {
  const from = (page.value - 1) * pageSize
  const to = from + pageSize - 1

  const { data: result, count, error } = await supabase
    .from('house_number')
    .select('nomor_rumah', { count: 'exact' })
    .range(from, to)

  if (!error) {
    data.value = result
    hasNextPage.value = result.length === pageSize
  } else {
    console.error('Fetch error:', error)
  }
}
const nextPage = () => {
  page.value++
}

const prevPage = () => {
  page.value--
}

fetchData()

watch(page, () => {
  fetchData()
})
</script>
