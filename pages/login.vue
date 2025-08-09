<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-sm p-6 shadow-md space-y-4">

      <div v-if="countdown > 0" class="text-sm text-gray-500 text-center">
        Please wait {{ countdown }}s before retrying.
      </div>

      <UButton to="/dashboard-public" color="primary" variant="outline" block>
        Warga
      </UButton>
      <UButton label="Admin" block color="gray" variant="ghost" @click="signInWithGoogle" />
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const supabase = useSupabaseClient();
const email = ref("");
const countdown = ref(0);

const redirectTo = config.public.supabaseRedirectUrl;
console.log("redirectTo", redirectTo);

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    if (error.code === "validation_failed") {
      return useToast().add({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        color: "red",
      });
    }

    if (error.code === "over_email_send_rate_limit") {
      useToast().add({
        title: "Too Many Requests",
        description: "Please try again in a few minutes.",
        color: "yellow",
      });

      countdown.value = 60;
      const interval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) clearInterval(interval);
      }, 1000);
    }

    console.error(error);
    return;
  }

  useToast().add({
    title: "Check Your Email",
    description: "Login link sent to your email!",
    color: "green",
  });
};

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) {
    console.error(error);
    useToast().add({
      title: "Google Sign-In Failed",
      description: error.message,
      color: "red",
    });
  }
};
</script>
