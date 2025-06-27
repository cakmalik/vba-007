<template>
  <div class="">
    <NuxtLayout :name="isTreasurer ? 'default' : 'public'">
      <div class="flex gap-2 sm:gap-4 mb-4">
        <!-- Kas Masuk -->
        <div
          class="flex-1 min-w-[150px] bg-green-100 text-green-800 rounded-lg shadow p-3 sm:p-4"
        >
          <h3 class="text-sm sm:text-base font-semibold mb-1 sm:mb-2">
            Kas Masuk
          </h3>
          <p class="text-lg sm:text-2xl font-bold">
            {{ formatCurrency(kasMasuk) }}
          </p>
        </div>

        <!-- Kas Keluar -->
        <div
          class="flex-1 min-w-[150px] bg-red-100 text-red-800 rounded-lg shadow p-3 sm:p-4"
        >
          <h3 class="text-sm sm:text-base font-semibold mb-1 sm:mb-2">
            Kas Keluar
          </h3>
          <p class="text-lg sm:text-2xl font-bold">
            {{ formatCurrency(kasKeluar) }}
          </p>
        </div>
      </div>
      <!-- Tabel Kas -->
      <UTable
        :data="cashflowData"
        :columns="columns"
        :loading="pending"
        loading-color="primary"
      />

      <div class="flex items-center justify-between mt-4">
        <UButton
          :disabled="page <= 1 || pending"
          @click="prevPage"
          icon="i-heroicons-chevron-left"
        />
        <span>Hal {{ page }}</span>
        <UButton
          :disabled="!hasNextPage || pending"
          @click="nextPage"
          icon="i-heroicons-chevron-right"
        />
      </div>

      <UButton
        v-if="isTreasurer"
        @click="create"
        icon="i-lucide-plus"
        size="2xl"
        color="info"
        variant="solid"
        class="fixed bottom-6 right-6 rounded-full px-3 py-3"
      />

      <UDrawer v-model:open="showForm">
        <template #title> Tambah Data Kas </template>

        <template #content>
          <div class="p-6 flex justify-center">
            <UForm
              :state="form"
              @submit="submitForm"
              class="flex flex-wrap gap-4 items-end"
            >
              <!-- Tipe -->
              <USelect
                v-model="form.type"
                :items="[
                  { label: 'Masuk', value: 'in' },
                  { label: 'Keluar', value: 'out' },
                ]"
                placeholder="Pilih tipe kas"
                label="Tipe"
              />

              <!-- Tanggal -->
              <UInput v-model="form.date" type="date" label="Tanggal" />

              <!-- Keterangan -->
              <UInput
                v-model="form.description"
                label="Keterangan"
                placeholder="Tulis keterangan"
              />

              <!-- Jumlah -->
              <UInput
                v-model="form.amount"
                type="number"
                label="Jumlah"
                placeholder="0"
              />

              <!-- Submit -->
              <div class="pt-4">
                <UButton type="submit" color="primary" block> Simpan </UButton>
              </div>
            </UForm>
          </div>
        </template>
      </UDrawer>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, watchEffect } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useDateFormat } from "@vueuse/core";

import { getRoleName } from "@/composables/useRole";

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

// Metadata halaman
definePageMeta({
  title: "Kas",
  subtitle: "Kelola keluar masuk kas",
});

// Supabase client
const supabase = useSupabaseClient();

// Pagination
const page = ref(1);
const pageSize = 10;
const hasNextPage = ref(true);

const from = computed(() => (page.value - 1) * pageSize);
const to = computed(() => from.value + pageSize - 1);

// Pagination handler
const nextPage = () => page.value++;
const prevPage = () => page.value--;

// Ambil data kas (paginated)
const {
  data: cashflowData,
  refresh,
  pending,
} = await useAsyncData(
  () => `cashflow-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from("cash_flows")
      .select("*")
      .range(from.value, to.value)
      .order("created_at", { ascending: false });

    if (error) throw error;
    hasNextPage.value = data.length === pageSize;
    return data;
  },
);

const { data: summary, pending: loadingSummary } = await useAsyncData(
  "cashflow-summary",
  async () => {
    const { data, error } = await supabase
      .from("cash_flows")
      .select("type, amount");

    if (error) throw error;

    // Hitung total kas masuk dan keluar
    const result = { in: 0, out: 0 };
    for (const item of data) {
      if (item.type === "in") result.in += item.amount;
      else if (item.type === "out") result.out += item.amount;
    }

    // Kembalikan array summary mirip hasil query agregat
    return [
      { type: "in", total: result.in },
      { type: "out", total: result.out },
    ];
  },
  {
    server: false, // Supabase hanya jalan di client
    lazy: true, // Eksekusi setelah halaman siap
  },
);
// Debug summary jika berubah
// watchEffect(() => {
//   console.log('Cashflow summary updated:', summary.value)
// })

// Hitung total kas masuk dan keluar
const kasMasuk = computed(
  () => summary.value?.find((i) => i.type === "in")?.total ?? 0,
);
const kasKeluar = computed(
  () => summary.value?.find((i) => i.type === "out")?.total ?? 0,
);

// Definisi tipe dan kolom tabel
type Cashflow = {
  date: string;
  description: string;
  amount: number;
  type: string;
};

const columns: TableColumn<Cashflow>[] = [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => formatDate(new Date(row.original.date), "dd/MM/yyyy"),
  },
  {
    accessorKey: "description",
    header: "Keterangan",
    cell: ({ row }) => row.getValue("description"),
  },
  {
    accessorKey: "amount",
    header: "Jumlah",
    cell: ({ row }) => formatCurrency(row.getValue("amount")),
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const color = {
        in: "success" as const,
        out: "error" as const,
      }[row.getValue("type") as string];

      return h(UBadge, { class: "capitalize", variant: "subtle", color }, () =>
        row.getValue("type"),
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const isTreasurer = getRoleName() === "Treasurer";

      if (!isTreasurer) return null;

      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      );
    },
  },
];

function getRowItems(row: Row<Payment>) {
  return [
    {
      label: "Edit",
      onSelect() {
        editData(row.original.id);
      },
    },
  ];
}

const isEdit = computed(() => !!form.value.id);

const editData = (id: string) => {
  const item = cashflowData.value?.find((i) => i.id === id);
  if (!item) return;

  form.value = {
    id: item.id,
    type: item.type,
    date: item.date,
    description: item.description,
    amount: item.amount,
  };

  showForm.value = true;
};

// Refresh data saat halaman berubah
watch(page, async () => {
  await refresh();
});

const showForm = ref(false);
const create = () => {
  resetForm();
  showForm.value = true;
};

const resetForm = () => {
  form.value = {
    id: null,
    type: "in",
    date: today.value,
    description: "",
    amount: null,
  };
};

const today = useDateFormat(new Date(), "YYYY-MM-DD");

const form = ref({
  id: null,
  type: "in",
  date: today.value,
  description: "",
  amount: null,
});

const submitForm = async () => {
  let error;

  if (!isEdit.value) {
    ({ error } = await supabase.from("cash_flows").insert(form.value));
  } else {
    ({ error } = await supabase
      .from("cash_flows")
      .update({
        type: form.value.type,
        date: form.value.date,
        description: form.value.description,
        amount: form.value.amount,
      })
      .eq("id", form.value.id));
  }

  if (error) {
    console.error(error);
    return;
  }

  await refresh();
  showForm.value = false;
};

const roleName = ref<string | null>(null);
const isTreasurer = computed(() => roleName.value === "treasurer");
onMounted(async () => {
  await nextTick();
  roleName.value = await getRoleName();
});
</script>
