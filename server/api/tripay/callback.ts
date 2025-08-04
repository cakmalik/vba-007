
// server/api/tripay-callback.ts
import { serverSupabaseClient } from '#supabase/server'
import { H3Event, readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  const reference = body?.reference

  if (!reference) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Reference tidak ditemukan' }))
  }

  const supabase = serverSupabaseClient(event)

  try {
    // Ambil profile_dues berdasarkan tripay_ref
    const { data: dues, error: fetchError } = await supabase
      .from('profile_dues')
      .select('id')
      .eq('tripay_ref', reference)

    if (fetchError || !dues || dues.length === 0) {
      return sendError(event, createError({
        statusCode: 404,
        statusMessage: 'Data profile_dues tidak ditemukan',
        data: fetchError?.message || 'Tidak ada data'
      }))
    }

    // Fungsi generate kode unik
    async function generateUniqueCode() {
      let isUnique = false
      let code = ''
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 7).toUpperCase()
        const { data: existing, error: codeCheckError } = await supabase
          .from('profile_dues')
          .select('id')
          .eq('code', code)
          .limit(1)

        if (!codeCheckError && (!existing || existing.length === 0)) {
          isUnique = true
        }
      }
      return code
    }

    // Update semua baris
    for (const due of dues) {
      const uniqueCode = await generateUniqueCode()
      const { error: updateError } = await supabase
        .from('profile_dues')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method_id: 3,
          code: uniqueCode
        })
        .eq('id', due.id)

      if (updateError) {
        console.error(`Gagal update profile_dues ID ${due.id}`, updateError)
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal update salah satu profile_dues',
          data: updateError
        }))
      }
    }

    return { success: true }

  } catch (e) {
    console.error('Unexpected error', e)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: e
    }))
  }
})
