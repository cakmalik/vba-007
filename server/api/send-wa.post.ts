
import { H3Event, readBody, getRequestURL } from 'h3'
import { namaBulanDariAngka } from '~/utils'

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

function createPayload(
  target: string,
  message: string,
  code: string,
  invoiceUrl: string
): FormData {
  const payload = new FormData()
  payload.append('target', target)
  payload.append('message', message)
  payload.append('url', invoiceUrl)
  payload.append('filename', `invoice-${code}.pdf`)
  payload.append('schedule', '0')
  payload.append('delay', '2')
  payload.append('countryCode', '62')
  return payload
}

export default defineEventHandler(async (event: H3Event) => {
  const data = await readBody<any>(event)

  if (!data?.profiles?.phone_number || !data?.code) {
    return {
      status: false,
      reason: 'Data tidak lengkap',
    }
  }

  const token = process.env.NUXT_FONNTE
  if (!token) {
    return {
      status: false,
      reason: 'Token Fonnte tidak tersedia.',
    }
  }

  const phoneNumber = parsePhoneNumber(data.profiles.phone_number)
  const invoiceUrl = `${getRequestURL(event).origin}/invoice/${data.code}`

  // Pesan utama ke pembayar
  const message = `Assalamu’alaikum Wr. Wb.

Terima kasih atas pembayaran iuran warga yang telah dilakukan. Berikut detail pembayarannya:

👤 *Nama*: *${data.profiles?.nickname}*  
🏘️ *Blok*: ${data.house_number?.name ?? '-'}  
📅 *Periode*: ${namaBulanDariAngka(data.billing_periods.month)} ${data.billing_periods.year}  
💰 *Nominal*: Rp ${Number(data.amount_override).toLocaleString('id-ID')}  
💳 *Metode Pembayaran*: ${data.payment_methods?.name ?? '-'}
📄 *Invoice*: ${invoiceUrl}

Kontribusi ini sangat membantu dalam menjaga kelancaran kegiatan dan operasional lingkungan RT kita tercinta.

Semoga kebaikan Bapak/Ibu mendapatkan balasan yang lebih baik dari Allah SWT, serta diberikan kelapangan rezeki dan keberkahan.

Wassalamu’alaikum Wr. Wb.  
Hormat kami,  
Pengurus RT 007.

#Pesan ini otomatis, gausah bales gapapa.`

  const payload = createPayload(phoneNumber, message, data.code, invoiceUrl)

  // Pesan tembusan ke pengurus
  const tembusan = process.env.NOMER_NOTIF_TEMBUSAN ?? '6283853457929'
  const tembusan2 = process.env.NOMER_NOTIF_TEMBUSAN_2 ?? '6281249178392'
  const phoneNumber2 = parsePhoneNumber(tembusan)
  const phoneNumber3 = parsePhoneNumber(tembusan2)

  const message2 = `📌007#Tembusan
==================

👤 *Nama*: *${data.profiles?.nickname}*  
🏘️ *Blok*: ${data.house_number?.name ?? '-'}  
📅 *Periode*: ${namaBulanDariAngka(data.billing_periods.month)} ${data.billing_periods.year}  
💰 *Nominal*: Rp ${Number(data.amount_override).toLocaleString('id-ID')}  
📄 *Invoice*: ${invoiceUrl}
💳 *Metode Pembayaran*: ${data.payment_methods?.name ?? '-'}
`
  const payload2 = createPayload(phoneNumber2, message2, data.code, invoiceUrl)

  const message3 = `📌007# Notif Pembayaran #nama: ${data.profiles?.nickname} #periode: ${namaBulanDariAngka(data.billing_periods.month)} ${data.billing_periods.year}`
  const payload3 = createPayload(phoneNumber3, message3, data.code, invoiceUrl)

  try {
    const [res1, res2, res3] = await Promise.all([
      fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        body: payload,
      }),
      fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        body: payload2,
      }),
      fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        body: payload3,
      }),
    ])

    const response1 = await res1.json()
    const response2 = await res2.json()
    const response3 = await res3.json()

    if (!response1.status || !response2.status) {
      return {
        status: false,
        reason:
          response1.reason ||
          response2.reason ||
          'Pengiriman pesan gagal sebagian.',
      }
    }

    return {
      status: true,
      reason: null,
    }
  } catch (error: any) {
    console.error('WA error:', {
      message: error?.message,
      stack: error?.stack,
      error,
    })
    return {
      status: false,
      reason: 'Terjadi kesalahan saat mengirim pesan.',
    }
  }
})
