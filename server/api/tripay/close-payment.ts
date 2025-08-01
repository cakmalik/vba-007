import axios from 'axios';
import crypto from 'crypto';
import { getTripayBaseUrl } from '~/utils/tripay';

const apiKey = process.env.TRIPAY_API_KEY!;
const privateKey = process.env.TRIPAY_PRIVATE_KEY!;
const merchantCode = process.env.TRIPAY_MERCHANT_CODE!;

export default defineEventHandler(async () => {
  const merchantRef = 'INV345675';
  const amount = 1000000;
  const expiredTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 jam

  const signature = crypto.createHmac('sha256', privateKey)
    .update(merchantCode + merchantRef + amount)
    .digest('hex');

  const payload = {
    method: 'QRISC',
    merchant_ref: merchantRef,
    amount,
    customer_name: 'Nama Pelanggan',
    customer_email: 'emailpelanggan@domain.com',
    customer_phone: '081234567890',
    order_items: [
      {
        sku: 'PRODUK1',
        name: 'Nama Produk 1',
        price: 500000,
        quantity: 1,
        product_url: 'https://tokokamu.com/product/nama-produk-1',
        image_url: 'https://tokokamu.com/product/nama-produk-1.jpg',
      },
      {
        sku: 'PRODUK2',
        name: 'Nama Produk 2',
        price: 500000,
        quantity: 1,
        product_url: 'https://tokokamu.com/product/nama-produk-2',
        image_url: 'https://tokokamu.com/product/nama-produk-2.jpg',
      }
    ],
    return_url: 'https://domainanda.com/redirect',
    expired_time: expiredTime,
    signature
  };

  // const tripayUrl = `https://tripay.co.id/api-sandbox/transaction/create`; // or use util
  const tripayUrl = `${getTripayBaseUrl()}/transaction/create`;
  console.log(tripayUrl);

  try {
    const response = await axios.post(tripayUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (err: any) {
    return {
      status: err.response?.status || 500,
      error: err.response?.data || err.message,
    };
  }
});
