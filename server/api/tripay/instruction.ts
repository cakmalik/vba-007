
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const code = getQuery(event).code as string || 'BRIVA'

  const response = await fetch(`https://tripay.co.id/api/payment/instruction?code=${code}`, {
    headers: {
      Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
    },
  })

  const result = await response.json()
  return result
})
