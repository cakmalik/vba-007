import axios from 'axios';
import crypto from 'crypto';
import { getTripayBaseUrl } from '~/utils/tripay';

import { serverSupabaseClient } from '#supabase/server'

const apiKey = process.env.TRIPAY_API_KEY!;
const privateKey = process.env.TRIPAY_PRIVATE_KEY!;
const merchantCode = process.env.TRIPAY_MERCHANT_CODE!;
const amount = process.env.TRIPAY_AMOUNT!;
const callback_url = process.env.TRIPAY_CALLBACK_URL!
const is_sandbox = process.env.TRIPAY_USE_SANDBOX!;


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

  // 🔍 Cek apakah ada tagihan unpaid
  const { data: unpaidDues, error: duesError } = await client
    .from('profile_dues')
    .select(`
    id,
    amount_override,
    due_date,
    billing_period_id,
    billing_periods (
      month,
      year
    )
  `)
    .eq('house_number_id', house.id)
    .eq('status', 'unpaid');


  if (duesError) {
    return { status: 500, error: 'Failed to check dues' };
  }

  if (!unpaidDues || unpaidDues.length === 0) {
    return { status: 400, error: 'Tidak ada tagihan bulan ini yang belum dibayar bro..' };
  }

  // Hitung total dari tagihan
  const totalAmount = unpaidDues.reduce((sum, due) => {
    return sum + (due.amount_override || parseInt(amount));
  }, 0);

  // Buat array order_items dari tagihan

  const orderItems = unpaidDues.map((due) => {
    const { billing_periods: period } = due;
    let monthLabel = 'Tanpa Periode';

    if (period && period.month && period.year) {
      const date = new Date(period.year, period.month - 1); // bulan dimulai dari 0
      monthLabel = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    return {
      sku: 'DUES-' + due.id,
      name: 'Iuran Warga - Periode ' + monthLabel,
      price: due.amount_override || parseInt(amount),
      quantity: 1,
      product_url: '',
      image_url: '',
    };
  });


  if (totalAmount === 0 || orderItems.length === 0) {
    return { status: 400, error: 'Total unpaid dues is 0 or empty order items' };
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
    .update(merchantCode + merchantRef + totalAmount)
    .digest('hex');

  const payload = {
    method: 'QRIS',
    merchant_ref: merchantRef,
    amount: totalAmount,
    customer_name: house.name + '/' + house.profiles.full_name,
    customer_email: email,
    customer_phone: phone,
    order_items: orderItems,
    // callback_url: callback_url,
    // expired_time: expiredTime,
    signature
  };
  // const payload = {
  //   method: 'QRISC',
  //   merchant_ref: merchantRef,
  //   amount,
  //   customer_name: house.name + ' / ' + house.profiles.full_name,
  //   customer_email: email,
  //   customer_phone: phone,
  //   order_items: [
  //     {
  //       sku: 'IuranWarga' + house.name,
  //       name: 'Iuran Warga',
  //       price: amount,
  //       quantity: 1,
  //       product_url: '',
  //       image_url: '',
  //     },
  //   ],
  //   return_url: callback_url,
  //   expired_time: expiredTime,
  //   signature
  // };

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

    const tripayData = response.data.data;

    // Simpan ke Supabase
    const { error: insertError } = await client.from('tripay_transactions').insert({
      reference: tripayData.reference,
      merchant_ref: tripayData.merchant_ref,
      payment_method: tripayData.payment_method,
      payment_method_code: tripayData.payment_name, // ganti kalau nama kolom beda
      total_amount: tripayData.amount,
      fee_merchant: tripayData.fee_merchant || 0,
      fee_customer: tripayData.fee_customer || 0,
      total_fee: tripayData.total_fee || 0,
      amount_received: tripayData.amount_received,
      status: tripayData.status,
      is_closed_payment: tripayData.is_closed_payment ?? true,
      paid_at: tripayData.paid_at ? new Date(tripayData.paid_at) : null,
      note: tripayData.note || null,
    });

    if (insertError) {
      console.error("Failed to insert transaction:", insertError);
      return { status: 500, error: 'Transaksi berhasil, tapi gagal menyimpan ke database' };
    }

    // Ambil reference dari response Tripay
    const tripayRef = tripayData.reference;

    // Ambil semua ID profile_dues dari orderItems
    const dueIds = unpaidDues.map(due => due.id);

    // Update masing-masing profile_dues dengan tripay_ref
    const { error: updateError } = await client
      .from('profile_dues')
      .update({ tripay_ref: tripayRef })
      .in('id', dueIds);

    if (updateError) {
      console.error("Gagal mengupdate tripay_ref di profile_dues:", updateError);
      return {
        status: 500,
        error: 'Gagal mengupdate tagihan dengan tripay_ref'
      };
    }
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
