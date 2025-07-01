<template>
  <NuxtLayout :name="isTreasurer ? 'default' : 'public'">
    <div class="p-6 space-y-6 text-gray-900 dark:text-white">
      <!-- Data Warga -->
      <UCard variant="soft">
        <template #header>
          <h2 class="text-lg font-medium">Data Warga</h2>
        </template>
        <ul class="space-y-2">
          <li class="flex justify-between">
            <span>Jumlah Rumah / KK</span>
            <span class="font-semibold">{{ totalWarga }}</span>
          </li>
          <li class="flex justify-between">
            <span>Sudah Dihuni</span>
            <span class="font-semibold">{{ jumlahTinggal }}</span>
          </li>
          <li class="flex justify-between">
            <span>Sudah Alamat VBA</span>
            <span class="font-semibold">{{ jumlahVBA }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Keuangan -->
      <UCard variant="soft">
        <template #header>
          <h2 class="text-lg font-medium">Keuangan</h2>
        </template>
        <ul class="space-y-2">
          <li class="flex justify-between">
            <span>Pemasukan</span>
            <span class="font-semibold text-yellow-600 dark:text-yellow-400">
              Rp {{ formatCurrency(uangMasuk) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>Pengeluaran</span>
            <span class="font-semibold text-red-600 dark:text-red-400">
              Rp {{ formatCurrency(uangKeluar) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>Saldo</span>
            <span class="font-semibold text-green-600 dark:text-green-400">
              Rp {{ formatCurrency(uangMasuk - uangKeluar) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>Lunas Iuran {{ keuangan.bulan_tahun }}</span>
            <span class="font-semibold">{{ keuangan.lunas }} warga</span>
          </li>
        </ul>
      </UCard>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { getRoleName } from "@/composables/useRole";
definePageMeta({
  title: "Dashboard",
});

const roleName = ref<string | null>(null);
onMounted(async () => {
  roleName.value = await getRoleName();
});

const isTreasurer = computed(() => roleName.value === "treasurer");

const supabase = useSupabaseClient();

// 🔹 Fetch Data Warga
const { data: wargaData } = await useAsyncData("warga", async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "resident");

  if (error) throw error;
  return data;
});

// 🔹 Komputasi Jumlah
const totalWarga = computed(() => wargaData.value?.length ?? 0);
const jumlahTinggal = computed(
  () => wargaData.value?.filter((w) => w.is_living).length ?? 0,
);
const jumlahVBA = computed(
  () => wargaData.value?.filter((w) => w.is_ktp_vba).length ?? 0,
);

// 🔹 Reactive Keuangan
const keuangan = reactive({
  // pemasukan: 0,
  // pengeluaran: 0,
  lunas: 0,
  bulan_tahun: "",
});

// 🔹 Format Rupiah
function formatCurrency(value: number): string {
  return value.toLocaleString("id-ID");
}

const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD

const { data: keuanganData } = await useAsyncData("keuanganLunas", async () => {
  const { data: currentPeriod, error: periodError } = await supabase
    .from("billing_periods")
    .select("id, month, year, start_date, end_date")
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  if (periodError || !currentPeriod)
    throw periodError || new Error("Tidak ada periode tagihan untuk hari ini");

  const { id: billing_period_id, month, year } = currentPeriod;

  const { data: duesData, error: duesError } = await supabase
    .from("profile_dues")
    .select("id")
    .eq("billing_period_id", billing_period_id)
    .eq("status", "paid");

  if (duesError) throw duesError;

  const bulanNama = new Date(year, month - 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return {
    lunas: duesData?.length || 0,
    bulan_tahun: bulanNama,
  };
});

const { data: uangKeluar, error: errorKeluar } = await useAsyncData(
  "uang-keluar",
  async () => {
    const { data, error } = await supabase
      .from("cash_flows")
      .select("amount", { head: false })
      .eq("type", "out");

    if (error) throw error;

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);
    return total;
  },
);

const { data: uangMasuk, error: errorMasuk } = await useAsyncData(
  "uang-masuk",
  async () => {
    const { data, error } = await supabase
      .from("cash_flows")
      .select("amount", { head: false })
      .eq("type", "in");

    if (error) throw error;

    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);
    return total;
  },
);

watchEffect(() => {
  if (keuanganData.value) {
    keuangan.lunas = keuanganData.value.lunas;
    keuangan.bulan_tahun = keuanganData.value.bulan_tahun;
  }
});
</script>
