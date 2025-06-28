<template>
  <NuxtLayout name="public">
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

      <!-- Keuangan (dummy) -->
      <UCard variant="soft">
        <template #header>
          <h2 class="text-lg font-medium">Keuangan</h2>
        </template>
        <ul class="space-y-2">
          <li class="flex justify-between">
            <span>Pemasukan</span>
            <span class="font-semibold text-green-600 dark:text-green-400">
              Rp {{ formatCurrency(keuangan.pemasukan) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>Pengeluaran</span>
            <span class="font-semibold text-red-600 dark:text-red-400">
              Rp {{ formatCurrency(keuangan.pengeluaran) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>Lunas Iuran Bulan Ini</span>
            <span class="font-semibold">{{ keuangan.lunas }} warga</span>
          </li>
        </ul>
      </UCard>
    </div>
  </NuxtLayout>
</template>
<script setup lang="ts">
definePageMeta({
  title: "Dashboard",
});

const supabase = useSupabaseClient();

// 🔹 Fetch Data Warga dari Supabase
const { data: wargaData } = await useAsyncData("warga", async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "resident");

  if (error) throw error;
  return data;
});

// 🔹 Komputasi Data
const totalWarga = computed(() => wargaData.value?.length ?? 0);
const jumlahTinggal = computed(
  () => wargaData.value?.filter((w) => w.is_living === true).length ?? 0,
);
const jumlahVBA = computed(
  () => wargaData.value?.filter((w) => w.is_ktp_vba === true).length ?? 0,
);

// 🔹 Data Keuangan Dummy
const keuangan = reactive({
  pemasukan: 0,
  pengeluaran: 0,
  lunas: 0,
  bulan_tahun: "",
});

// 🔹 Format Rupiah
function formatCurrency(value: number): string {
  return value.toLocaleString("id-ID");
}

const { data, error } = await useAsyncData("keuanganLunas", async () => {
  // Step 1: Ambil billing_period terbaru
  const { data: latestPeriod, error: periodError } = await supabase
    .from("billing_periods")
    .select("id, month, year")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .single();

  if (periodError || !latestPeriod)
    throw periodError || new Error("Tidak ada data periode");

  const { id: billing_period_id, month, year } = latestPeriod;

  // Step 2: Hitung jumlah profile_dues yang sudah lunas untuk periode tersebut
  const { data: duesData, error: duesError } = await supabase
    .from("profile_dues")
    .select("id")
    .eq("billing_period_id", billing_period_id)
    .eq("status", "paid");

  if (duesError) throw duesError;

  // Step 3: Format bulan dan simpan ke state
  const bulanNama = new Date(year, month - 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  keuangan.lunas = duesData?.length || 0;
  keuangan.bulan_tahun = bulanNama;

  return { lunas: keuangan.lunas, bulan_tahun: bulanNama };
});
</script>
