import { getShiprocketToken } from './shiprocketAuth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orderData = req.body;
  
  if (!orderData.billing_customer_name || !orderData.billing_address || !orderData.billing_pincode) {
    return res.status(400).json({ error: 'Missing required customer details' });
  }

  try {
    const token = await getShiprocketToken();

    // Generate a unique order ID for our system
    const orderId = `ALNK-${Date.now().toString().slice(-6)}`;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const shiprocketPayload = {
      order_id: orderId,
      order_date: date,
      pickup_location: process.env.PICKUP_LOCATION_NAME || 'Primary', // Needs to match Shiprocket dashboard
      billing_customer_name: orderData.billing_customer_name,
      billing_last_name: orderData.billing_last_name || '',
      billing_address: orderData.billing_address,
      billing_address_2: orderData.billing_address_2 || '',
      billing_city: orderData.billing_city,
      billing_pincode: orderData.billing_pincode,
      billing_state: orderData.billing_state,
      billing_country: 'India',
      billing_email: orderData.billing_email || 'customer@example.com',
      billing_phone: orderData.billing_phone,
      shipping_is_billing: true,
      order_items: orderData.order_items.map(item => ({
        name: item.name,
        sku: item.sku || 'SKU-001',
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 711319
      })),
      payment_method: 'Prepaid',
      shipping_charges: orderData.shipping_charges || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.sub_total,
      length: orderData.length || 10,
      breadth: orderData.breadth || 10,
      height: orderData.height || 10,
      weight: (orderData.weight || 500) / 1000 // Shiprocket expects weight in KG for order creation
    };

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/ad-hoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shiprocketPayload)
    });

    const data = await response.json();

    if (data.status_code === 1 && data.order_id) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        shiprocket_order_id: data.order_id,
        shipment_id: data.shipment_id
      });
    } else {
      console.error('Shiprocket Order Creation Failed:', data);
      return res.status(400).json({ 
        success: false, 
        error: data.message || 'Failed to create order in Shiprocket'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
