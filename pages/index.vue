<template>
  <div>
    <h1>Home</h1>
    <pre>{{ user }}</pre>
  </div>
</template>
<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()

onMounted(async () => {
  if (!user.value) {
    return;
  }

  const { data: profile, error } = await supabase.from('profiles').select('id').eq('id', user.value.id).single()

  if (error && error.code === 'PGRST116') {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.value.id,
      full_name: user.value.user_metadata.full_name,
      role: user.value.email == 'hasinilmalik@gmail.com' ? 'treasurer' : 'resident'
    })

    if (insertError) {
      console.error('Gagal insert profile:', insertError)
    } else {
      console.log('Profile berhasil dibuat.')
    }
  }
})
console.log(user)
</script>
