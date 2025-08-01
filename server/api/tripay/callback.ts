
export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }))
  }

  const body = await readBody(event)
  console.log('TRIPAY CALLBACK:', body)

  return {
    status: 'ok',
    message: 'Tripay callback diterima',
  }
})
