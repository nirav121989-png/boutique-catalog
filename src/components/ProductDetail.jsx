import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Check, Share2, Sparkles, Truck } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductDetail({ 
  productId, 
  allProducts, 
  selectedItems, 
  onToggleSelect, 
  settings, 
  wishlistItems, 
  onToggleWishlist,
  onProductView
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Find the exact product
  const product = allProducts.find(p => p.id === productId && p.is_available !== false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  // Handle Share
  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/product/${productId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'Alankara Jewels',
          text: `Check out this gorgeous piece from Alankara Jewels!`,
          url: url
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // ----------------------------------------------------
  // PRODUCT NOT FOUND VIEW
  // ----------------------------------------------------
  if (!product) {
    // If we can't find it, maybe try to guess a category from URL or just show general recommendations
    const recommendations = allProducts
      .filter(p => p.is_available !== false)
      .sort(() => 0.5 - Math.random()) // Simple shuffle for variety
      .slice(0, 4);

    return (
      <div className="section-padding" style={{ minHeight: '80vh', textAlign: 'center', paddingTop: '120px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Sparkles size={48} color="var(--color-gold-metallic)" style={{ opacity: 0.5, marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--color-text-primary)' }}>Masterpiece Unavailable</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
            The specific jewelry piece you are looking for is currently unavailable, out of stock, or has been removed from our curated collection. However, we are happy to help you find something equally stunning!
          </p>
          <a href="#/" className="btn-gold" style={{ textDecoration: 'none', display: 'inline-flex', marginBottom: '60px' }}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Return to Collection
          </a>
        </motion.div>

        {recommendations.length > 0 && (
          <div style={{ marginTop: '40px', borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '60px' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-gold-champagne)', marginBottom: '30px' }}>Discover Similar Masterpieces</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '30px',
              textAlign: 'left'
            }}>
              {recommendations.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  selectedItems={selectedItems}
                  onToggleSelect={onToggleSelect}
                  settings={settings}
                  wishlistItems={wishlistItems}
                  onToggleWishlist={onToggleWishlist}
                  onProductView={onProductView}
                  allProducts={allProducts}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // PRODUCT FOUND VIEW
  // ----------------------------------------------------
  const defaultPlaceholder = settings?.product_fallback_image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80';
  let productImages = product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  if (productImages.length === 0) productImages = [defaultPlaceholder];
  const activeImageUrl = productImages[currentImgIndex];
  
  const isCurrentSelected = selectedItems.some(
    (item) => item.id === product.id && item.selectedImage === activeImageUrl
  );

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  
  const stockQty = product.stock_qty !== undefined ? product.stock_qty : 999;
  const isOutOfStock = stockQty === 0;

  // Find Similar Products in same category
  const similarProducts = allProducts
    .filter(p => p.id !== product.id && p.category === product.category && p.is_available !== false)
    .slice(0, 4);

  return (
    <div className="section-padding" style={{ paddingTop: '100px' }}>
      
      {/* Back Button */}
      <a href="#/catalog" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '40px',
        transition: 'color 0.3s ease'
      }} onMouseEnter={e => e.target.style.color = 'var(--color-gold-metallic)'} onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}>
        <ArrowLeft size={16} /> Back to Catalog
      </a>

      {/* Product Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '60px', alignItems: 'start' }}>
        
        {/* Left: Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--color-gold-border)',
            background: '#0F0F0F',
            position: 'relative'
          }}>
            <motion.img
              key={currentImgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={activeImageUrl}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }}
            />
            {product.is_latest && (
              <span style={{
                position: 'absolute', top: '20px', left: '20px',
                background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)',
                color: '#000', padding: '6px 12px', fontSize: '0.7rem',
                fontWeight: 800, borderRadius: '4px', textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Latest Edition
              </span>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          {productImages.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
              {productImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImgIndex(idx)}
                  style={{
                    width: '80px', height: '80px',
                    borderRadius: '8px',
                    border: currentImgIndex === idx ? '2px solid var(--color-gold-metallic)' : '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: '#0F0F0F',
                    flexShrink: 0,
                    opacity: currentImgIndex === idx ? 1 : 0.6,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <p style={{ color: 'var(--color-gold-metallic)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>
              {product.category} {product.subcategory ? `> ${product.subcategory}` : ''}
            </p>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-header)', lineHeight: 1.2, margin: '0 0 16px 0' }}>
              {product.title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-gold)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', textDecoration: 'line-through', marginBottom: '6px' }}>
                    ₹{product.compare_at_price.toLocaleString('en-IN')}
                  </span>
                  <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                    ({discountPercentage}% OFF)
                  </span>
                </>
              )}
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={14} color="var(--color-gold-metallic)" /> Free Shipping Estimate Available at Checkout
            </p>
          </div>

          <div style={{ height: '1px', background: 'rgba(212,175,55,0.1)' }} />

          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
              Masterpiece Details
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
            {product.sku && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>SKU Code</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{product.sku}</span>
              </div>
            )}
            {product.purity && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Plating / Purity</span>
                <span style={{ fontWeight: 600, color: 'var(--color-gold-champagne)' }}>{product.purity}</span>
              </div>
            )}
            {product.weight_gram && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Weight</span>
                <span>{product.weight_gram} g</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
             <button
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(product, activeImageUrl);
                }}
                className="btn-gold"
                style={{ 
                  width: '100%', 
                  padding: '16px 0', 
                  fontSize: '1rem',
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : isCurrentSelected ? (
                  <><Check size={20} /> Remove from Cart</>
                ) : (
                  <><ShoppingBag size={20} /> Add to Cart</>
                )}
              </button>

              <button
                onClick={handleShare}
                className="btn-outline-gold"
                style={{ width: '100%', padding: '14px 0' }}
              >
                {copySuccess ? <><Check size={18} /> Link Copied!</> : <><Share2 size={18} /> Share This Design</>}
              </button>
          </div>

        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div style={{ marginTop: '100px', borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '60px' }}>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-header)', textAlign: 'center', marginBottom: '40px', color: 'var(--color-gold-champagne)' }}>
            You May Also Like
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {similarProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                selectedItems={selectedItems}
                onToggleSelect={onToggleSelect}
                settings={settings}
                wishlistItems={wishlistItems}
                onToggleWishlist={onToggleWishlist}
                onProductView={onProductView}
                allProducts={allProducts}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global media queries for deep linking mobile view handled here via style block just for layout tweaks */}
      <style>{`
        @media (max-width: 768px) {
          .section-padding > div:nth-child(2) {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
