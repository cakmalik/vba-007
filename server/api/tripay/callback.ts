
import { H3Event, readBody, sendError, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { $fetch } from 'ofetch' // Penting!

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  const reference = body?.reference

  if (!reference) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Reference tidak ditemukan' }))
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
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
      return code
    }

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
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal update profile_dues',
          data: updateError
        }))
      }

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
        return sendError(event, createError({
          statusCode: 500,
          statusMessage: 'Gagal fetch detail profile_dues',
          data: error
        }))
      }

      await sendInvoiceViaWa(detail)
    }

    return { success: true }

  } catch (e: any) {
    console.error('Unexpected error:', e)
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
    console.warn('Nomor telepon atau kode tidak lengkap')
    return
  }

  // Format nomor WA
  let cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }

  // Masukkan kembali ke detail agar konsisten
  detail.clean_phone = cleanPhone

  try {
    const res = await $fetch('/api/send-wa', {
      method: 'POST',
      body: detail,
    })

    if (!res?.status) {
      console.error('Gagal kirim WA:', res)
    }
  } catch (err) {
    console.error('WA error:', err)
  }
}

