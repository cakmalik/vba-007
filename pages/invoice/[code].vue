<template>
  <div class="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
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
      <div
        id="wrapper"
        class="relative bg-white p-4 overflow-hidden shadow rounded-xl"
      >
        <div
          class="watermark absolute inset-0 pointer-events-none z-0 opacity-50"
        ></div>
        <div
          id="receipt"
          class="relative rounded-xl p-6 w-full text-sm font-medium border border-gray-300 z-10 bg-white/40"
        >
          <h2
            class="text-center text-2xl font-bold mb-4 text-blue-800 tracking-wide"
          >
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
            <table
              class="w-full text-left text-gray-700 border border-gray-200"
            >
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

          <div
            class="mt-6 text-center text-xs text-blue-700 font-semibold italic"
          >
            Mari kita ciptakan lingkungan Villa Bintaro Asri yang<br />
            aman, nyaman, tenteram, dan harmonis 🤝
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import html2canvas from "html2canvas";
import { ref, computed, onMounted } from "vue";

const form = ref({
  namaWarga: "Bpk Bayu",
  noRumah: "P-19",
  tanggalBayar: "",
  bulanBayar: "",
  nominalBayar: 50000,
  metodeBayar: "Cash / Tunai",
  diterimaOleh: "Ketua RT - Bpk. Supriyono",
});

const metodeOptions = ["Cash / Tunai", "Transfer Bank", "QRIS", "Lainnya"];

onMounted(() => {
  const today = new Date();
  form.value.tanggalBayar = today.toISOString().substring(0, 10);
  form.value.bulanBayar = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
});

const formattedTanggal = computed(() => {
  const d = new Date(form.value.tanggalBayar);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const formattedBulan = computed(() => {
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

function updateReceipt() {
  // semua data sudah reactive via v-model
}

function downloadImage() {
  const el = document.getElementById("wrapper");
  let nama = form.value.namaWarga
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
  const fileName = `bukti-iuran-${nama}.png`;

  html2canvas(el, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    imageTimeout: 0,
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  }).then((canvas) => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL();
    link.click();
  });
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
