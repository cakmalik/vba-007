
// server/api/image/[id].ts
import { getRouterParam, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'File ID is required' })
  }

  // URL Google Drive raw image
  const imageUrl = `https://drive.google.com/uc?export=view&id=${id}`

  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: 'Failed to fetch image' })
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = await res.arrayBuffer()

  // Set headers
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=86400') // Optional caching

  return Buffer.from(buffer)
})
