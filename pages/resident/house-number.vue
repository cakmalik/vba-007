<template>
  <NuxtLayout>
    <div class="space-y-6">
      <!-- Form Create -->
      <div class="p-4 border border-gray-200 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Tambah Nomor Rumah</h2>
        <form @submit.prevent="createHouseNumber" class="space-y-4">
          <UInput
            v-model="houseName"
            placeholder="Masukkan Nomor Rumah"
            required
          />
          <UButton type="submit" :loading="creating"> Simpan </UButton>
        </form>
      </div>

      <!-- Tabel -->
      <div class="relative">
        <UTable
          :data="houseData"
          :columns="columns"
          :loading="pending"
          loading-color="primary"
          loading-animation="carousel"
        />
      </div>

      <!-- Pagination -->
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
      <UModal v-model:open="showModal" title="Pilih Periode Tagihan">
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">
              Pilih Periode untuk {{ selectedHouse?.name }}
            </div>
          </template>

          <div class="space-y-4">
            <USelectMenu
              v-model="selectedPeriodId"
              :items="availablePeriods"
              label="Periode"
              placeholder="Pilih Periode"
              class="w-full sm:w-1/2 md:w-1/4"
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-2 mt-4">
              <UButton variant="ghost" @click="showModal = false"
                >Batal</UButton
              >
              <UButton
                color="primary"
                :loading="generating"
                :disabled="!selectedPeriodId"
                @click="generateTagihan"
              >
                Generate
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Daftar Nomor Rumah",
  subtitle: "Kelola Daftar Nomor Rumah",
});
const supabase = useSupabaseClient();

const selectedPeriodId = ref("");
const page = ref(1);
const pageSize = 10;
const hasNextPage = ref(true);
const creating = ref(false);

const from = computed(() => (page.value - 1) * pageSize);
const to = computed(() => from.value + pageSize - 1);

// Form state
const form = reactive({
  name: "",
});

const {
  data: houseData,
  refresh,
  pending,
} = await useAsyncData(
  () => `house-numbers-page-${page.value}`,
  async () => {
    const { data, error } = await supabase
      .from("house_number")
      .select(`name, profiles(full_name)`, { count: "exact" })
      .range(from.value, to.value);

    if (error) throw error;

    hasNextPage.value = data.length === pageSize;
    return data;
  },
);

// Kolom tabel
type HouseNumber = {
  name: string;
  profiles?: {
    full_name: string;
  };
};

const columns: TableColumn<HouseNumber>[] = [
  {
    accessorKey: "name",
    header: "Nomor Rumah",
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "profiles",
    header: "Nama Warga",
    cell: ({ row }) => {
      const profiles = row.original.profiles;
      return profiles?.full_name ?? "";
    },
  },
  {
    header: "Aksi",
    cell: ({ row }) => {
      const house = row.original;
      return h(
        "button",
        {
          class: "text-sm text-primary hover:underline",
          onClick: () => openGenerateModal(house),
        },
        "Generate Tagihan",
      );
    },
  },
];

// Pagination
const nextPage = () => page.value++;
const prevPage = () => page.value--;

// Refresh saat page berubah
watch(page, async () => {
  await refresh();
});

const toast = useToast();
const createHouseNumber = async () => {
  if (!form.name) return;

  creating.value = true;
  const { error } = await supabase.from("house_number").insert({
    name: form.name,
  });
  creating.value = false;

  if (!error) {
    form.name = "";
    toast.add({
      title: "Berhasil",
      description: "Nomor rumah berhasil ditambahkan.",
      color: "success",
    });
    await refresh();
  } else {
    toast.add({
      title: "Gagal",
      description: error.message,
      color: "danger",
    });
  }
};

const houseName = computed({
  get: () => form.name,
  set: (val: string) => {
    form.name = val.toUpperCase();
  },
});

const { data: availablePeriods } = await useAsyncData(
  "available-periods",
  async () => {
    const { data, error } = await supabase
      .from("billing_period")
      .select("id,month,year");
    if (error) throw error;
    return data;
  },
);

const showModal = ref(false);
const generating = ref(false);
const selectedHouse = ref<HouseNumber | null>(null);

const openGenerateModal = (house: HouseNumber) => {
  selectedHouse.value = house;
  showModal.value = true;
};

const generateTagihan = async () => {
  if (!selectedHouse.value) return;

  generating.value = true;

  try {
    await $fetch("/api/generate-tagihan", {
      method: "POST",
      body: {
        billing_period_id: 1, // Ganti sesuai kebutuhan
        house_number_id: selectedHouse.value.id, // Kirim ID rumah
      },
    });

    toast.add({
      title: "Sukses",
      description: `Tagihan berhasil dibuat untuk rumah ${selectedHouse.value.name}.`,
      color: "success",
    });
    await refresh();
  } catch (error: any) {
    toast.add({
      title: "Gagal",
      description:
        error?.data?.message || error.message || "Terjadi kesalahan.",
      color: "danger",
    });
  } finally {
    generating.value = false;
    showModal.value = false;
    selectedHouse.value = null;
  }
};
</script>
