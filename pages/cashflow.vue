<template>
  <NuxtLayout>
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

// Gunakan useAsyncData agar data tetap sinkron saat SSR dan CSR
const { data: cashflowData, refresh, pending } = await useAsyncData(
  () => `cashflow-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .range(from.value, to.value)
      .order('created_at', { ascending: false })

    console.log('daata', data)
    if (error) throw error
    hasNextPage.value = data.length === pageSize
    return data
  }
)

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
    header: 'Type',
    // cell: ({ row }) => row.getValue('type') === 'in' ? 'Masuk' : 'Keluar',
    cell: ({ row }) => {
      const color = {
        in: 'success' as const,
        out: 'error' as const,
      }[row.getValue('type') as string]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.getValue('type'))
    }
  },

]

// Refresh saat ganti page
watch([page], async () => {
  await refresh()
})
</script>
