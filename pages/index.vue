<template>
  <div>
    <h1>Home</h1>
    <pre>{{ user }}</pre>

    <button @click="logout" class="bg-red-500 text-white px-4 py-2 rounded">
      Logout
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

onMounted(async () => {
  if (!user.value) return

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.value.id)
    .single()

  if (error && error.code === 'PGRST116') {
    const { error: insertError } = await supabase.from('profiles').insert({
      user_id: user.value.id,
      nickname: 'Bendahara',
      full_name: user.value.user_metadata.full_name,
      role: user.value.email === 'hasinilmalik@gmail.com' ? 'treasurer' : 'resident'
    })

    if (insertError) {
      console.error('Gagal insert profile:', insertError)
    } else {
      console.log('Profile berhasil dibuat.')
    }
  }
})

// Fungsi Logout
const logout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
