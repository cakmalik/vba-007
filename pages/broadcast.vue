<template>
  <NuxtLayout>
  <div class="max-w-2xl mx-auto space-y-6 p-6">

    <!-- Action buttons -->
    <div class="flex flex-wrap gap-2">
      <UButton variant="outline" @click="ambilNomorWarga">
        Ambil Nomor Warga
      </UButton>
      <UButton variant="outline" @click="ambilNomorWargaUnpaid">
        Ambil Nomor Warga Belum Bayar Iuran
      </UButton>
    </div>

    <!-- Form broadcast -->
      <form @submit.prevent="kirimBroadcast" class="space-y-4">
        <!-- Pesan -->
        <div class="w-full">
          <UTextarea
            v-model="form.message"
            :rows="5"
            placeholder="Tulis pesan untuk warga..."
          class="w-full"
          />
        </div>

        <!-- Daftar nomor -->
          <UTextarea
            v-model="form.numbers"
            :rows="3"
            placeholder="contoh: 081234567890, 082233445566"
          class="w-full"
          />

        <!-- Submit -->
        <div>
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            :loading="loading"
          class="mt-6"
          >
            Kirim Broadcast
          </UButton>
        </div>
      </form>

    <!-- Hasil -->
    <UCard v-if="result">
      <p>
        Status:
        <strong>{{ result.status ? "Sukses ✅" : "Gagal ❌" }}</strong>
      </p>
      <p v-if="result.total">Total: {{ result.total }}</p>
      <p v-if="result.sukses">Sukses: {{ result.sukses }}</p>
      <p v-if="result.gagal">Gagal: {{ result.gagal }}</p>
      <p v-if="result.reason">Alasan: {{ result.reason }}</p>
    </UCard>
  </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Broadcast Message",
  subtitle: "Kirim Pesan ke warga",
  layout: "default",
})

const form = reactive({
  message: "",
  numbers: "",
})

const loading = ref(false)
const result = ref<any>(null)

async function kirimBroadcast() {
  loading.value = true
  result.value = null

  const warga = form.numbers
    .split(",")
    .map((n) => ({ phone_number: n.trim() }))
    .filter((w) => w.phone_number)

  try {
    const res = await $fetch("/api/broadcast", {
      method: "POST",
      body: {
        message: form.message,
        warga,
      },
    })
    result.value = res
  } catch (err: any) {
    result.value = { status: false, reason: err?.message || "Error tidak diketahui" }
  } finally {
    loading.value = false
  }
}

async function ambilNomorWarga() {
  const warga = await $fetch("/api/warga")
  form.numbers = warga.map((w: any) => w.phone_number).join(", ")
}

async function ambilNomorWargaUnpaid() {
  const warga = await $fetch("/api/warga-unpaid")
  form.numbers = warga.map((w: any) => w.phone_number).join(", ")
}
</script>
