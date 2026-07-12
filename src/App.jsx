import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Lock, ExternalLink, Sparkles, Mail, MapPin, ArrowUp } from 'lucide-react';
import { db } from './db/db';
import HeroSection from './components/HeroSection';
import Catalog from './components/Catalog';
import AdminPanel from './components/AdminPanel';
import InquiryDrawer from './components/InquiryDrawer';
import ProductCard from './components/ProductCard';

export default function App() {
  // Restore cart from localStorage on first load (cart persistence across page refreshes)
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('alankara_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Wishlist and Recently Viewed State
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('alankara_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('alankara_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load products inventory and boutique settings on mount via Firestore real-time listeners
  useEffect(() => {
    let productsLoaded = false;
    let settingsLoaded = false;

    const checkLoading = () => {
      if (productsLoaded && settingsLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeProducts = db.subscribeItems((items) => {
      setProducts(items);
      productsLoaded = true;
      checkLoading();
    });
    
    const unsubscribeSettings = db.subscribeSettings((boutiqueSettings) => {
      setSettings(boutiqueSettings);
      settingsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  // Save states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('alankara_cart', JSON.stringify(selectedItems));
    } catch { /* ignore */ }
  }, [selectedItems]);

  useEffect(() => {
    try {
      localStorage.setItem('alankara_wishlist', JSON.stringify(wishlistItems));
    } catch { /* ignore */ }
  }, [wishlistItems]);

  useEffect(() => {
    try {
      localStorage.setItem('alankara_recent', JSON.stringify(recentlyViewed));
    } catch { /* ignore */ }
  }, [recentlyViewed]);

  // Track scroll position for scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to hash changes for robust CDN static routing
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Selection Drawer state management functions
  // Tracks items uniquely by product ID and selected variation image URL
  const handleToggleSelect = (product, activeImageUrl) => {
    setSelectedItems((prev) => {
      const exists = prev.find(
        (item) => item.id === product.id && item.selectedImage === activeImageUrl
      );
      if (exists) {
        // Remove specific variation if already selected
        return prev.filter(
          (item) => !(item.id === product.id && item.selectedImage === activeImageUrl)
        );
      } else {
        // Add new variation selection with initial quantity of 1
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image_url];
        // Open shopping cart drawer instantly for smooth user feedback
        setIsDrawerOpen(true);
        return [
          ...prev,
          { 
            ...product, 
            images: productImages, 
            selectedImage: activeImageUrl, 
            quantity: 1 
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (id, selectedImage, newQty) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedImage === selectedImage
          ? { ...item, quantity: Math.max(1, newQty) }
          : item
      )
    );
  };

  const handleRemoveItem = (id, selectedImage) => {
    setSelectedItems((prev) =>
      prev.filter((item) => !(item.id === id && item.selectedImage === selectedImage))
    );
  };

  // Wishlist and Recently Viewed Handlers
  const handleToggleWishlist = (productId) => {
    setWishlistItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleRecordView = (productId) => {
    setRecentlyViewed((prev) => {
      const updated = prev.filter((id) => id !== productId);
      updated.unshift(productId); // Add to beginning
      return updated.slice(0, 10); // Keep only top 10
    });
  };

  // Toggle drawer open/close
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  // Router resolution
  const hashBase = currentHash.split('?')[0] || '#/';
  const queryParams = new URLSearchParams(currentHash.split('?')[1] || '');
  const isAdminView = hashBase === '#/admin';
  const isCatalogView = hashBase === '#/catalog';
  const isHomeView = !isAdminView && !isCatalogView;
  const initialCategory = queryParams.get('category') || 'All';

  // Calculate items quantity count in shopping bag
  const totalItemCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  // Showcase Filter lists for the Curated Homepage
  const activeProducts = products.filter(p => p.is_available !== false);
  const latestProducts = activeProducts.filter(p => p.is_latest === true);
  const exclusiveProducts = activeProducts.filter(p => p.is_exclusive === true);
  const offeredProducts = activeProducts.filter(p => p.compare_at_price && p.compare_at_price > p.price);

  const categoriesToShow = (settings?.categories && settings.categories.length > 0)
    ? [...settings.categories].sort((a, b) => a.priority - b.priority)
    : [
        { id: '1', name: 'Necklaces', priority: 1 },
        { id: '2', name: 'Rings', priority: 2 },
        { id: '3', name: 'Bracelets', priority: 3 },
        { id: '4', name: 'Earrings', priority: 4 }
      ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#040404',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(212,175,55,0.1)',
            borderTop: '2px solid var(--color-gold-metallic)',
            borderRadius: '50%'
          }}
        />
        <p style={{
          fontFamily: 'var(--font-header)',
          color: 'var(--color-gold-champagne)',
          letterSpacing: '0.15em',
          fontSize: '0.9rem',
          textTransform: 'uppercase'
        }}>
          Unveiling Masterpieces...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Premium Glassmorphic Header Navbar */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        margin: '16px 5%',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(10, 10, 10, 0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: '12px'
      }}>
        {/* Brand Logo - Dynamic Image or Text */}
        <a href="#/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {settings?.logo_type === 'image' && settings?.logo_image_url ? (
            <img 
              src={settings.logo_image_url} 
              alt={settings.logo_text || 'Alankara Jewels Logo'} 
              style={{
                maxHeight: '36px',
                width: 'auto',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          ) : (
            <>
              <Sparkles size={18} color="var(--color-gold-metallic)" className="floating-element" />
              <h1 style={{
                fontSize: '1.1rem',
                margin: 0,
                color: '#FFFFFF',
                fontWeight: 800,
                letterSpacing: '0.15em'
              }}>
                <span className="text-gold-gradient">{settings?.logo_text || 'ALANKARA JEWELS'}</span>
              </h1>
            </>
          )}
        </a>

        {/* Navigation Action Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {isAdminView ? (
            <a 
              href="#/" 
              style={{
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'var(--transition-fast)'
              }}
            >
              Browse Shop <ExternalLink size={12} />
            </a>
          ) : (
            <>
              <a 
                href="#/" 
                style={{
                  color: currentHash === '#/' || currentHash === '' ? 'var(--color-gold-champagne)' : 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = currentHash === '#/' || currentHash === '' ? 'var(--color-gold-champagne)' : 'var(--color-text-muted)'}
              >
                Home
              </a>
              <a 
                href="#/catalog" 
                style={{
                  color: currentHash.startsWith('#/catalog') ? 'var(--color-gold-champagne)' : 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = currentHash.startsWith('#/catalog') ? 'var(--color-gold-champagne)' : 'var(--color-text-muted)'}
              >
                Catalog
              </a>
              <a 
                href="#/admin" 
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
              >
                Admin Vault <Lock size={12} />
              </a>
            </>
          )}

          {/* Floating Selected Cart Icon with bounce badge */}
          {!isAdminView && (
            <button
              onClick={toggleDrawer}
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid var(--color-gold-border)',
                color: 'var(--color-gold-metallic)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 10px var(--color-gold-glow)';
                e.currentTarget.style.borderColor = 'var(--color-gold-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--color-gold-border)';
              }}
            >
              <ShoppingBag size={18} />
              
              {/* Bouncy Count Badge */}
              <AnimatePresence>
                {totalItemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)',
                      color: '#000000',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {totalItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </header>

      {/* Main Container Views */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {isAdminView && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdminPanel 
                products={products} 
                settings={settings}
                onUpdateProducts={setProducts} 
                onUpdateSettings={setSettings}
              />
            </motion.div>
          )}

          {isCatalogView && (
            <motion.div
              key="catalog-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Catalog 
                products={products} 
                settings={settings}
                selectedItems={selectedItems} 
                onToggleSelect={handleToggleSelect} 
                initialCategory={initialCategory}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
                onProductView={handleRecordView}
              />
            </motion.div>
          )}

          {isHomeView && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection 
                logoText={settings?.logo_text}
                tagline={settings?.about_text}
              />
              
              {/* Latest Collection showcase section */}
              {latestProducts.length > 0 && (
                <section className="section-padding" style={{ background: '#080808', borderTop: '1px solid rgba(212,175,55,0.05)', padding: '60px 0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p className="sub-header" style={{ marginBottom: '8px' }}>Newly Unveiled</p>
                    <h2 style={{ fontSize: '2rem' }}>Latest Collection</h2>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px',
                    padding: '0 5%'
                  }}>
                    {latestProducts.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        selectedItems={selectedItems}
                        onToggleSelect={handleToggleSelect}
                        settings={settings}
                        wishlistItems={wishlistItems}
                        onToggleWishlist={handleToggleWishlist}
                        onProductView={handleRecordView}
                        allProducts={products}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Exclusive Showcase Section */}
              {exclusiveProducts.length > 0 && (
                <section className="section-padding" style={{ background: '#040404', borderTop: '1px solid rgba(212,175,55,0.05)', padding: '60px 0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p className="sub-header" style={{ marginBottom: '8px' }}>Royal Masterpieces</p>
                    <h2 style={{ fontSize: '2rem' }}>Exclusive Showcase</h2>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px',
                    padding: '0 5%'
                  }}>
                    {exclusiveProducts.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        selectedItems={selectedItems}
                        onToggleSelect={handleToggleSelect}
                        settings={settings}
                        wishlistItems={wishlistItems}
                        onToggleWishlist={handleToggleWishlist}
                        onProductView={handleRecordView}
                        allProducts={products}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Today's Special Offers */}
              {offeredProducts.length > 0 && (
                <section className="section-padding" style={{ background: '#080808', borderTop: '1px solid rgba(212,175,55,0.05)', padding: '60px 0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p className="sub-header" style={{ marginBottom: '8px' }}>Promotional Value</p>
                    <h2 style={{ fontSize: '2rem' }}>Today's Special Offers</h2>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px',
                    padding: '0 5%'
                  }}>
                    {offeredProducts.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        selectedItems={selectedItems}
                        onToggleSelect={handleToggleSelect}
                        settings={settings}
                        wishlistItems={wishlistItems}
                        onToggleWishlist={handleToggleWishlist}
                        onProductView={handleRecordView}
                        allProducts={products}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Shop by Category Section */}
              <section className="section-padding" style={{ background: '#040404', borderTop: '1px solid rgba(212,175,55,0.05)', padding: '60px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <p className="sub-header" style={{ marginBottom: '8px' }}>Explore Categories</p>
                  <h2 style={{ fontSize: '2rem' }}>Shop By Design</h2>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '24px',
                  padding: '0 5%',
                  marginBottom: '40px'
                }}>
                  {categoriesToShow.map((cat) => {
                    const count = products.filter(p => p.category === cat.name && p.is_available !== false).length;
                    const repProduct = products.find(p => p.category === cat.name && p.image_url);
                    const imageUrl = cat.image_url || repProduct?.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80';
                    
                    return (
                      <a
                        key={cat.id || cat.name}
                        href={`#/catalog?category=${encodeURIComponent(cat.name)}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <motion.div
                          whileHover={{ y: -6, scale: 1.02 }}
                          className="glass-panel"
                          style={{
                            height: '180px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            border: '1px solid var(--color-gold-border)'
                          }}
                        >
                          <div 
                            style={{
                              position: 'absolute',
                              top: 0, right: 0, bottom: 0, left: 0,
                              backgroundImage: `url(${imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              opacity: 0.15,
                              transition: 'opacity 0.4s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = 0.35}
                            onMouseLeave={(e) => e.target.style.opacity = 0.15}
                          />
                          <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', zIndex: 2, marginBottom: '6px', textAlign: 'center' }}>
                            {cat.name}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-champagne)', zIndex: 2, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                            {count} {count === 1 ? 'Design' : 'Designs'}
                          </span>
                        </motion.div>
                      </a>
                    );
                  })}
                </div>
                
                {/* Browse All CTA */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <a href="#/catalog" className="btn-gold" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                    Browse All Collection
                  </a>
                </div>
              </section>

              {/* Recently Viewed Section */}
              {recentlyViewed.length > 0 && (
                <section className="section-padding" style={{ background: '#080808', borderTop: '1px solid rgba(212,175,55,0.05)', padding: '60px 0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p className="sub-header" style={{ marginBottom: '8px' }}>Your Journey</p>
                    <h2 style={{ fontSize: '2rem' }}>Recently Viewed</h2>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    padding: '0 5% 20px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    scrollSnapType: 'x mandatory'
                  }}>
                    {recentlyViewed
                      .map(id => products.find(p => p.id === id))
                      .filter(Boolean)
                      .map((product) => (
                        <div key={product.id} style={{ minWidth: '280px', scrollSnapAlign: 'start' }}>
                          <ProductCard
                            product={product}
                            selectedItems={selectedItems}
                            onToggleSelect={handleToggleSelect}
                            settings={settings}
                            wishlistItems={wishlistItems}
                            onToggleWishlist={handleToggleWishlist}
                            onProductView={handleRecordView}
                            allProducts={products}
                          />
                        </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Inquiry Drawer Component - Dynamic WhatsApp receiver */}
      <InquiryDrawer
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        selectedItems={selectedItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        whatsappNumber={settings?.whatsapp_number}
      />

      {/* Luxury Boutique Footer - Dynamic Contacts */}
      <footer className="glass-panel" style={{
        margin: '40px 5% 24px 5%',
        padding: '40px 30px',
        background: 'rgba(15, 15, 15, 0.65)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Row 1: Brand details logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {settings?.logo_type === 'image' && settings?.logo_image_url ? (
            <img 
              src={settings.logo_image_url} 
              alt={settings.logo_text || 'Alankara Jewels Logo'} 
              style={{
                maxHeight: '50px',
                width: 'auto',
                objectFit: 'contain',
                borderRadius: '4px',
                marginBottom: '4px'
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--color-gold-muted)" />
              <h4 style={{ fontSize: '1rem', color: 'var(--color-text-gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {settings?.logo_text || 'ALANKARA JEWELS'}
              </h4>
            </div>
          )}
          
          {settings?.about_text && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 300, maxWidth: '500px', textAlign: 'center', lineHeight: 1.5 }}>
              {settings.about_text}
            </p>
          )}
        </div>

        {/* Row 2: Physical contact & support links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid rgba(212, 175, 55, 0.08)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.08)',
          padding: '16px 0',
          width: '100%',
          maxWidth: '800px'
        }}>
          {settings?.store_address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--color-gold-metallic)" />
              <span>{settings.store_address}</span>
            </div>
          )}

          {settings?.support_email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} color="var(--color-gold-metallic)" />
              <a href={`mailto:${settings.support_email}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-white">
                {settings.support_email}
              </a>
            </div>
          )}
        </div>

        {/* Row 3: Social & Copyrights */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '800px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 300 }}>
            © {new Date().getFullYear()} {settings?.logo_text || 'Alankara Jewels'}. Handcrafted Heritage Luxury.
          </p>

          {/* Social media anchors - Custom Inline SVGs */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {settings?.instagram_handle && (
              <a 
                href={`https://instagram.com/${settings.instagram_handle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.8rem' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-gold)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Instagram
              </a>
            )}

            {settings?.facebook_page && (
              <a 
                href={`https://facebook.com/${settings.facebook_page}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.8rem' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-gold)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Facebook
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Scroll to Top Floating Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Back to Top"
            style={{
              position: 'fixed',
              bottom: '90px',
              right: '24px',
              zIndex: 200,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15,15,15,0.92)',
              border: '1px solid var(--color-gold-border)',
              color: 'var(--color-gold-champagne)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-gold-metallic)';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(15,15,15,0.92)';
              e.currentTarget.style.color = 'var(--color-gold-champagne)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
