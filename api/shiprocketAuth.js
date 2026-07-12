// api/shiprocketAuth.js
// This file runs on the Vercel Server, completely hidden from the browser.

let cachedToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
  // If we have a valid cached token, return it to save API calls
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing Shiprocket credentials in environment variables.');
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Shiprocket');
    }

    const data = await response.json();
    cachedToken = data.token;
    
    // Token is usually valid for 10 days, we'll cache it for 24 hours to be safe
    tokenExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error);
    throw error;
  }
}
