
// server/api/generate-tagihan.post.ts
import { serverSupabaseClient } from '#supabase/server'
import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const billingPeriodId = body.billing_period_id
  const targetHouseNumberId = body.house_number_id || null

  if (!billingPeriodId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'billing_period_id wajib diisi',
    })
  }

  const client = await serverSupabaseClient(event)

  // Ambil semua house_number yang memiliki profile (atau hanya satu jika ada ID)
  const houseQuery = client
    .from('house_number')
    .select('id, profile_id')
    .not('profile_id', 'is', null)

  if (targetHouseNumberId) {
    houseQuery.eq('id', targetHouseNumberId)
  }

  const { data: houseNumbers, error: houseError } = await houseQuery

  if (houseError) {
    throw createError({ statusCode: 500, statusMessage: houseError.message })
  }

  if (!houseNumbers || houseNumbers.length === 0) {
    return { message: 'Tidak ada house_number valid yang ditemukan.' }
  }

  // Ambil semua house_number_id yang sudah punya tagihan di billing_period_id ini
  const { data: existingDues, error: duesError } = await client
    .from('profile_dues')
    .select('house_number_id')
    .eq('billing_period_id', billingPeriodId)

  if (duesError) {
    throw createError({ statusCode: 500, statusMessage: duesError.message })
  }

  const existingHouseNumberIds = new Set(existingDues.map(d => d.house_number_id))

  // Filter hanya house_number_id yang belum ada tagihan
  const duesToCreate = houseNumbers
    .filter(hn => !existingHouseNumberIds.has(hn.id))
    .map(hn => ({
      profile_id: hn.profile_id,
      house_number_id: hn.id,
      billing_period_id: billingPeriodId,
      due_date: new Date().toISOString().split('T')[0],
      status: 'unpaid',
      amount_override: 50000,
      payment_method_id: 2
    }))

  if (duesToCreate.length === 0) {
    return { message: 'Tagihan sudah ada atau tidak ada data yang bisa dibuatkan tagihan.' }
  }

  // Insert batch ke profile_dues
  const { error: insertError } = await client
    .from('profile_dues')
    .insert(duesToCreate)

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  return { message: 'Tagihan berhasil dibuat', total: duesToCreate.length }
})
