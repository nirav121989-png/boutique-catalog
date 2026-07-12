import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Eye, X, Send, ShoppingBag, Share2, Link, ZoomIn, Heart, MapPin } from 'lucide-react';

export default function ProductCard({ product, selectedItems, onToggleSelect, settings, wishlistItems = [], onToggleWishlist, onProductView, allProducts = [] }) {
  const { id, title, sku, category, description, price, compare_at_price, purity, image_url, images } = product;

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Resolve multiple images list, fallback to placeholder if empty
  const defaultPlaceholder = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80';
  let productImages = images && images.length > 0 ? images : (image_url ? [image_url] : []);
  if (productImages.length === 0) productImages = [defaultPlaceholder];
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Reset image index if product properties change
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [product]);

  const activeImageUrl = productImages[currentImgIndex];
  
  const handleOpenQuickView = () => {
    setIsDetailModalOpen(true);
    if (onProductView) onProductView(id);
  };

  // Track if this specific image design variation is currently selected
  const isCurrentSelected = selectedItems.some(
    (item) => item.id === id && item.selectedImage === activeImageUrl
  );

  // Calculate discount percentage if there's a compare price
  const hasDiscount = compare_at_price && compare_at_price > price;
  const discountPercentage = hasDiscount 
    ? Math.round(((compare_at_price - price) / compare_at_price) * 100) 
    : 0;

  // Stock availability derived from stock_qty field
  const stockQty = product.stock_qty !== undefined ? product.stock_qty : 999;
  const isOutOfStock = stockQty === 0;
  const isLowStock = !isOutOfStock && stockQty > 0 && stockQty <= 3;

  const isWishlisted = wishlistItems.includes(id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        border: isCurrentSelected 
          ? '1px solid var(--color-gold-metallic)' 
          : '1px solid var(--color-gold-border)',
        boxShadow: isCurrentSelected 
          ? '0 0 15px rgba(212, 175, 55, 0.15)' 
          : '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Wishlist Button (Top Right) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleWishlist) onToggleWishlist(id);
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          background: 'rgba(15,15,15,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(4px)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.8)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = 'rgba(15,15,15,0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(15,15,15,0.6)';
        }}
      >
        <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} />
      </button>

      {/* Share Button (Top Right, below Wishlist) */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const productUrl = `${window.location.origin}${window.location.pathname}#/product/${product.id}`;
          if (navigator.share) {
            try {
              await navigator.share({
                title: product?.title || 'Alankara Jewels',
                text: `Check out this gorgeous piece from Alankara Jewels!`,
                url: productUrl
              });
              return;
            } catch (err) {}
          }
          try {
            await navigator.clipboard.writeText(productUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } catch (err) {}
        }}
        style={{
          position: 'absolute',
          top: '52px',
          right: '12px',
          zIndex: 10,
          background: 'rgba(15,15,15,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(4px)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: copySuccess ? '#4ade80' : 'rgba(255,255,255,0.8)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = 'rgba(15,15,15,0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(15,15,15,0.6)';
        }}
      >
        {copySuccess ? <Check size={14} /> : <Share2 size={14} />}
      </button>

      {/* Badges Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {/* Latest Badge */}
        {product.is_latest && (
          <span style={{
            background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)',
            color: '#000000',
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-header)',
            fontWeight: 800,
            borderRadius: '4px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            Latest
          </span>
        )}

        {/* Custom Glowing Offer Badges */}
        {product.offer_type && product.offer_type !== 'none' ? (
          <>
            {product.offer_type === 'bogo' && (
              <span style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: '#FFFFFF',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-header)',
                fontWeight: 800,
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)',
                display: 'inline-block',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                Buy 1 Get 1
              </span>
            )}
            {product.offer_type === 'discount' && discountPercentage > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                color: '#000000',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-header)',
                fontWeight: 800,
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                display: 'inline-block',
                textAlign: 'center'
              }}>
                {discountPercentage}% OFF
              </span>
            )}
            {product.offer_type === 'flat' && (
              <span style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                color: '#000000',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-header)',
                fontWeight: 800,
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                display: 'inline-block',
                textAlign: 'center'
              }}>
                {product.offer_tag}
              </span>
            )}
            {product.offer_type === 'free_gift' && (
              <span style={{
                background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                color: '#FFFFFF',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-header)',
                fontWeight: 800,
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                display: 'inline-block',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                FREE GIFT
              </span>
            )}
            {product.offer_type === 'custom' && product.offer_tag && (
              <span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
                color: '#FFFFFF',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-header)',
                fontWeight: 800,
                borderRadius: '4px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(79, 70, 229, 0.5)',
                display: 'inline-block',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                {product.offer_tag}
              </span>
            )}
          </>
        ) : (
          /* Fallback older discount badge */
          hasDiscount && (
            <span style={{
              background: 'var(--color-gold-metallic)',
              color: '#000000',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              borderRadius: '4px',
              letterSpacing: '0.03em'
            }}>
              {discountPercentage}% OFF
            </span>
          )
        )}

        {/* Plating/Type Tag */}
        {purity && (
          <span style={{
            background: 'rgba(6, 6, 6, 0.85)',
            border: '1px solid var(--color-gold-border)',
            color: 'var(--color-gold-champagne)',
            padding: '4px 10px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-header)',
            fontWeight: 700,
            borderRadius: '4px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            {purity}
          </span>
        )}
      </div>

      {/* Product Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%', // 1:1 Aspect Ratio
        overflow: 'hidden',
        background: '#0a0a0a'
      }}>
        <motion.div
          key={currentImgIndex}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          onClick={handleOpenQuickView}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url('${activeImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer'
          }}
        />

        {/* Subtle Quick View eye icon overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <div style={{
            background: 'rgba(15, 15, 15, 0.75)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            color: 'var(--color-gold-champagne)',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            <Eye size={14} />
          </div>
        </div>

        {/* Selected Backdrop indicator */}
        <AnimatePresence>
          {isCurrentSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(13, 13, 13, 0.4)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <motion.div
                initial={{ scale: 0.7, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.7, rotate: 45 }}
                transition={{ type: 'spring', damping: 15 }}
                style={{
                  background: 'var(--color-gold-metallic)',
                  borderRadius: '50%',
                  padding: '12px',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                }}
              >
                <Check size={28} color="#000000" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Multi-Image Design Thumbnails Navigation Row */}
      {productImages.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 16px 0 16px',
          background: 'rgba(15,15,15,0.4)',
          overflowX: 'auto',
          alignItems: 'center',
          scrollbarWidth: 'none'
        }}>
          {productImages.map((img, index) => {
            const isThumbnailActive = currentImgIndex === index;
            return (
              <img
                key={index}
                src={img}
                alt={`${title} design option ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex(index);
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: isThumbnailActive
                    ? '2px solid var(--color-gold-metallic)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  opacity: isThumbnailActive ? 1 : 0.6,
                  transition: 'var(--transition-fast)'
                }}
              />
            );
          })}
        </div>
      )}

      {/* Details Container */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div>
          {/* Category & SKU Reference */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginBottom: '6px',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.05em'
          }}>
            <span>
              {category} {product.subcategory ? `• ${product.subcategory}` : ''}
              {product.collection_line && (
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-gold-metallic)',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.08em'
                }}>
                  {product.collection_line} Collection
                </div>
              )}
            </span>
            <span style={{ color: 'var(--color-gold-champagne)', fontWeight: 500 }}>{sku}</span>
          </div>

          {/* Title */}
          <h3
            onClick={handleOpenQuickView}
            style={{
              fontSize: '1.05rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gold-champagne)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          >
            {title} {productImages.length > 1 && `(Design #${currentImgIndex + 1})`}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            fontWeight: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '10px'
          }}>
            {description}
          </p>
        </div>

        {/* Pricing & Inquiry CTA */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-text-gold)',
              fontFamily: 'var(--font-body)'
            }}>
              ₹{price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span style={{
                fontSize: '0.9rem',
                textDecoration: 'line-through',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)'
              }}>
                ₹{compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Low Stock Warning Badge */}
          {isLowStock && !isCurrentSelected && (
            <div style={{
              textAlign: 'center',
              marginBottom: '6px',
              padding: '3px 8px',
              background: 'rgba(250,170,50,0.08)',
              border: '1px solid rgba(250,170,50,0.25)',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'rgba(250,170,50,0.95)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              ⚡ Only {stockQty} piece{stockQty > 1 ? 's' : ''} left!
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => !isOutOfStock && onToggleSelect(product, activeImageUrl)}
            disabled={isOutOfStock}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 0',
              fontFamily: 'var(--font-header)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              transition: 'var(--transition-fast)',
              border: isOutOfStock
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : isCurrentSelected 
                  ? '1px solid rgba(255, 255, 255, 0.15)' 
                  : '1px solid var(--color-gold-metallic)',
              background: isOutOfStock
                ? 'rgba(255, 255, 255, 0.03)'
                : isCurrentSelected 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'transparent',
              color: isOutOfStock
                ? 'rgba(255, 255, 255, 0.25)'
                : isCurrentSelected 
                  ? 'var(--color-text-primary)' 
                  : 'var(--color-gold-metallic)',
              opacity: isOutOfStock ? 0.6 : 1
            }}
          >
            {isOutOfStock ? (
              <>
                <span style={{ fontSize: '12px' }}>✕</span> Out of Stock
              </>
            ) : isCurrentSelected ? (
              <>
                <Check size={14} /> In Cart
              </>
            ) : (
              <>
                <Plus size={14} /> Add to Cart
              </>
            )}
          </button>
        </div>

      </div>

      {/* Quick View Detail Modal Overlay */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(5, 5, 5, 0.85)',
                backdropFilter: 'blur(12px)',
                zIndex: 999,
                cursor: 'pointer'
              }}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '750px',
                maxHeight: '90vh',
                background: 'rgba(15, 15, 15, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--color-gold-border)',
                borderRadius: '12px',
                zIndex: 1000,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: 'rgba(15, 15, 15, 0.98)',
                zIndex: 10
              }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-gold-champagne)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Signature Masterpiece
                </h4>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Content */}
              <div style={{
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                flexGrow: 1
              }}>
                {/* Left: Beautiful Image Carousel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    onClick={() => setIsZoomOpen(true)}
                    title="Click to zoom"
                    style={{
                      position: 'relative',
                      paddingTop: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(212,175,55,0.15)',
                      cursor: 'zoom-in'
                    }}
                  >
                    <img
                      src={activeImageUrl}
                      alt={title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.35s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                    {/* Zoom hint badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                      padding: '3px 7px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.65)',
                      pointerEvents: 'none'
                    }}>
                      <ZoomIn size={10} /> Click to zoom
                    </div>
                  </div>

                  {/* Thumbnail slider */}
                  {productImages.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                      {productImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${title} option ${idx + 1}`}
                          onClick={() => setCurrentImgIndex(idx)}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: currentImgIndex === idx ? '2px solid var(--color-gold-metallic)' : '1px solid rgba(255,255,255,0.1)',
                            opacity: currentImgIndex === idx ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Detailed Info */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
                  <div>
                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {product.is_latest && (
                        <span style={{ background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)', color: '#000000', padding: '2px 8px', fontSize: '0.6rem', fontWeight: 800, borderRadius: '3px', textTransform: 'uppercase' }}>
                          Latest
                        </span>
                      )}
                      {product.offer_type && product.offer_type !== 'none' && (
                        <span style={{
                          background: product.offer_type === 'bogo' ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 
                                     (product.offer_type === 'free_gift' ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)' : 
                                     (product.offer_type === 'discount' || product.offer_type === 'flat' ? 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)' : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)')),
                          color: (product.offer_type === 'discount' || product.offer_type === 'flat') ? '#000000' : '#FFFFFF',
                          padding: '2px 8px',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          borderRadius: '3px',
                          textTransform: 'uppercase'
                        }}>
                          {product.offer_type === 'bogo' ? 'BOGO' : (product.offer_type === 'free_gift' ? 'FREE GIFT' : (product.offer_type === 'discount' ? `${discountPercentage}% OFF` : product.offer_tag))}
                        </span>
                      )}
                      {product.collection_line && (
                        <span style={{ border: '1px solid var(--color-gold-metallic)', color: 'var(--color-gold-champagne)', padding: '1px 8px', fontSize: '0.6rem', fontWeight: 600, borderRadius: '3px', textTransform: 'uppercase' }}>
                          {product.collection_line}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.4rem', color: '#FFFFFF', margin: '0 0 4px 0', lineHeight: 1.3 }}>{title}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
                      Ref SKU: <strong style={{ color: 'var(--color-gold-champagne)' }}>{sku}</strong> | Purity: <strong>{purity}</strong>
                    </p>

                    {/* Price Block */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-gold)' }}>₹{price.toLocaleString('en-IN')}</span>
                      {hasDiscount && (
                        <>
                          <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>₹{compare_at_price.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-champagne)', fontWeight: 600 }}>({discountPercentage}% Saved)</span>
                        </>
                      )}
                    </div>

                    <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 6px 0', letterSpacing: '0.05em' }}>Description</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{description}</p>
                    
                    {/* Pincode Checker */}
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 10px 0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--color-gold-metallic)" /> Check Delivery Date
                      </h5>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit Pincode"
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value.replace(/\D/g, ''));
                            setPincodeStatus(null);
                          }}
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--color-gold-border)',
                            color: '#FFFFFF',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            if (pincode.length !== 6) return;
                            setPincodeStatus('checking');
                            setTimeout(() => {
                              setPincodeStatus('success');
                            }, 800);
                          }}
                          disabled={pincode.length !== 6 || pincodeStatus === 'checking'}
                          style={{
                            background: pincode.length === 6 ? 'var(--color-gold-metallic)' : 'rgba(255,255,255,0.1)',
                            color: pincode.length === 6 ? '#000000' : 'rgba(255,255,255,0.4)',
                            border: 'none',
                            padding: '0 16px',
                            borderRadius: '4px',
                            cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {pincodeStatus === 'checking' ? 'Checking...' : 'Check'}
                        </button>
                      </div>
                      {pincodeStatus === 'success' && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} /> Delivery available! Expected in 3-5 business days.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                    {/* Add to Cart Button */}
                    <button
                      onClick={() => onToggleSelect(product, activeImageUrl)}
                      className="btn-gold"
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: isCurrentSelected ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-gold-metallic)',
                        color: isCurrentSelected ? '#FFFFFF' : '#000000',
                        border: isCurrentSelected ? '1px solid rgba(255,255,255,0.2)' : 'none'
                      }}
                    >
                      {isCurrentSelected ? (
                        <>
                          <Check size={16} /> In Cart (Remove)
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} /> Add to Shopping Cart
                        </>
                      )}
                    </button>

                    {/* Instantly Inquire / Single Item WhatsApp Order */}
                    <button
                      onClick={() => {
                        const WHATSAPP_NUMBER = settings?.whatsapp_number || '919876543210';
                        const designIndex = productImages.indexOf(activeImageUrl) + 1;
                        const designLabel = productImages.length > 1 ? ` (Design #${designIndex})` : '';
                        
                        let msg = `✨ *Alankara Jewels - Instant Order* ✨\n`;
                        msg += `------------------------------------\n`;
                        msg += `🛍️ *Item:* ${title}${designLabel}\n`;
                        msg += `🏷️ *Ref SKU:* ${sku}\n`;
                        msg += `🔑 *Category:* ${category}${product.subcategory ? ` • ${product.subcategory}` : ''}\n`;
                        if (product.offer_type && product.offer_type !== 'none') {
                          msg += `🎁 *Offer:* ${product.offer_tag}\n`;
                        }
                        msg += `💵 *Price:* ₹${price.toLocaleString('en-IN')}\n\n`;
                        msg += `Please confirm availability and booking details.`;
                        
                        window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="btn-outline-gold"
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Send size={14} /> Instant Order via WhatsApp
                    </button>

                    {/* Share Row */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {/* Share on WhatsApp */}
                      <button
                        onClick={() => {
                          const designIndex = productImages.indexOf(activeImageUrl) + 1;
                          const designLabel = productImages.length > 1 ? ` (Design #${designIndex})` : '';
                          const productUrl = `${window.location.origin}${window.location.pathname}#/product/${product.id}`;
                          const shareMsg = `✨ Check out this gorgeous piece from Alankara Jewels!\n\n💍 *${title}${designLabel}*\n💵 Price: ₹${price.toLocaleString('en-IN')}\n\nShop here: ${productUrl}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, '_blank');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'rgba(37,211,102,0.08)',
                          border: '1px solid rgba(37,211,102,0.25)',
                          color: 'rgb(37,211,102)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)'; }}
                      >
                        <Share2 size={12} /> Share
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={() => {
                          const productUrl = `${window.location.origin}${window.location.pathname}#/product/${product.id}`;
                          navigator.clipboard.writeText(productUrl).then(() => {
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2500);
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: copySuccess ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${copySuccess ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: copySuccess ? 'rgb(34,197,94)' : 'var(--color-text-muted)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Link size={12} /> {copySuccess ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* You May Also Like Section */}
              {allProducts && allProducts.length > 0 && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--color-gold-champagne)', margin: '0 0 16px 0', letterSpacing: '0.05em', textTransform: 'uppercase', borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '24px' }}>
                    You May Also Like
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    paddingBottom: '12px'
                  }}>
                    {allProducts
                      .filter(p => p.id !== id && p.category === category && p.is_available !== false)
                      .slice(0, 4)
                      .map(related => (
                        <div key={related.id} style={{ minWidth: '160px', flex: '0 0 160px' }}>
                          <div 
                            style={{ 
                              position: 'relative', 
                              paddingTop: '100%', 
                              borderRadius: '6px', 
                              overflow: 'hidden', 
                              border: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setIsDetailModalOpen(false); // Close current modal
                              // Since we don't have a routing system that handles modals natively,
                              // clicking this will just close the modal for now. 
                              // Ideally, you would push to a route or open the new modal.
                            }}
                          >
                            <img 
                              src={related.image_url || (related.images && related.images[0])} 
                              alt={related.title}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#FFF', margin: '8px 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {related.title}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-gold)', margin: 0, fontWeight: 600 }}>
                            ₹{related.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Zoom Overlay */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.95)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              src={activeImageUrl}
              alt={title}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 0 60px rgba(212,175,55,0.1)',
                cursor: 'default'
              }}
            />
            {/* Close hint */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }} onClick={() => setIsZoomOpen(false)}>
              <X size={16} /> Close
            </div>
            {/* Design indicator */}
            {productImages.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px'
              }}>
                {productImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(idx); }}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: currentImgIndex === idx ? 'var(--color-gold-metallic)' : 'rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
