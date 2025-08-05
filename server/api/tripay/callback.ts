import { H3Event, readBody, sendError, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  console.log('[Callback] Payload masuk:', JSON.stringify(body, null, 2))


  const is_sandbox = process.env.TRIPAY_USE_SANDBOX!;
  const reference = body?.reference

  if (body.status !== 'PAID') {
    console.log(`[Callback] Status bukan PAID (${body.status}), proses diabaikan.`)
    return { success: true, ignored: true, message: 'Status bukan PAID, proses diabaikan.' }
  }

  if (!reference) {
    console.warn('[Callback] Reference tidak ditemukan dalam payload')
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Reference tidak ditemukan' }))
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log(`[Callback] Mencari data profile_dues dengan reference: ${reference}`)
    const { data: dues, error: fetchError } = await supabase
      .from('profile_dues')
      .select('id, tripay_ref')
      .eq('tripay_ref', reference)

    if (fetchError || !dues || dues.length === 0) {
      console.warn('[Callback] Data profile_dues tidak ditemukan atau error:', fetchError)
      return sendError(event, createError({
        statusCode: 404,
        statusMessage: 'Data profile_dues tidak ditemukan',
        data: fetchError?.message || 'Tidak ada data'
      }))
    }

    const paidAt = new Date().toISOString()

    async function generateUniqueCode() {
      let isUnique = false
      let code = ''
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 7).toUpperCase()
        const { data: existing } = await supabase
          .from('profile_dues')
          .select('id')
          .eq('code', code)
          .limit(1)
        isUnique = !existing || existing.length === 0
      }
      console.log(`[Callback] Kode unik yang dihasilkan: ${code}`)
      return code
    }

    for (const due of dues) {
      console.log(`[Callback] Memproses profile_dues ID: ${due.id}`)
      const uniqueCode = await generateUniqueCode()

      const { error: updateError } = await supabase
        .from('profile_dues')
        .update({
          status: body.status,
          paid_at: paidAt,
          payment_method_id: 3,
          code: uniqueCode
        })
        .eq('id', due.id)

      const { error: updateError2 } = await supabase
        .from('tripay_transactions')
        .update({
          status: body.status,
          paid_at: paidAt,
        })
        .eq('reference', due.tripay_ref)

      if (updateError || updateError2) {
        console.error('[Callback] Gagal update status profile_dues:', updateError)
        console.error('[Callback] Gagal update status tripay_transactions:', updateError2)
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal update profile_dues',
          data: updateError
        }))
      }

      console.log(`[Callback] Berhasil update profile_dues ID: ${due.id}`)

      const { data: detail, error } = await supabase
        .from("profile_dues")
        .select(`
          *,
          profiles!profile_dues_profile_id_fkey(nickname, full_name, image_url, phone_number),
          house_number:house_number_id!inner(name, housing_block_id, code),
          payment_methods!profile_dues_payment_method_id_fkey(name),
          billing_periods!fk_period(month, year)
        `)
        .eq("id", due.id)
        .single()

      if (error) {
        console.error('[Callback] Gagal mengambil detail profile_dues:', error)
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal fetch detail profile_dues',
          data: error
        }))
      }

      if (is_sandbox == 'false') {
        console.log(`[Callback] Mengirim invoice via WA untuk profile_dues ID: ${due.id}`)
        await sendInvoiceViaWa(detail)
      }
    }

    console.log('[Callback] Semua proses selesai. Transaksi berhasil diproses.')
    return { success: true }

  } catch (e: any) {
    console.error('Unexpected error saat memproses callback:', e)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: e
    }))
  }
})

async function sendInvoiceViaWa(detail: any) {
  const phone = detail?.profiles?.phone_number
  const code = detail?.code

  if (!phone || !code) {
    console.warn('[WA] Nomor telepon atau kode tidak lengkap, WA tidak dikirim')
    return
  }

  // Format nomor WA
  let cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }

  detail.clean_phone = cleanPhone

  try {
    console.log(`[WA] Mengirim pesan WA ke: ${cleanPhone} untuk kode: ${code}`)
    const res = await $fetch(`${process.env.BASE_URL}/api/send-wa`, {
      method: 'POST',
      body: detail
    })

    if (!res?.status) {
      console.error('[WA] Gagal mengirim WA. Respon:', res)
    } else {
      console.log('[WA] Pesan WA berhasil dikirim.')
    }
  } catch (err) {
    console.error('[WA] Error saat kirim WA:', err)
  }
}
