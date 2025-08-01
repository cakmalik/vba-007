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
      <div v-if="result">
        <p>Status: {{ result.status }}</p>
        <pre>{{ result.data }}</pre>
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

  // console.log("data nomer rumah", nomerRumah);
  houseOptions.value = nomerRumah.map((h) => ({ label: h.name, value: h.id }));

  isLoading.value = false;
};

onMounted(async () => {
  await getHouseNumbers();
});

const result = ref(null);
async function makePayment() {
  const res = await $fetch("/api/tripay/close-payment");
  console.log("res", res);
  result.value = res;
}
</script>
