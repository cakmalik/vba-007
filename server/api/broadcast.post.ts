import { H3Event, readBody } from 'h3'

function parsePhoneNumber(raw: string): string {
  let phone = raw.replace(/\D/g, '')

  if (phone.startsWith('0')) {
    phone = '62' + phone.slice(1)
  } else if (phone.startsWith('+')) {
    phone = phone.replace(/^\+/, '')
  } else if (!phone.startsWith('62')) {
    phone = '62' + phone
  }

  return phone
}

function createPayload(target: string, message: string): FormData {
  const payload = new FormData()
  payload.append('target', target)
  payload.append('message', message)
  payload.append('delay', '2')
  payload.append('schedule', '0')
  payload.append('countryCode', '62')
  return payload
}

type InputBody = { message: string; warga: { phone_number: string }[] }
type ItemResult = {
  target: string
  ok: boolean
  reason?: string
  httpStatus?: number
  response?: any
}

export default defineEventHandler(async (event: H3Event) => {
  const data = await readBody<InputBody>(event)

  if (!data?.message || !data?.warga?.length) {
    return { status: false, reason: 'Data tidak lengkap' }
  }

  const token = process.env.NUXT_FONNTE
  if (!token) {
    return { status: false, reason: 'Token Fonnte tidak tersedia.' }
  }

  // helper kirim ke satu nomor
  async function sendOne(target: string): Promise<ItemResult> {
    try {
      const payload = createPayload(target, data.message)
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: token },
        body: payload,
      })

      let body: any = null
      let text: string | undefined

      try {
        body = await res.json()
      } catch {
        text = await res.text()
      }

      console.log('Fonnte response:', target, {
        httpStatus: res.status,
        body: body ?? text,
      })
      console.log(token)

      const ok = res.ok && body?.status === true

      const reason =
        body?.reason ||
        (!res.ok ? `${res.status} ${res.statusText}` : text || 'Unknown error')

      return { target, ok, reason, httpStatus: res.status, response: body ?? text }
    } catch (e: any) {
      return { target, ok: false, reason: e?.message || 'Network error' }
    }
  }

  try {
    const items = data.warga
      .map((w) => w?.phone_number?.trim())
      .filter(Boolean)
      .map(parsePhoneNumber)

    const results = await Promise.all(items.map(sendOne))

    const sukses = results.filter((r) => r.ok).length
    const gagal = results.length - sukses

    return {
      status: gagal === 0, // true hanya jika semua berhasil
      total: results.length,
      sukses,
      gagal,
      reason: gagal > 0 ? 'Ada pesan yang gagal dikirim' : null,
      details: results,
    }
  } catch (error: any) {
    console.error('Broadcast error:', error)
    return { status: false, reason: 'Terjadi kesalahan saat broadcast.' }
  }
})
