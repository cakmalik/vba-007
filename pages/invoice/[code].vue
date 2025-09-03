<template>
  <div v-if="form" class="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
    <!-- Tombol simpan -->
    <div class="print:hidden self-end mb-4 z-10">
      <!-- <button -->
      <!--   @click="downloadImage" -->
      <!--   class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg" -->
      <!-- > -->
      <!--   💾 Simpan sebagai Gambar -->
      <!-- </button> -->
    </div>

    <!-- Form + Kartu -->
    <div class="w-full max-w-md space-y-6">
      <!-- Form Input -->

      <!-- Kartu Bukti -->
      <div id="wrapper" class="relative bg-white p-4 overflow-hidden shadow rounded-xl">
        <div class="watermark absolute inset-0 pointer-events-none z-0 opacity-50"></div>
        <div id="receipt"
          class="relative rounded-xl p-6 w-full text-sm font-medium border border-gray-300 z-10 bg-white/40">
          <h2 class="text-center text-2xl font-bold mb-4 text-blue-800 tracking-wide">
            Bukti Pembayaran Iuran Warga
          </h2>
          <div class="text-center text-xs text-gray-500 mb-4 leading-snug">
            RT 007 RW 004 Perum Villa Bintaro Asri<br />
            Kelurahan Baratan, Kecamatan Patrang
          </div>

          <div class="border-y border-gray-200 py-4 space-y-2 text-gray-700">
            <div class="flex justify-between">
              <span class="text-gray-600">Nama Warga:</span>
              <span class="font-semibold text-gray-800">{{
                form.namaWarga
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">No. Rumah:</span>
              <span class="font-semibold text-gray-800">{{
                form.noRumah
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Tanggal Bayar:</span>
              <span class="font-semibold text-gray-800">{{
                formattedTanggal
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Metode:</span>
              <span class="font-semibold text-gray-800">{{
                form.metodeBayar
              }}</span>
            </div>
          </div>

          <div class="py-4">
            <table class="w-full text-left text-gray-700 border border-gray-200">
              <thead class="bg-blue-50 text-blue-800">
                <tr class="border-b border-gray-200">
                  <th class="py-2 px-2">Bulan</th>
                  <th class="py-2 px-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-100">
                  <td class="py-2 px-2">{{ formattedBulan }}</td>
                  <td class="py-2 px-2 text-right">
                    {{ formatRupiah(form.nominalBayar) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 font-semibold text-black">
                <tr class="border-t border-gray-200">
                  <td class="py-2 px-2">Total</td>
                  <td class="py-2 px-2 text-right">
                    {{ formatRupiah(form.nominalBayar) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="mt-4 text-center text-green-600 font-semibold">
            ✅ Pembayaran Diterima
          </div>

          <div class="mt-6 text-sm text-gray-700">
            <div class="flex justify-between">
              <span class="text-gray-600">Diterima oleh:</span>
              <span class="font-semibold">{{ form.diterimaOleh }}</span>
            </div>
          </div>

          <div class="mt-6 text-center text-xs text-gray-500 leading-tight">
            Terima kasih atas partisipasi Anda dalam iuran bulanan warga.<br />
            Simpan bukti ini sebagai arsip pribadi.
          </div>

          <div class="mt-6 text-center text-xs text-blue-700 font-semibold italic">
            Mari kita ciptakan lingkungan Villa Bintaro Asri yang<br />
            aman, nyaman, tenteram, dan harmonis 🤝
          </div>
        </div>
      </div>
    </div>

    i<NuxtLink class="text-blue-600" to="/">Lihat Laporan Keuangan</NuxtLink>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createClient } from "@supabase/supabase-js";

const supabase = useSupabaseClient();
const route = useRoute();
const receiptCode = route.params.code;
const router = useRouter();

const form = ref(null);

const formattedTanggal = computed(() => {
  if (!form.value?.tanggalBayar) return "";
  const d = new Date(form.value.tanggalBayar);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const formattedBulan = computed(() => {
  if (!form.value?.bulanBayar) return "";
  const d = new Date(form.value.bulanBayar + "-01");
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
});

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

onMounted(async () => {
  await fetchReceiptData();
});

async function fetchReceiptData() {
  console.log("receiptCode", receiptCode);
  if (!receiptCode) return;

  console.log("running");

  const { data, error } = await supabase
    .from("profile_dues")
    .select(
      `
    code,
    amount_override,
    created_at,
    paid_at,
    billing_periods:billing_period_id (
      month,
      year
    ),
    profiles:profile_id (
      nickname,
      full_name
    ),
    house_number:house_number_id (
      name
    ),
payment_methods:payment_method_id (
  name
)
  `,
    )
    .eq("code", receiptCode)
    .single();

  if (error) {
    console.error("Gagal ambil data:", error);
    return;
  }

  form.value = {
    namaWarga: data.profiles.nickname,
    noRumah: data.house_number.name,
    tanggalBayar: data.paid_at ?? data.created_at,
    bulanBayar: `${data.billing_periods.year}-${String(data.billing_periods.month).padStart(2, "0")}`,
    nominalBayar: data.amount_override,
    metodeBayar: data.payment_methods.name,
    diterimaOleh: data.user?.name || "Petugas RT",
  };
}
</script>
<style scoped>
.watermark {
  background-image: url("/watermark.png");
  background-repeat: repeat;
  background-size: 1000px;
  background-position: center;
}
</style>
