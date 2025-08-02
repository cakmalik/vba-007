import { H3Event, readBody } from 'h3'
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

export default defineEventHandler(async (event: H3Event) => {
  const data = await readBody<any>(event)

  if (!data?.profiles?.phone_number || !data?.code) {
    return {
      status: false,
      reason: 'Data tidak lengkap',
    }
  }

  const phoneNumber = parsePhoneNumber(data.profiles.phone_number)
  const invoiceUrl = `${getRequestURL(event).origin}/invoice/${data.code}`

  const payload = new FormData()
  payload.append('target', phoneNumber)
  payload.append(
    'message',
    `Assalamu’alaikum Wr. Wb.

Terima kasih atas pembayaran iuran warga yang telah dilakukan. Berikut detail pembayarannya:

👤 *Nama*: *${data.profiles?.nickname}*  
🏘️ *Blok*: ${data.house_number?.name ?? '-'}  
📅 *Periode*: ${namaBulanDariAngka(data.billing_periods.month)} ${data.billing_periods.year}  
💰 *Nominal*: Rp ${Number(data.amount).toLocaleString('id-ID')}  
📄 *Invoice*: ${invoiceUrl}

Kontribusi ini sangat membantu dalam menjaga kelancaran kegiatan dan operasional lingkungan RT kita tercinta.

Semoga kebaikan Bapak/Ibu mendapatkan balasan yang lebih baik dari Allah SWT, serta diberikan kelapangan rezeki dan keberkahan.

Wassalamu’alaikum Wr. Wb.  
Hormat kami,  
Pengurus RT 007.

#Pesan ini otomatis, gausah bales gapapa.`
  )

  payload.append('url', invoiceUrl)
  payload.append('filename', `invoice-${data.code}.pdf`)
  payload.append('schedule', '0')
  payload.append('delay', '2')
  payload.append('countryCode', '62')

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: process.env.FONNTE_TOKEN ?? '',
      },
      body: payload,
    })

    const res = await response.json()

    return {
      status: res.status,
      reason: res.reason ?? null,
    }
  } catch (error: any) {
    console.error('WA error:', error)
    return {
      status: false,
      reason: 'Terjadi kesalahan saat mengirim pesan.',
    }
  }
})
