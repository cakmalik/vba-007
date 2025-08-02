<template>
  <NuxtLayout>
    <!-- <div class="flex justify-between items-center mb-4"> -->
    <!--   <h1 class="text-2xl font-bold">Periode Penagihan</h1> -->
    <!--   <UButton @click="openForm" icon="i-lucide-plus" size="lg" color="primary"> -->
    <!--     Tambah -->
    <!--   </UButton> -->
    <!-- </div> -->
    <UButton
      @click="create"
      icon="i-lucide-plus"
      size="2xl"
      color="info"
      variant="solid"
      class="fixed bottom-6 right-6 rounded-full px-3 py-3"
    />

    <UTable
      :data="billingData"
      :columns="columns"
      :loading="pending"
      loading-color="primary"
    />

    <div class="flex justify-between mt-4 items-center">
      <UButton
        :disabled="page <= 1 || pending"
        @click="prevPage"
        icon="i-heroicons-chevron-left"
      />
      <span>Halaman {{ page }}</span>
      <UButton
        :disabled="!hasNextPage || pending"
        @click="nextPage"
        icon="i-heroicons-chevron-right"
      />
    </div>

    <!-- Form Drawer -->
    <UDrawer v-model:open="showForm">
      <template #title>
        {{ isEdit ? "Edit" : "Tambah" }} Periode Penagihan
      </template>

      <template #content>
        <div class="p-6 flex justify-center">
          <UForm
            :state="form"
            @submit="submitForm"
            class="flex flex-wrap gap-4 items-end"
          >
            <UInput
              v-model="form.month"
              type="number"
              label="Bulan"
              min="1"
              max="12"
              required
            />
            <UInput
              v-model="form.year"
              type="number"
              label="Tahun"
              min="2000"
              required
            />
            <UInput
              v-model="form.start_date"
              type="date"
              label="Tanggal Mulai"
              required
            />
            <UInput
              v-model="form.end_date"
              type="date"
              label="Tanggal Selesai"
              required
            />

            <div class="pt-4">
              <UButton type="submit" color="primary" block> Simpan </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { h } from "vue";
import { useDateFormat } from "@vueuse/core";
import type { TableColumn, Row } from "@nuxt/ui";

import {
  UButton,
  UDrawer,
  UForm,
  UInput,
  USelectMenu,
  UTable,
} from "#components";

definePageMeta({
  middleware: ["auth", "treasurer"],
  title: "Periode Tagihan",
  subtitle: "Kelola periode ",
});

const supabase = useSupabaseClient();

const page = ref(1);
const pageSize = 10;
const hasNextPage = ref(true);

const from = computed(() => (page.value - 1) * pageSize);
const to = computed(() => from.value + pageSize - 1);

const {
  data: billingData,
  refresh,
  pending,
} = await useAsyncData(
  () => `billing-periods-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from("billing_periods")
      .select("*")
      .range(from.value, to.value)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;
    hasNextPage.value = data.length === pageSize;
    return data;
  },
);

watch(page, async () => {
  await refresh();
});

const nextPage = () => page.value++;
const prevPage = () => page.value--;

type BillingPeriod = {
  id?: number;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
};

const columns: TableColumn<BillingPeriod>[] = [
  {
    accessorKey: "month",
    header: "Bulan",
    cell: ({ row }) => row.getValue("month"),
  },
  {
    accessorKey: "year",
    header: "Tahun",
    cell: ({ row }) => row.getValue("year"),
  },
  {
    accessorKey: "start_date",
    header: "Tanggal Mulai",
    cell: ({ row }) =>
      useDateFormat(row.getValue("start_date"), "DD/MM/YYYY").value,
  },
  {
    accessorKey: "end_date",
    header: "Tanggal Selesai",
    cell: ({ row }) =>
      useDateFormat(row.getValue("end_date"), "DD/MM/YYYY").value,
  },

  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right flex gap-2 justify-end" }, // Tambahkan gap & flex jika butuh spacing antar tombol
        [
          h(
            UButton,
            {
              icon: "i-lucide-edit",
              color: "primary",
              variant: "ghost",
              onClick: () => editData(row.original.id),
            },
            () => "Edit",
          ),
          h(
            UButton,
            {
              icon: "i-lucide-file-text",
              color: "primary",
              variant: "ghost",
              onClick: () => {
                console.log("row.original:", row.original);
                generateTagihan(row.original.id);
              },
            },
            () => "Generate Tagihan Massal",
          ),
        ],
      );
    },
  },
];

function editData(id: number) {
  const item = billingData.value?.find((i) => i.id === id);
  if (!item) return;

  form.value = {
    id: item.id,
    month: item.month,
    year: item.year,
    start_date: item.start_date,
    end_date: item.end_date,
  };

  showForm.value = true;
}

const showForm = ref(false);
const create = () => {
  resetForm();
  showForm.value = true;
};

const openForm = create;

const resetForm = () => {
  form.value = {
    id: undefined,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  };
};

const isEdit = computed(() => !!form.value.id);

const form = ref<BillingPeriod>({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  start_date: "",
  end_date: "",
});

const submitForm = async () => {
  const { id, ...payload } = form.value;
  let error;

  if (!isEdit.value) {
    const res = await supabase
      .from("billing_periods")
      .insert(payload)
      .select()
      .single();
    error = res.error;
  } else {
    const res = await supabase
      .from("billing_periods")
      .update(payload)
      .eq("id", id!)
      .select()
      .single();
    error = res.error;
  }

  if (error) {
    console.error("Error simpan:", error);
    return;
  }

  await refresh();
  showForm.value = false;
};

const generateTagihan = async (billing_period_id: number) => {
  try {
    const res = await $fetch("/api/generate-tagihan", {
      method: "POST",
      body: {
        billing_period_id,
      },
    });

    // tampilkan notifikasi atau reload data
    console.log(res.message);
    alert(res.message);
  } catch (error) {
    console.error("Gagal generate tagihan", error);
  }
};
</script>
