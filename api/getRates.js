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

  const { delivery_postcode, weight, cod } = req.body;
  const pickup_postcode = process.env.ORIGIN_PINCODE || '400001'; // Default or from env

  if (!delivery_postcode || !weight) {
    return res.status(400).json({ error: 'Missing delivery_postcode or weight' });
  }

  try {
    const token = await getShiprocketToken();

    const response = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickup_postcode}&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=${cod ? 1 : 0}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (data.status === 200 && data.data && data.data.available_courier_companies.length > 0) {
      // Find the cheapest courier
      const couriers = data.data.available_courier_companies;
      const cheapest = couriers.reduce((prev, curr) => 
        (prev.rate < curr.rate) ? prev : curr
      );

      return res.status(200).json({
        success: true,
        rate: cheapest.rate,
        estimated_delivery_days: cheapest.etd,
        courier_name: cheapest.courier_name
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Delivery not available for this pincode.',
        fallback_rate: 150 // Fallback flat rate if API fails finding a courier
      });
    }
  } catch (error) {
    console.error('Error fetching rates:', error);
    // In case of API failure, return a sensible fallback instead of breaking checkout
    return res.status(200).json({
      success: true,
      rate: 100, 
      estimated_delivery_days: '3-5 Days',
      courier_name: 'Standard Shipping (Fallback)'
    });
  }
}
