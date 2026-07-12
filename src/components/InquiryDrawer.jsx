import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageSquare, Trash2, Plus, Minus, Send, ShoppingBag, MapPin, Truck, ChevronLeft, CheckCircle } from 'lucide-react';

export default function InquiryDrawer({ isOpen, onClose, selectedItems, onUpdateQuantity, onRemoveItem, whatsappNumber }) {
  const [step, setStep] = useState(1); // 1 = Cart, 2 = Address & Shipping, 3 = Success
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Customer Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  // Shipping Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Shipping & Order state
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Configured WhatsApp Business line passed from settings
  const WHATSAPP_BUSINESS_NUMBER = whatsappNumber || '919876543210';

  // Calculate totals and quantity discounts
  const estimatedTotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeightGram = selectedItems.reduce((acc, item) => acc + ((item.weight_grams || 500) * item.quantity), 0);
  
  const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  let discountPercentage = 0;
  if (totalQuantity >= 3) {
    discountPercentage = 10;
  } else if (totalQuantity === 2) {
    discountPercentage = 5;
  }
  
  const discountAmount = Math.round((estimatedTotal * discountPercentage) / 100);
  const discountedSubtotal = estimatedTotal - discountAmount;
  const grandTotal = discountedSubtotal + shippingCharge;

  // Reset step when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  // Automatically fetch shipping rates when a valid 6-digit pincode is entered
  useEffect(() => {
    if (pincode.length === 6 && step === 2) {
      fetchShippingRates();
    } else {
      setShippingCharge(0);
      setShippingEstimate(null);
    }
  }, [pincode, step]);

  const fetchShippingRates = async () => {
    setIsFetchingRates(true);
    try {
      // Relative path to Vercel API
      const res = await fetch('/api/getRates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_postcode: pincode,
          weight: totalWeightGram / 1000 || 0.5, // Convert to KG
          cod: false
        })
      });
      const data = await res.json();
      if (data.success) {
        setShippingCharge(data.rate);
        setShippingEstimate(data.estimated_delivery_days);
      } else {
        setShippingCharge(150); // Fallback flat rate
        setShippingEstimate('3-5 Business Days');
      }
    } catch (err) {
      console.error(err);
      setShippingCharge(150); // Fallback flat rate
      setShippingEstimate('3-5 Business Days');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !stateName.trim() || pincode.length !== 6) {
      alert('Please fill out all required shipping fields correctly.');
      return;
    }

    setIsCreatingOrder(true);

    try {
      // 1. Create order in Shiprocket via Vercel Backend
      const orderPayload = {
        billing_customer_name: name.trim(),
        billing_address: address.trim(),
        billing_city: city.trim(),
        billing_pincode: pincode.trim(),
        billing_state: stateName.trim(),
        billing_email: email.trim() || 'customer@example.com',
        billing_phone: phone.trim(),
        sub_total: discountedSubtotal,
        shipping_charges: shippingCharge,
        weight: totalWeightGram || 500,
        order_items: selectedItems.map(item => ({
          name: item.title,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const orderData = await res.json();
      const uniqueOrderId = orderData.success ? orderData.order_id : `MANUAL-${Date.now().toString().slice(-6)}`;

      // 2. Build the WhatsApp Handoff Message
      let text = `✨ *Alankara Jewels - Order Placed* ✨\n`;
      text += `------------------------------------\n`;
      text += `🆔 *Order ID:* #${uniqueOrderId}\n\n`;
      text += `👤 *Customer Details:*\nName: ${name.trim()}\nPhone: ${phone.trim()}\n`;
      text += `📍 *Delivery Address:*\n${address.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode}\n\n`;
      
      text += `🛍️ *Order Items:* \n`;
      selectedItems.forEach((item) => {
        text += `• ${item.quantity}x ${item.title} (Ref: ${item.sku})\n`;
        text += `   - ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
      });

      text += `\n📦 *Shipping Charge:* ₹${shippingCharge.toLocaleString('en-IN')}\n`;
      if (discountAmount > 0) {
        text += `🎉 *Bulk Discount (${discountPercentage}% OFF):* -₹${discountAmount.toLocaleString('en-IN')}\n`;
      }
      text += `💵 *Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}\n`;
      
      if (message.trim()) {
        text += `------------------------------------\n`;
        text += `💬 *Note:* "${message.trim()}"\n`;
      }
      
      text += `\nI would like to complete my payment. Please share the payment link!`;

      // 3. Open WhatsApp Web or App
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_BUSINESS_NUMBER}&text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (err) {
      alert("Failed to process order. Please try again.");
      console.error(err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glassmorphic Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(5, 5, 5, 0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 99,
              cursor: 'pointer'
            }}
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: 'rgba(15, 15, 15, 0.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid var(--color-gold-border)',
              zIndex: 100,
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {step === 2 && (
                  <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {step === 1 ? <><ShoppingBag size={20} color="var(--color-gold-metallic)" /> My Shopping Cart</> : 'Shipping Details'}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* List and Form Container */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {step === 1 && (
                <>
                  {selectedItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                      <p style={{ marginBottom: '12px' }}>Your shopping cart is currently empty.</p>
                      <button onClick={onClose} className="btn-outline-gold" style={{ fontSize: '0.7rem', padding: '6px 14px' }}>
                        Browse Masterpieces
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <AnimatePresence initial={false}>
                        {selectedItems.map((item) => (
                          <motion.div
                            key={`${item.id}-${item.selectedImage}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.05)', alignItems: 'center' }}
                          >
                            <img src={item.selectedImage} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.1)' }} />
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'flex-start' }}>
                                <h5 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', margin: '0 0 2px 0', WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                                  {item.title}
                                </h5>
                                <button onClick={() => onRemoveItem(item.id, item.selectedImage)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255, 0, 0, 0.6)' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>SKU: {item.sku}</p>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.08)' }}>
                                  <button onClick={() => onUpdateQuantity(item.id, item.selectedImage, item.quantity - 1)} disabled={item.quantity <= 1} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><Minus size={12} /></button>
                                  <span style={{ fontSize: '0.8rem', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                  <button onClick={() => onUpdateQuantity(item.id, item.selectedImage, item.quantity + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-gold-metallic)', cursor: 'pointer' }}><Plus size={12} /></button>
                                </div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-gold)', fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Contact Information</h4>
                  <input type="text" required placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} className="premium-input" />
                  <input type="tel" required placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} className="premium-input" />
                  <input type="email" placeholder="Email Address (Optional)" value={email} onChange={e => setEmail(e.target.value)} className="premium-input" />

                  <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px', marginBottom: '4px' }}>Shipping Address</h4>
                  <textarea required rows={2} placeholder="Full Address (House, Street, Area) *" value={address} onChange={e => setAddress(e.target.value)} className="premium-input" style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" required placeholder="City *" value={city} onChange={e => setCity(e.target.value)} className="premium-input" style={{ flex: 1 }} />
                    <input type="text" required placeholder="State *" value={stateName} onChange={e => setStateName(e.target.value)} className="premium-input" style={{ flex: 1 }} />
                  </div>
                  <input type="text" required maxLength={6} placeholder="6-Digit Pincode *" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} className="premium-input" />
                  
                  {/* Shipping Rate Display */}
                  {pincode.length === 6 && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--color-gold-border)' }}>
                      {isFetchingRates ? (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Calculating live shipping rates...</p>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Truck size={14} color="var(--color-gold-metallic)"/> Delivery to {pincode}
                            </p>
                            {shippingEstimate && <p style={{ margin: 0, fontSize: '0.7rem', color: '#4ade80' }}>Estimated: {shippingEstimate}</p>}
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-gold-metallic)' }}>
                            {shippingCharge === 0 ? 'FREE' : `+ ₹${shippingCharge}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <textarea rows={2} placeholder="Order Notes (Optional)" value={message} onChange={e => setMessage(e.target.value)} className="premium-input" style={{ resize: 'vertical', marginTop: '8px' }} />
                </form>
              )}
              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '20px', borderRadius: '50%' }}>
                      <CheckCircle size={48} color="#4ade80" />
                    </div>
                  </motion.div>
                  <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--color-gold-metallic)' }}>Order Confirmed!</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Thank you for your purchase, {name.trim()}!<br/>
                    Your payment was successful and your order has been sent to our shipping partner.
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginTop: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>#{createdOrderId}</p>
                  </div>
                  <button onClick={onClose} className="btn-gold" style={{ marginTop: '20px', padding: '12px 32px' }}>
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Footer containing pricing total and submit */}
            {selectedItems.length > 0 && step !== 3 && (
              <div style={{ padding: '24px', borderTop: '1px solid rgba(212, 175, 55, 0.1)', background: 'rgba(5, 5, 5, 0.8)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#4ade80' }}>
                      <span>Bulk Discount ({discountPercentage}% OFF):</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{step === 1 ? 'Subtotal:' : 'Grand Total:'}</span>
                    <span style={{ fontSize: '1.4rem', color: 'var(--color-text-gold)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                      ₹{step === 1 ? discountedSubtotal.toLocaleString('en-IN') : grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {step === 1 ? (
                  <button onClick={() => setStep(2)} className="btn-gold" style={{ width: '100%', padding: '14px 0', fontSize: '0.85rem' }}>
                    Proceed to Checkout
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{
                      fontSize: '0.65rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.4,
                      textAlign: 'center',
                      opacity: 0.8
                    }}>
                      By placing this order, you agree to our <strong>Strict No Refund & No Replacement Policy</strong>. You are guaranteed to receive the exact product shown. Replacements or refunds are only issued in the rare event that an incorrect item is delivered.
                    </p>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isCreatingOrder || isFetchingRates || pincode.length !== 6}
                      className="btn-gold"
                      style={{
                        width: '100%',
                        padding: '14px 0',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        opacity: (isCreatingOrder || isFetchingRates || pincode.length !== 6) ? 0.6 : 1,
                        cursor: (isCreatingOrder || isFetchingRates || pincode.length !== 6) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCreatingOrder ? 'Processing...' : <><CheckCircle size={16} /> Place Order Securely</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
