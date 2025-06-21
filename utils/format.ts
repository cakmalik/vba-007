
export function numberToCurrency(value: number | string, locale = 'id-ID', currency = 'IDR') {
  const number = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(number)) return '-'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(number)
}
