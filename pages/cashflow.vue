<template>
  <NuxtLayout>
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Kas Masuk -->
      <div class="flex-1 min-w-[250px] bg-green-100 text-green-800 rounded-xl shadow p-4">
        <h3 class="text-lg font-semibold mb-2">Kas Masuk</h3>
        <p class="text-2xl font-bold">
          {{ formatCurrency(kasMasuk) }}
        </p>
      </div>

      <!-- Kas Keluar -->
      <div class="flex-1 min-w-[250px] bg-red-100 text-red-800 rounded-xl shadow p-4">
        <h3 class="text-lg font-semibold mb-2">Kas Keluar</h3>
        <p class="text-2xl font-bold">
          {{ formatCurrency(kasKeluar) }}
        </p>
      </div>
    </div>

    <!-- Tabel Kas -->
    <UTable :data="cashflowData" :columns="columns" :loading="pending" loading-color="primary" />

    <div class="flex items-center justify-between mt-4">
      <UButton :disabled="page <= 1 || pending" @click="prevPage" icon="i-heroicons-chevron-left" />
      <span>Hal {{ page }}</span>
      <UButton :disabled="!hasNextPage || pending" @click="nextPage" icon="i-heroicons-chevron-right" />
    </div>

    <UButton icon="i-lucide-plus" size="2xl" color="info" variant="solid" class="fixed bottom-6 right-6 rounded-full" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { h, resolveComponent, watchEffect } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// Komponen untuk badge
const UBadge = resolveComponent('UBadge')

// Metadata halaman
definePageMeta({
  middleware: ['auth', 'treasurer'],
  title: 'Kas',
  subtitle: 'Kelola keluar masuk kas'
})

// Supabase client
const supabase = useSupabaseClient()

// Pagination
const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)

const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

// Pagination handler
const nextPage = () => page.value++
const prevPage = () => page.value--

// Ambil data kas (paginated)
const { data: cashflowData, refresh, pending } = await useAsyncData(
  () => `cashflow-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .range(from.value, to.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    hasNextPage.value = data.length === pageSize
    return data
  }
)

const { data: summary, pending: loadingSummary } = await useAsyncData(
  'cashflow-summary',
  async () => {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('type, amount')

    if (error) throw error

    // Hitung total kas masuk dan keluar
    const result = { in: 0, out: 0 }
    for (const item of data) {
      if (item.type === 'in') result.in += item.amount
      else if (item.type === 'out') result.out += item.amount
    }

    // Kembalikan array summary mirip hasil query agregat
    return [
      { type: 'in', total: result.in },
      { type: 'out', total: result.out }
    ]
  },
  {
    server: false, // Supabase hanya jalan di client
    lazy: true     // Eksekusi setelah halaman siap
  }
)
// Debug summary jika berubah
// watchEffect(() => {
//   console.log('Cashflow summary updated:', summary.value)
// })

// Hitung total kas masuk dan keluar
const kasMasuk = computed(() => summary.value?.find(i => i.type === 'in')?.total ?? 0)
const kasKeluar = computed(() => summary.value?.find(i => i.type === 'out')?.total ?? 0)

// Definisi tipe dan kolom tabel
type Cashflow = {
  date: string
  description: string
  amount: number
  type: string
}

const columns: TableColumn<Cashflow>[] = [
  {
    accessorKey: 'date',
    header: 'Tanggal',
    cell: ({ row }) => formatDate(new Date(row.original.date), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'description',
    header: 'Keterangan',
    cell: ({ row }) => row.getValue('description'),
  },
  {
    accessorKey: 'amount',
    header: 'Jumlah',
    cell: ({ row }) => formatCurrency(row.getValue('amount')),
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const color = {
        in: 'success' as const,
        out: 'error' as const,
      }[row.getValue('type') as string]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.getValue('type'))
    }
  }
]

// Refresh data saat halaman berubah
watch(page, async () => {
  await refresh()
})
</script>
