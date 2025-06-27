
// utils/index.ts
export const { format: formatNumber } = Intl.NumberFormat('en-GB', {
  notation: 'compact',
  maximumFractionDigits: 1
})

export const { format: formatCurrency } = Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const numberToIDR = (value: number | string) => {
  const number = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(number)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(number)
}


const namaBulanDariAngka = (angka: number): string => {
  const date = new Date(2000, angka - 1); // tahun bebas
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
}


const getProxyImageUrl = (url?: string) => {
  if (!url) return ''
  const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/)
  const fileId = match?.[1]
  return fileId ? `/api/image/${fileId}` : ''
}

export { formatDate, numberToIDR, namaBulanDariAngka, getProxyImageUrl }
