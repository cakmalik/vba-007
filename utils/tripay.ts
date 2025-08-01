export const getTripayBaseUrl = () => {
  return process.env.TRIPAY_USE_SANDBOX == 'true'
    ? process.env.TRIPAY_API_URL_SANDBOX
    : process.env.TRIPAY_API_URL_PRODUCTION
}
