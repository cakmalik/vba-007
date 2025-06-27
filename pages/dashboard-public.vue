<template>
  <NuxtLayout name="public">
    <div
      class="text-center text-muted flex flex-col justify-between min-h-[70vh]"
    >
      <h1>
        Mohon Maaf masih
        <br />
        dalam tahap development !
      </h1>
      <NuxtLink to="/login">Login</NuxtLink>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Dashboard",
});
</script>
