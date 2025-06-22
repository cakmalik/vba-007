<template>
  <NuxtLayout>
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Kas Masuk -->
      <div class="flex-1 min-w-[250px] bg-green-100 text-green-800 rounded-xl shadow p-4">
        <h3 class="text-lg font-semibold mb-2">Kas Masuk</h3>
        <p class="text-2xl font-bold">{{ formatCurrency(kasMasuk) }}</p>
      </div>

      <!-- Kas Keluar -->
      <div class="flex-1 min-w-[250px] bg-red-100 text-red-800 rounded-xl shadow p-4">
        <h3 class="text-lg font-semibold mb-2">Kas Keluar</h3>
        <p class="text-2xl font-bold">{{ formatCurrency(kasKeluar) }}</p>
      </div>
    </div>

    <UTable :data="cashflowData" :columns="columns" :loading="pending" loading-color="primary" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')

definePageMeta({
  middleware: ['auth', 'treasurer'],
  title: 'Kas',
  subtitle: 'Kelola keluar masuk kas'
})

const supabase = useSupabaseClient()

const page = ref(1)
const pageSize = 10
const hasNextPage = ref(true)

const from = computed(() => (page.value - 1) * pageSize)
const to = computed(() => from.value + pageSize - 1)

const nextPage = () => page.value++
const prevPage = () => page.value--

// Ambil data cashflow
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

// Ambil data summary total kas masuk dan keluar
const { data: summary, pending: loadingSummary } = await useAsyncData(
  'cashflow-summary',
  async () => {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('type, sum(amount)', { count: 'exact' })
      .group('type')

    if (error) throw error
    return data
  }
)

const kasMasuk = computed(() => summary.value?.find(i => i.type === 'in')?.sum ?? 0)
const kasKeluar = computed(() => summary.value?.find(i => i.type === 'out')?.sum ?? 0)

type Cashflow = {
  date: string
  description: string
  amount: number
  type: string
}

// Kolom tabel
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

// Refresh saat ganti halaman
watch([page], async () => {
  await refresh()
})
</script>
