
import { defineEventHandler, readBody } from 'h3'
import crypto from 'crypto'
import { getTripayBaseUrl } from '~/utils/tripay'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const baseUrl = getTripayBaseUrl()
  const apiKey = process.env.TRIPAY_API_KEY!
  const privateKey = process.env.TRIPAY_PRIVATE_KEY!
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE!

  const merchantRef = body.merchant_ref || `INV-${Date.now()}`
  const channel = body.channel || 'QRIS'
  const amount = body.amount || 10000

  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(merchantCode + channel + merchantRef)
    .digest('hex')

  const payload = {
    method: channel,
    merchant_ref: merchantRef,
    amount,
    customer_name: body.customer_name || 'Pelanggan',
    signature,
  }

  const response = await fetch(`${baseUrl}/open-payment/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()
  return result
})
