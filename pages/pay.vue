<template>
  <NuxtLayout name="public">
    <div class="max-w-md mx-auto text-center mt-20 space-y-4 space-x-2">
      <USelectMenu
        v-model="selectedHouse"
        :items="houseOptions"
        label="No Rumah"
        placeholder="Pilih no rumah"
        class="w-full sm:w-1/2 md:w-1/4"
        :loading="isLoading"
      />

      <UButton :disabled="!selectedHouse" @click="makePayment" color="primary">
        Bayar Sekarang
      </UButton>

      <div
        v-if="result?.data?.data"
        class="mt-6 text-center space-y-6 text-gray-700 dark:text-white"
      >
        <h2 class="text-xl font-semibold">
          {{ result.data.data.customer_name }}
        </h2>

        <ul>
          <li v-for="(item, idx) in result.data.data.order_items" :key="idx">
            {{ item.name }}
          </li>
        </ul>

        <p>Total yang harus dibayar</p>

        <h2 class="text-xl font-semibold text-green-500">
          {{
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(result.data.data.amount)
          }}
        </h2>

        <!-- QR CODE -->
        <img
          :src="result.data.data.qr_url"
          alt="QR Code Pembayaran"
          ref="qrImage"
          class="mx-auto w-60 h-60 rounded border"
        />

        <!-- BUTTON DOWNLOAD -->
        <UButton @click="downloadQr" color="gray"> Download QR Code </UButton>

        <!-- INSTRUCTIONS -->
        <div
          v-if="result.data.data.instructions?.length"
          class="text-left max-w-md mx-auto space-y-4"
        >
          <h3 class="text-lg font-semibold">Instruksi Pembayaran</h3>
          <div
            v-for="(instruction, idx) in result.data.data.instructions"
            :key="idx"
            class="border rounded p-4 bg-gray-50"
          >
            <h4 class="font-bold mb-2 text-gray-800">
              {{ instruction.title }}
            </h4>
            <ol class="list-decimal ml-5 space-y-1 text-sm text-gray-700">
              <li v-for="(step, stepIdx) in instruction.steps" :key="stepIdx">
                {{ step }}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Pembayaran",
});

const supabase = useSupabaseClient();
const selectedHouse = ref<{ label: string; value: number } | null>(null);
const houseOptions = ref([]);
const isLoading = ref(true);
const result = ref<any>(null);

const getHouseNumbers = async () => {
  isLoading.value = true;
  const { data: nomerRumah, error } = await supabase
    .from("house_number")
    .select("id, profile_id, name");

  if (error) {
    console.error("Error fetching house numbers:", error);
    isLoading.value = false;
    return;
  }

  houseOptions.value = nomerRumah.map((h) => ({ label: h.name, value: h.id }));
  isLoading.value = false;
};

onMounted(getHouseNumbers);

async function makePayment() {
  if (!selectedHouse.value) return;

  const res = await $fetch("/api/tripay/close-payment", {
    method: "POST",
    body: {
      house_id: selectedHouse.value.value,
    },
  });

  console.log(res);
  result.value = res;

  if (res.status === 400) {
    alert(res.error);
  }
}

// Format currency Rp
function formatCurrency(amount: number) {
  return amount.toLocaleString("id-ID");
}

const qrImage = ref<HTMLImageElement | null>(null);

function downloadQr() {
  const qrUrl = result.value?.data?.data?.qr_url;
  if (!qrUrl) return;

  const apiUrl = `/api/tripay/download-qr?url=${encodeURIComponent(qrUrl)}`;
  window.open(apiUrl, "_blank");
}
</script>
