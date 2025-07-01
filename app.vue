<template>
  <UApp>
    <VitePwaManifest v-if="isProd" /> <InstallPrompt v-if="isProd" />
    <NuxtPage />
  </UApp>
</template>
<script setup lang="ts">
const isProd = import.meta.env.PROD;
</script>
