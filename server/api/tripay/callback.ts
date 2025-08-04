// server/api/tripay-callback.ts
// import { serverSupabaseClient } from '#supabase/server'
import { H3Event, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  const reference = body?.reference

  if (!reference) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Reference tidak ditemukan' }))
  }

  // const supabase = serverSupabaseClient(event)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role agar bisa update
  )
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

    // Waktu pembayaran (dibuat 1x saja)
    const paidAt = new Date().toISOString()

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
          paid_at: paidAt,
          payment_method_id: 3,
          code: uniqueCode
        })
        .eq('id', due.id)

      if (updateError) {
        const errorDetail = {
          message: updateError.message,
          hint: updateError.hint,
          details: updateError.details,
          code: updateError.code,
          due_id: due.id,
          data: {
            status: 'paid',
            paid_at: paidAt,
            payment_method_id: 3,
            code: uniqueCode
          }
        }

        console.error('Gagal update profile_dues:', errorDetail)

        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal update profile_dues',
          data: errorDetail
        }))
      }
    }

    // Semua berhasil
    return { success: true }


  } catch (e: unknown) {
    let errorDetail: any = {
      type: typeof e,
      raw: e
    }

    if (e instanceof Error) {
      errorDetail = {
        name: e.name,
        message: e.message,
        stack: e.stack
      }
    } else if (typeof e === 'object' && e !== null) {
      // coba ambil detail jika objek
      errorDetail = {
        ...e,
        message: (e as any).message ?? 'Unknown object error',
        stack: (e as any).stack ?? null
      }
    } else if (typeof e === 'string') {
      errorDetail = {
        message: e
      }
    }

    console.error('Unexpected error:', errorDetail)

    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: errorDetail
    }))
  }
})
