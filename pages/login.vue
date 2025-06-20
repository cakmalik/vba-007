<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const countdown = ref(0)

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: 'http://localhost:3000/confirm',
    }
  })

  if (error) {
    if (error.code === 'validation_failed') {
      return useToast().add({ title: 'Invalid Email', description: 'Please enter a valid email address.', color: 'red' })
    }

    if (error.code === 'over_email_send_rate_limit') {
      useToast().add({ title: 'Too Many Requests', description: 'Please try again in a few minutes.', color: 'yellow' })
      countdown.value = 60
      const interval = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(interval)
      }, 1000)
    }

    console.error(error)
    return
  }

  useToast().add({ title: 'Check Your Email', description: 'Login link sent to your email!', color: 'green' })
}

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/confirm',
    }
  })

  if (error) {
    console.error(error)
    useToast().add({ title: 'Google Sign-In Failed', description: error.message, color: 'red' })
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow-md space-y-4 bg-white dark:bg-gray-900">
    <!-- <UInput v-model="email" type="email" placeholder="Enter your email" icon="i-heroicons-envelope" size="lg" -->
    <!--   :disabled="countdown > 0" /> -->

    <!-- <UButton label="Sign In with Email" block :loading="countdown > 0" @click="signInWithOtp" /> -->

    <UButton label="Sign In with Google" block icon="i-simple-icons-google" color="red" variant="soft"
      @click="signInWithGoogle" />

    <div v-if="countdown > 0" class="text-sm text-gray-500 text-center">
      Please wait {{ countdown }}s before retrying.
    </div>
  </div>
</template>
