
// server/api/warga-unpaid.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('profile_dues')
    .select(`
      id,
      status,
      profile:profiles (id, full_name, phone_number)
    `)
    .eq('status', 'unpaid')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // kembalikan hanya data profile unik (jangan sampai nomor dobel)
  const uniqueProfiles = Object.values(
    (data || []).reduce((acc: any, d: any) => {
      if (d.profile?.phone_number) {
        acc[d.profile.phone_number] = d.profile
      }
      return acc
    }, {})
  )

  return uniqueProfiles
})
