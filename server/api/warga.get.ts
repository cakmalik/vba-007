// server/api/warga.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // ambil semua warga yang masih hidup (is_living = true) misalnya
  const { data, error } = await client
    .from('profiles')
    .select('phone_number, full_name')
    .eq('is_living', true)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
