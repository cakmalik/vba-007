
export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  interface Profile {
    user_id: string;
    role: string;
    full_name: string;
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  const userId = user.value.id
  const userEmail = user.value.email // ✅ Ambil email langsung dari auth

  // Cek profil dari table profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, role, full_name')
    .eq('user_id', userId)
    .single<Profile>()

  if (error || !data) {
    console.error('Gagal ambil profile:', error)
    return navigateTo('/login')
  }

  console.log('Email:', userEmail) // ← dari auth
  console.log('Role user:', data.role) // ← dari profiles

  if (data.role !== 'treasurer') {
    return navigateTo('/')
  }
})
