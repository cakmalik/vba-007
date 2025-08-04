
import { H3Event, readBody, sendError, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  console.log('[Callback] Payload masuk:', JSON.stringify(body, null, 2))

  const reference = body?.reference

  if (!reference) {
    console.error('[Callback] Reference tidak ditemukan dalam body')
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Reference tidak ditemukan' }))
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('[Callback] Mulai ambil data profile_dues dengan reference:', reference)

  try {
    const { data: dues, error: fetchError } = await supabase
      .from('profile_dues')
      .select(`
        id,
        amount_override,
        profile:profiles(phone_number, nickname),
        billing_periods(month, year),
        house_number(name)
      `)
      .eq('tripay_ref', reference)

    if (fetchError) {
      console.error('[Callback] Gagal fetch dues:', fetchError)
      return sendError(event, createError({ statusCode: 500, statusMessage: 'Gagal ambil data', data: fetchError }))
    }

    if (!dues || dues.length === 0) {
      console.warn('[Callback] Data profile_dues tidak ditemukan untuk reference:', reference)
      return sendError(event, createError({ statusCode: 404, statusMessage: 'Data tidak ditemukan' }))
    }

    console.log(`[Callback] Ditemukan ${dues.length} data dues, lanjut proses update...`)

    const paidAt = new Date().toISOString()

    async function generateUniqueCode(): Promise<string> {
      let isUnique = false
      let code = ''
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 7).toUpperCase()
        const { data: existing, error } = await supabase
          .from('profile_dues')
          .select('id')
          .eq('code', code)
          .limit(1)

        if (!error && (!existing || existing.length === 0)) {
          isUnique = true
        }
      }
      return code
    }

    for (const due of dues) {
      const uniqueCode = await generateUniqueCode()

      console.log(`[Callback] Update due ID: ${due.id} dengan code: ${uniqueCode}`)

      const { error: updateError } = await supabase
        .from('profile_dues')
        .update({
          status: 'paid',
          paid_at: paidAt,
          payment_method_id: 3,
          code: uniqueCode,
        })
        .eq('id', due.id)

      if (updateError) {
        console.error('[Callback] Gagal update profile_dues:', updateError)
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal update profile_dues',
          data: updateError
        }))
      }

      // Query ulang payload setelah update
      const { data: fullPayload, error: queryError } = await supabase
        .from('profile_dues')
        .select(`
          *,
          profiles!profile_dues_profile_id_fkey(nickname, full_name, image_url, phone_number),
          house_number:house_number_id!inner(name, housing_block_id, code),
          payment_methods!profile_dues_payment_method_id_fkey(name),
          billing_periods!fk_period(month, year)
        `)
        .eq('id', due.id)
        .order('due_date', { ascending: false })
        .single()

      if (queryError || !fullPayload) {
        console.error('[Callback] Gagal ambil payload setelah update:', queryError)
        continue
      }

      const phone = fullPayload.profile?.phone_number
      if (phone) {

        try {
          const response = await $fetch('/api/send-wa', {
            method: 'POST',
            body: fullPayload,
          })

          if (response?.status) {
            console.log('[Callback] WA berhasil dikirim ke:', phone)
          } else {
            console.error('[Callback] WA gagal dengan response:', response)
          }
        } catch (waError) {
          console.error('[Callback] Gagal mengirim WA (exception):', waError)
        }
      } else {
        console.warn('[Callback] Nomor WA tidak ditemukan untuk due id:', due.id)
      }
    }

    console.log('[Callback] Proses selesai sukses')
    return { success: true }

  } catch (e: unknown) {
    console.error('[Callback] Unexpected error:', e)

    const detail = e instanceof Error
      ? { name: e.name, message: e.message, stack: e.stack }
      : { raw: e }

    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: detail
    }))
  }
})
