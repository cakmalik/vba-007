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
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Daftar Nomor Rumah",
  subtitle: "Kelola Daftar Nomor Rumah",
});
const supabase = useSupabaseClient();

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
</script>
