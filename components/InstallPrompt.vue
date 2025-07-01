<template>
  <div
    v-if="canInstall"
    class="fixed bottom-20 left-4 right-4 sm:right-auto sm:w-auto z-50"
  >
    <div
      class="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-between gap-4"
    >
      <div>
        <p class="font-semibold text-gray-800">Install Aplikasi?</p>
        <p class="text-sm text-gray-500">
          Tambahkan ke layar utama untuk akses cepat.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton size="sm" color="gray" @click="dismiss">Nanti</UButton>
        <UButton size="sm" color="primary" @click="install">Install</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const deferredPrompt = ref<Event | null>(null);
const canInstall = ref(false);

onMounted(() => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    canInstall.value = true;
  });
});

const install = async () => {
  if (!deferredPrompt.value) return;

  const promptEvent = deferredPrompt.value as any;
  promptEvent.prompt();

  const { outcome } = await promptEvent.userChoice;
  if (outcome === "accepted") {
    console.log("Aplikasi diinstall");
  } else {
    console.log("Pengguna batal install");
  }

  canInstall.value = false;
};

const dismiss = () => {
  canInstall.value = false;
};
</script>
