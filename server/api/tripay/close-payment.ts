import axios from 'axios';
import crypto from 'crypto';
import { getTripayBaseUrl } from '~/utils/tripay';

import { serverSupabaseClient } from '#supabase/server'

const apiKey = process.env.TRIPAY_API_KEY!;
const privateKey = process.env.TRIPAY_PRIVATE_KEY!;
const merchantCode = process.env.TRIPAY_MERCHANT_CODE!;
const amount = process.env.TRIPAY_AMOUNT!;
const callback_url = process.env.TRIPAY_CALLBACK_URL!


export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const body = await readBody(event);
  const houseId = body.house_id;

  if (!houseId) {
    return { status: 400, error: 'Missing house_id' };
  }

  const { data: house, error } = await client
    .from('house_number')
    .select(`
      id,
      name,
      profiles (
        full_name,
        phone_number
      )
    `)
    .eq('id', houseId)
    .single();

  if (error || !house) {
    return { status: 404, error: 'House not found' };
  }


  // return {
  //   status: 200,
  //   data: {
  //     id: house.id,
  //     name: house.name,
  //     profiles: house.profiles,
  //   },
  // }
  //











  const email = house.name.replace(/[^a-zA-Z0-9]/g, '') + '@gmail.com';
  const phone = house.profiles.phone_number.replace(/[^0-9]/g, '');

  const merchantRef = 'INV-' + Date.now();
  const expiredTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 jam

  const signature = crypto.createHmac('sha256', privateKey)
    .update(merchantCode + merchantRef + amount)
    .digest('hex');

  const payload = {
    method: 'QRISC',
    merchant_ref: merchantRef,
    amount,
    customer_name: house.name + ' ' + house.profiles.full_name,
    customer_email: email,
    customer_phone: phone,
    order_items: [
      {
        sku: 'IuranWarga' + house.name,
        name: 'Iuran Warga',
        price: amount,
        quantity: 1,
        product_url: '',
        image_url: '',
      },
    ],
    return_url: callback_url,
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
