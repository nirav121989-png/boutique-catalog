import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles, Heart } from 'lucide-react';
import ProductCard from './ProductCard';

export default function Catalog({ products, settings, selectedItems, onToggleSelect, initialCategory = 'All', wishlistItems = [], onToggleWishlist, onProductView }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedCollectionLine, setSelectedCollectionLine] = useState('All');
  const [selectedPurity, setSelectedPurity] = useState('All');
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // featured, price-asc, price-desc

  // Sync category state with initialCategory parameter updates
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Categories list ordered by settings priority, falling back to dynamic unique list
  const categories = useMemo(() => {
    const definedCats = settings?.categories || [];
    const sortedCats = [...definedCats].sort((a, b) => a.priority - b.priority).map((c) => c.name);
    const productCats = new Set(products.map((p) => p.category).filter(Boolean));
    const allCats = new Set([...sortedCats, ...Array.from(productCats)]);
    return ['All', ...Array.from(allCats)];
  }, [products, settings]);

  // Purities list derived dynamically (holds plated types)
  const purities = useMemo(() => {
    const purs = new Set(products.map((p) => p.purity).filter(Boolean));
    return ['All', ...Array.from(purs)];
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Only show active products (hide drafts for visitors)
    result = result.filter((p) => p.is_available !== false);

    // Wishlist filter
    if (showWishlistOnly) {
      result = result.filter((p) => wishlistItems.includes(p.id));
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory !== 'All') {
      result = result.filter((p) => p.subcategory === selectedSubcategory);
    }

    // Collection Line filter
    if (selectedCollectionLine !== 'All') {
      result = result.filter((p) => p.collection_line === selectedCollectionLine);
    }

    // Purity (Plating) filter
    if (selectedPurity !== 'All') {
      result = result.filter((p) => p.purity === selectedPurity);
    }

    // Offers filter (support custom offers too)
    if (showOffersOnly) {
      result = result.filter((p) => (p.offer_type && p.offer_type !== 'none') || (p.compare_at_price && p.compare_at_price > p.price));
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, selectedCategory, selectedSubcategory, selectedCollectionLine, selectedPurity, showOffersOnly, sortBy]);

  return (
    <section id="catalog" className="section-padding" style={{ position: 'relative', background: '#080808' }}>
      {/* Abstract Background Accents */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Section Title */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <p className="sub-header" style={{ marginBottom: '8px' }}>Bespoke Vault</p>
        <h2 style={{ fontSize: 'calc(1.8rem + 1vw)', position: 'relative', display: 'inline-block' }}>
          Our Signature Catalog
          <Sparkles size={16} color="var(--color-gold-metallic)" style={{ position: 'absolute', right: '-25px', top: '-10px' }} />
        </h2>
      </div>

      {/* Filter Toolbar Container */}
      <div className="glass-panel" style={{
        padding: '24px',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Row 1: Search & Sort */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search Input Box */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '280px' }}>
            <Search size={18} color="var(--color-gold-metallic)" style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search design, SKU reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input"
              style={{ paddingLeft: '48px' }}
            />
          </div>

          {/* Sorting Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
            <SlidersHorizontal size={16} color="var(--color-text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(10, 10, 10, 0.6)',
                border: '1px solid var(--color-gold-border)',
                color: 'var(--color-text-primary)',
                padding: '12px 16px',
                borderRadius: '6px',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)'
              }}
            >
              <option value="featured">Featured Masterpieces</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Chips */}
        <div>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '10px'
          }}>
            Categories
          </p>
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory('All'); // Reset subcategory filter
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    border: isActive 
                      ? '1px solid var(--color-gold-metallic)' 
                      : '1px solid var(--color-gold-border)',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(243, 229, 171, 0.15) 0%, rgba(212, 175, 55, 0.15) 100%)' 
                      : 'rgba(10, 10, 10, 0.4)',
                    color: isActive 
                      ? 'var(--color-gold-champagne)' 
                      : 'var(--color-text-muted)'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2.5: Subcategory Chips (Dynamic) */}
        {selectedCategory !== 'All' && (() => {
          const catObj = (settings?.categories || []).find(c => c.name === selectedCategory);
          const subList = catObj?.subcategories || [];
          if (subList.length === 0) return null;
          
          return (
            <div style={{
              marginTop: '6px',
              padding: '12px 16px',
              background: 'rgba(212, 175, 55, 0.02)',
              border: '1px solid rgba(212, 175, 55, 0.05)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                margin: 0
              }}>
                Style Tiers ({selectedCategory})
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', ...subList.map(s => s.name)].map((sub) => {
                  const isActive = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(sub)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        border: isActive 
                          ? '1px solid var(--color-gold-metallic)' 
                          : '1px solid rgba(255,255,255,0.06)',
                        background: isActive 
                          ? 'rgba(212,175,55,0.1)' 
                          : 'rgba(255,255,255,0.01)',
                        color: isActive 
                          ? 'var(--color-gold-champagne)' 
                          : 'var(--color-text-muted)'
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Row 3: Purities, Collection Style and Offers Toggles */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid rgba(212, 175, 55, 0.08)',
          paddingTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            {/* Plating style selector chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Plating:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {purities.map((pur) => {
                  const isActive = selectedPurity === pur;
                  return (
                    <button
                      key={pur}
                      onClick={() => setSelectedPurity(pur)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        border: isActive 
                          ? '1px solid var(--color-gold-metallic)' 
                          : '1px solid var(--color-gold-border)',
                        background: isActive 
                          ? 'rgba(212, 175, 55, 0.15)' 
                          : 'transparent',
                        color: isActive 
                          ? 'var(--color-gold-champagne)' 
                          : 'var(--color-text-muted)'
                      }}
                    >
                      {pur}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection Line selector chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Occasion Line:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', 'Daily Wear', 'Heritage', 'Royal', 'Festive', 'Bridal'].map((line) => {
                  const isActive = selectedCollectionLine === line;
                  return (
                    <button
                      key={line}
                      onClick={() => setSelectedCollectionLine(line)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        border: isActive 
                          ? '1px solid var(--color-gold-metallic)' 
                          : '1px solid var(--color-gold-border)',
                        background: isActive 
                          ? 'rgba(212, 175, 55, 0.15)' 
                          : 'transparent',
                        color: isActive 
                          ? 'var(--color-gold-champagne)' 
                          : 'var(--color-text-muted)'
                      }}
                    >
                      {line}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: showOffersOnly ? 'var(--color-gold-metallic)' : 'var(--color-text-muted)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={showOffersOnly}
                onChange={(e) => setShowOffersOnly(e.target.checked)}
                style={{ accentColor: 'var(--color-gold-metallic)' }}
              />
              Show Only Offers & Discounts
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: showWishlistOnly ? '#ef4444' : 'var(--color-text-muted)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={showWishlistOnly}
                onChange={(e) => setShowWishlistOnly(e.target.checked)}
                style={{ accentColor: '#ef4444' }}
              />
              <Heart size={14} fill={showWishlistOnly ? '#ef4444' : 'none'} color={showWishlistOnly ? '#ef4444' : 'currentColor'} />
              My Wishlist ({wishlistItems.length})
            </label>
          </div>
          </div>
        </div>
      </div>

      {/* Catalog Grid View */}
      <motion.div 
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '30px',
          minHeight: '300px'
        }}
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => {
            return (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <ProductCard
                  product={product}
                  selectedItems={selectedItems}
                  onToggleSelect={onToggleSelect}
                  settings={settings}
                  wishlistItems={wishlistItems}
                  onToggleWishlist={onToggleWishlist}
                  onProductView={onProductView}
                  allProducts={products}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State View */}
      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--color-text-muted)'
          }}
        >
          <p style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-gold-champagne)' }}>
            No Masterpieces Found
          </p>
          <p style={{ fontSize: '0.9rem', fontWeight: 300 }}>
            Adjust your search keywords or clear active filters to discover our premium styles.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedPurity('All');
              setShowOffersOnly(false);
              setSortBy('featured');
            }}
            className="btn-outline-gold"
            style={{ marginTop: '24px', fontSize: '0.75rem', padding: '8px 20px' }}
          >
            Clear All Filters
          </button>
        </motion.div>
      )}
    </section>
  );
}
