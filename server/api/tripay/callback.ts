import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = serverSupabaseClient(event)

  try {
    // Validasi payload yang masuk
    if (!body?.reference || !body?.status) {
      setResponseStatus(event, 400)
      return { error: true, message: 'Invalid payload' }
    }

    const reference = body.reference
    const status = body.status

    // Cari tagihan berdasarkan kode reference
    const { data: due, error: dueError } = await client
      .from('profile_dues')
      .select('id')
      .eq('code', reference)
      .single()

    if (dueError || !due) {
      setResponseStatus(event, 404)
      return { error: true, message: 'Tagihan tidak ditemukan' }
    }

    // Update status tagihan
    const { error: updateError } = await client
      .from('profile_dues')
      .update({ status })
      .eq('id', due.id)

    if (updateError) {
      setResponseStatus(event, 500)
      return { error: true, message: 'Gagal update tagihan' }
    }

    // Jika status sukses, kirim WA
    if (status === 'PAID') {
      const { data: fullDue, error: fullError } = await client
        .from('profile_dues')
        .select('id, code, profiles(name, phone_number)')
        .eq('id', due.id)
        .single()

      if (!fullDue || fullError) {
        console.error('Gagal ambil data profil untuk WA:', fullError)
      } else {
        try {
          // Kirim WA ke endpoint internal
          const waRes = await $fetch('/api/send-wa', {
            method: 'POST',
            body: fullDue,
          })

          console.log('WA response:', waRes)
        } catch (err) {
          console.error('Gagal kirim WA:', err)
        }
      }
    }

    return {
      error: false,
      message: 'Callback diproses',
    }
  } catch (err) {
    console.error('Server Error:', err)
    setResponseStatus(event, 500)
    return {
      error: true,
      message: 'Server Error',
    }
  }
})
