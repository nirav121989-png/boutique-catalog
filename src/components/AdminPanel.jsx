import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, LogOut, Check, Eye, EyeOff, Edit, Copy, Trash2, Download, AlertCircle, FileText, Settings, ShoppingBag, Upload, X } from 'lucide-react';
import { db } from '../db/db';
import { auth } from '../db/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function AdminPanel({ products, settings, onUpdateProducts, onUpdateSettings }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, categories, settings, offers
  
  // Daily Offers States
  const [selectedOffersProducts, setSelectedOffersProducts] = useState(new Set());
  const [offerActionType, setOfferActionType] = useState('discount'); // discount, flat, bogo, free_gift
  const [offerActionValue, setOfferActionValue] = useState('');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Modals & Editing states for products
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Product Form Field States
  const [formTitle, setFormTitle] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formCollectionLine, setFormCollectionLine] = useState('Daily Wear'); // Daily Wear, Heritage, Royal
  const [formPurity, setFormPurity] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOfferType, setFormOfferType] = useState('none'); // none, discount, bogo, custom
  const [formOfferTag, setFormOfferTag] = useState('');
  const [formComparePrice, setFormComparePrice] = useState('');
  const [formImages, setFormImages] = useState([]); // Array of Base64 or URLs
  const [formImageUrlInput, setFormImageUrlInput] = useState(''); // Text fallback
  const [formDescription, setFormDescription] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formIsLatest, setFormIsLatest] = useState(false);
  const [formIsExclusive, setFormIsExclusive] = useState(false);
  const [formStockQty, setFormStockQty] = useState(1);
  const [formWeightGrams, setFormWeightGrams] = useState(100); // Shipping weight in grams (incl. packaging)
  const [formDimensions, setFormDimensions] = useState({ l: '', w: '', h: '' }); // cm

  // Category Manager Form States
  const [newCatName, setNewCatName] = useState('');
  const [newCatPriority, setNewCatPriority] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatImageUrlInput, setNewCatImageUrlInput] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatPriority, setEditingCatPriority] = useState('');
  const [editingCatImage, setEditingCatImage] = useState('');
  const [editingCatImageUrlInput, setEditingCatImageUrlInput] = useState('');

  // Subcategory management states
  const [selectedSubCatParent, setSelectedSubCatParent] = useState(null); // Parent category object
  const [newSubName, setNewSubName] = useState('');
  const [newSubPrice, setNewSubPrice] = useState('');
  const [editingSubId, setEditingSubId] = useState(null); // Subcategory ID being edited

  // Boutique Settings Form States
  const [setWhatsapp, setSetWhatsapp] = useState(settings?.whatsapp_number || '');
  const [setLogoText, setSetLogoText] = useState(settings?.logo_text || '');
  const [setAboutText, setSetAboutText] = useState(settings?.about_text || '');
  const [setEmail, setSetEmail] = useState(settings?.support_email || '');
  const [setAddress, setSetAddress] = useState(settings?.store_address || '');
  const [setInstagram, setSetInstagram] = useState(settings?.instagram_handle || '');
  const [setFacebook, setSetFacebook] = useState(settings?.facebook_page || '');
  const [logoType, setLogoType] = useState(settings?.logo_type || 'text');
  const [logoImageUrl, setLogoImageUrl] = useState(settings?.logo_image_url || '');
  const [fallbackImageUrl, setFallbackImageUrl] = useState(settings?.product_fallback_image || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle Auth Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setAuthError('');
    } catch (error) {
      setAuthError('Unauthorized: Invalid email or password.');
    }
  };

  // Open modal for Adding a new product
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormSku('REF-' + Math.floor(100 + Math.random() * 900));
    
    // Default to first category in setting list
    const sortedCategories = [...(settings?.categories || [])].sort((a, b) => a.priority - b.priority);
    const defaultCat = sortedCategories[0]?.name || 'Necklaces';
    setFormCategory(defaultCat);
    
    // Default to first subcategory under default category if exists
    const catObj = sortedCategories.find(c => c.name === defaultCat);
    const subList = catObj?.subcategories || [];
    setFormSubcategory(subList[0]?.name || '');
    
    setFormCollectionLine('Daily Wear');
    setFormPurity('Premium Imitation');
    setFormPrice(subList[0]?.default_price || '');
    setFormOfferType('none');
    setFormOfferTag('');
    setFormComparePrice('');
    setFormImages([]);
    setFormImageUrlInput('');
    setFormDescription('');
    setFormAvailable(true);
    setFormIsLatest(false);
    setFormIsExclusive(false);
    setFormStockQty(1);
    setFormWeightGrams(100);
    setFormDimensions({ l: '20', w: '15', h: '5' });
    setIsFormOpen(true);
  };

  // Open modal for Editing an existing product
  const handleOpenEdit = (product) => {
    setEditingItem(product);
    setFormTitle(product.title || '');
    setFormSku(product.sku || '');
    setFormCategory(product.category || '');
    setFormSubcategory(product.subcategory || '');
    setFormCollectionLine(product.collection_line || 'Daily Wear');
    setFormPurity(product.purity || 'Premium Imitation');
    setFormPrice(product.price || '');
    setFormOfferType(product.offer_type || 'none');
    setFormOfferTag(product.offer_tag || '');
    setFormComparePrice(product.compare_at_price || '');
    // Resolve images
    const initialImages = product.images && product.images.length > 0 
      ? product.images 
      : (product.image_url ? [product.image_url] : []);
    setFormImages(initialImages);
    setFormImageUrlInput('');
    setFormDescription(product.description || '');
    setFormAvailable(product.is_available !== false);
    setFormIsLatest(product.is_latest === true);
    setFormIsExclusive(product.is_exclusive === true);
    setFormStockQty(product.stock_qty !== undefined ? product.stock_qty : 1);
    setFormWeightGrams(product.weight_grams || 100);
    setFormDimensions(product.dimensions || { l: '', w: '', h: '' });
    setIsFormOpen(true);
  };

  // Open modal for Copying an existing product
  const handleOpenCopy = (product) => {
    setEditingItem(null); // It's a new item!
    setFormTitle(product.title + " (Copy)");
    setFormSku('REF-' + Math.floor(100 + Math.random() * 900)); // Generate new SKU
    setFormCategory(product.category || '');
    setFormSubcategory(product.subcategory || '');
    setFormCollectionLine(product.collection_line || 'Daily Wear');
    setFormPurity(product.purity || 'Premium Imitation');
    setFormPrice(product.price || '');
    setFormOfferType(product.offer_type || 'none');
    setFormOfferTag(product.offer_tag || '');
    setFormComparePrice(product.compare_at_price || '');
    // Clear images for the copy
    setFormImages([]);
    setFormImageUrlInput('');
    setFormDescription(product.description || '');
    setFormAvailable(product.is_available !== false);
    setFormIsLatest(false); // Reset flags for the copy
    setFormIsExclusive(false);
    setFormStockQty(product.stock_qty !== undefined ? product.stock_qty : 1);
    setFormWeightGrams(product.weight_grams || 100);
    setFormDimensions(product.dimensions || { l: '20', w: '15', h: '5' });
    setIsFormOpen(true);
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice) {
      alert('Title and Price are required fields.');
      return;
    }

    // Include text URL input if user pasted something
    let finalImages = [...formImages];
    if (formImageUrlInput.trim()) {
      finalImages.push(formImageUrlInput.trim());
    }



    const payload = {
      title: formTitle.trim(),
      sku: formSku.trim(),
      category: formCategory,
      subcategory: formSubcategory,
      collection_line: formCollectionLine,
      purity: formPurity,
      price: Number(formPrice),
      offer_type: formOfferType,
      offer_tag: formOfferType === 'bogo' ? 'BOGO' : (formOfferType === 'discount' ? 'DISCOUNT' : formOfferTag.trim()),
      compare_at_price: formOfferType === 'discount' && formComparePrice ? Number(formComparePrice) : null,
      image_url: finalImages[0] || '', // First image acts as main thumbnail
      images: finalImages,      // Dynamic variations array
      description: formDescription.trim(),
      is_available: formAvailable,
      is_latest: formIsLatest,
      is_exclusive: formIsExclusive,
      stock_qty: Number(formStockQty) || 1,
      weight_grams: Number(formWeightGrams) || 100,
      dimensions: {
        l: Number(formDimensions.l) || 0,
        w: Number(formDimensions.w) || 0,
        h: Number(formDimensions.h) || 0
      }
    };

    if (editingItem) {
      payload.id = editingItem.id;
    }

    const success = await db.saveItem(payload);
    if (success) {
      setIsFormOpen(false);
      setEditingItem(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete the masterpiece "${title}"?`)) {
      await db.deleteItem(id);
    }
  };

  // Toggle Visibility / Draft state
  const handleToggleVisibility = async (product) => {
    const updatedPayload = {
      ...product,
      is_available: product.is_available === false ? true : false
    };
    await db.saveItem(updatedPayload);
  };

  // --- DAILY OFFERS LOGIC ---
  const toggleOfferSelection = (productId) => {
    const newSet = new Set(selectedOffersProducts);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setSelectedOffersProducts(newSet);
  };

  const selectAllOffers = () => {
    if (selectedOffersProducts.size === products.length) {
      setSelectedOffersProducts(new Set());
    } else {
      setSelectedOffersProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleApplyOffer = async () => {
    if (selectedOffersProducts.size === 0) return alert("Select at least one product.");
    if (offerActionType === 'discount' || offerActionType === 'flat') {
      if (!offerActionValue || isNaN(offerActionValue) || Number(offerActionValue) <= 0) {
        return alert("Please enter a valid discount amount.");
      }
    }

    const val = Number(offerActionValue);
    const promises = [];
    
    for (const pid of selectedOffersProducts) {
      const prod = products.find(p => p.id === pid);
      if (!prod) continue;

      let newPrice = prod.price;
      let comparePrice = prod.compare_at_price || prod.price; 
      
      const basePrice = prod.compare_at_price ? prod.compare_at_price : prod.price;

      if (offerActionType === 'discount') {
        newPrice = Math.round(basePrice - (basePrice * (val / 100)));
      } else if (offerActionType === 'flat') {
        newPrice = Math.max(1, basePrice - val);
      } else {
        newPrice = basePrice;
        comparePrice = null; 
      }

      let offerTag = '';
      if (offerActionType === 'bogo') offerTag = 'BOGO';
      else if (offerActionType === 'free_gift') offerTag = 'FREE GIFT';
      else if (offerActionType === 'discount') offerTag = 'DISCOUNT';
      else if (offerActionType === 'flat') offerTag = `FLAT ₹${val} OFF`;

      promises.push(db.saveItem({
        ...prod,
        price: newPrice,
        compare_at_price: (offerActionType === 'discount' || offerActionType === 'flat') ? basePrice : null,
        offer_type: offerActionType,
        offer_tag: offerTag
      }));
    }

    await Promise.all(promises);
    setSelectedOffersProducts(new Set());
    alert("Offers applied successfully!");
  };

  const handleRemoveOffer = async () => {
    if (selectedOffersProducts.size === 0) return alert("Select at least one product.");
    const promises = [];
    for (const pid of selectedOffersProducts) {
      const prod = products.find(p => p.id === pid);
      if (!prod) continue;
      
      const restoredPrice = prod.compare_at_price ? prod.compare_at_price : prod.price;

      promises.push(db.saveItem({
        ...prod,
        price: restoredPrice,
        compare_at_price: null,
        offer_type: 'none',
        offer_tag: ''
      }));
    }
    await Promise.all(promises);
    setSelectedOffersProducts(new Set());
    alert("Offers removed successfully!");
  };

  // Local Logo file uploader handler
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result, 400, 400, 0.8);
        setLogoImageUrl(compressed); // Base64 data string
        setLogoType('image');
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFallbackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result, 600, 600, 0.8);
        setFallbackImageUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save boutique settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const updatedSettings = {
      whatsapp_number: setWhatsapp.trim(),
      logo_text: setLogoText.trim() || 'ALANKARA JEWELS',
      about_text: setAboutText.trim(),
      support_email: setEmail.trim(),
      store_address: setAddress.trim(),
      instagram_handle: setInstagram.trim(),
      facebook_page: setFacebook.trim(),
      logo_type: logoType,
      logo_image_url: logoImageUrl.trim(),
      product_fallback_image: fallbackImageUrl.trim()
    };

    const success = await db.saveSettings(updatedSettings);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSaveCategories = async (updatedCats) => {
    const success = await db.saveSettings({ categories: updatedCats });
    if (!success) {
      alert("Error saving category. The uploaded image might be too large. Please try a smaller image or use an image URL.");
    }
  };

  const handleCatImageUpload = (e, isEditing) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result, 400, 400, 0.5);
        if (isEditing) {
          setEditingCatImage(compressed);
        } else {
          setNewCatImage(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Local Product Images file uploader handler
  const handleProductImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Convert to Base64
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(async (base64Images) => {
      const compressed = await Promise.all(
        base64Images.map(img => compressImage(img, 800, 800, 0.7))
      );
      setFormImages((prev) => [...prev, ...compressed]);
    });
  };

  // Export Settings JSON configuration
  const handleExportSettings = () => {
    db.exportSettings();
  };

  // Total metrics
  const activeItemsCount = products.filter((p) => p.is_available !== false).length;
  const draftItemsCount = products.filter((p) => p.is_available === false).length;
  const totalValuation = products.reduce((acc, p) => acc + (p.price || 0), 0);

  // Authentication Gate View
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: '#060606'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '40px 30px',
            textAlign: 'center'
          }}
        >
          <div style={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            border: '1px solid var(--color-gold-border)'
          }}>
            <Lock size={28} color="var(--color-gold-metallic)" />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Admin Vault</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Administrative entry required to manage inventory
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Email Address *</label>
              <input
                type="email"
                required
                placeholder="admin@alankarajewels.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="premium-input"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="premium-input"
              />
            </div>

            {authError && (
              <div style={{
                background: 'rgba(255,0,0,0.08)',
                border: '1px solid rgba(255,0,0,0.2)',
                borderRadius: '6px',
                padding: '10px',
                color: 'red',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <AlertCircle size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="btn-gold" style={{ width: '100%' }}>
              Unlock Vault
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Authenticated Dashboard View
  return (
    <div className="section-padding" style={{ background: '#060606', minHeight: '90vh' }}>
      
      {/* Admin Panel Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <p className="sub-header" style={{ marginBottom: '6px' }}>Dashboard Suite</p>
          <h2 style={{ fontSize: '1.8rem' }}>Administrative Vault</h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Add item */}
          {activeTab === 'inventory' && (
            <button
              onClick={handleOpenAdd}
              className="btn-gold"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
            >
              <Plus size={14} /> Add Masterpiece
            </button>
          )}

          {/* Logout */}
          <button
            onClick={async () => {
              await signOut(auth);
              setLoginEmail('');
              setLoginPassword('');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-muted)',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.target.style.color = '#FFF'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{
        display: 'flex',
        gap: '16px',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        marginBottom: '40px',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--color-gold-metallic)' : '2px solid transparent',
            color: activeTab === 'inventory' ? '#FFFFFF' : 'var(--color-text-muted)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)'
          }}
        >
          <ShoppingBag size={16} /> Inventory Catalog
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'categories' ? '2px solid var(--color-gold-metallic)' : '2px solid transparent',
            color: activeTab === 'categories' ? '#FFFFFF' : 'var(--color-text-muted)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)'
          }}
        >
          <FileText size={16} /> Manage Categories
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'offers' ? '2px solid var(--color-gold-metallic)' : '2px solid transparent',
            color: activeTab === 'offers' ? '#FFFFFF' : 'var(--color-text-muted)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)'
          }}
        >
          <ShoppingBag size={16} /> Daily Offers
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid var(--color-gold-metallic)' : '2px solid transparent',
            color: activeTab === 'settings' ? '#FFFFFF' : 'var(--color-text-muted)',
            padding: '10px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)'
          }}
        >
          <Settings size={16} /> Boutique Settings
        </button>
      </div>

      {/* Tab Contents */}
      {/* Tab Contents */}
      {activeTab === 'inventory' && (
        <>
          {/* Sync tip */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            marginBottom: '40px',
            background: 'rgba(212, 175, 55, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={18} color="var(--color-gold-metallic)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                <strong>Zero-Server Catalog Sync:</strong> Save updates to browser storage. Click <strong>"Export Products JSON"</strong> to download the catalog file and replace <code>src/assets/products.json</code> in your repository for permanent deployments!
              </p>
            </div>
            
            <button
              onClick={db.exportDatabase}
              className="btn-outline-gold"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', padding: '8px 16px', marginTop: '10px' }}
            >
              <Download size={12} /> Export Products JSON
            </button>
          </div>

          {/* Metric Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* Active Items */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Active Catalog Items
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-gold-metallic)' }}>
                {activeItemsCount}
              </p>
            </div>

            {/* Draft Items */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Hidden Drafts
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {draftItemsCount}
              </p>
            </div>

            {/* Total Catalog Value */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Combined Asset Value
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-gold-champagne)', fontFamily: 'var(--font-body)' }}>
                ₹{totalValuation.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Products Management Grid */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <h4 style={{ margin: 0 }}>Inventory Catalog ({products.length} items)</h4>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <th style={{ padding: '16px 24px' }}>Item Details</th>
                    <th style={{ padding: '16px 24px' }}>Category</th>

                    <th style={{ padding: '16px 24px' }}>Retail Price</th>
                    <th style={{ padding: '16px 24px' }}>Status</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice().sort((a, b) => a.price - b.price).map((product) => {
                    const isDraft = product.is_available === false;
                    return (
                      <tr 
                        key={product.id} 
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        {/* Details Thumbnail */}
                        <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img 
                            src={product.image_url || settings?.product_fallback_image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'} 
                            alt={product.title} 
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid rgba(212,175,55,0.1)'
                            }}
                          />
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{product.title}</h5>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <code style={{ fontSize: '0.75rem', color: 'var(--color-gold-champagne)' }}>{product.sku}</code>
                              {product.is_latest && (
                                <span style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid var(--color-gold-metallic)',
                                  color: 'var(--color-gold-champagne)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase'
                                }}>Latest</span>
                              )}
                              {product.is_exclusive && (
                                <span style={{
                                  background: 'rgba(147, 51, 234, 0.15)',
                                  border: '1px solid rgb(147, 51, 234)',
                                  color: 'rgb(216, 180, 254)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase'
                                }}>Exclusive</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '16px 24px', color: 'var(--color-text-muted)' }}>
                          {product.category}
                        </td>

                        {/* Pricing */}
                        <td style={{ padding: '16px 24px', fontFamily: 'var(--font-body)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.compare_at_price && (
                            <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>
                              ₹{product.compare_at_price.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Visibility Status */}
                        <td style={{ padding: '16px 24px' }}>
                          <button
                            onClick={() => handleToggleVisibility(product)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              color: isDraft ? 'var(--color-text-muted)' : 'var(--color-gold-metallic)'
                            }}
                          >
                            {isDraft ? (
                              <>
                                <EyeOff size={14} /> Draft
                              </>
                            ) : (
                              <>
                                <Eye size={14} /> Active
                              </>
                            )}
                          </button>
                        </td>

                        {/* Row CRUD Actions */}
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(product)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--color-gold-metallic)'}
                              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenCopy(product)}
                              title="Duplicate Product"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--color-gold-metallic)'}
                              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.title)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(255,0,0,0.6)',
                                transition: 'var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'red'}
                              onMouseLeave={(e) => e.target.style.color = 'rgba(255,0,0,0.6)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        Empty Vault: Click "Add Masterpiece" to build catalog selections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Sync tip */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            marginBottom: '40px',
            background: 'rgba(212, 175, 55, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={18} color="var(--color-gold-metallic)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                <strong>Categories & Sorting:</strong> Reorder, add, or delete categories. Set a lower priority number to display a category first. Click <strong>"Export Settings JSON"</strong> to download the updated config for your source files.
              </p>
            </div>
            
            <button
              onClick={handleExportSettings}
              className="btn-outline-gold"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', padding: '8px 16px', marginTop: '10px' }}
            >
              <Download size={12} /> Export Settings JSON
            </button>
          </div>

          {selectedSubCatParent ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {/* Back CTA Header */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '12px', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: '0 0 4px 0' }}>
                    Subcategories for <span className="text-gold-gradient">{selectedSubCatParent.name}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Add subcategory tiers with default prices to streamline product inventory listings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubCatParent(null)}
                  className="btn-outline-gold"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  &larr; Back to Categories
                </button>
              </div>

              {/* Add/Edit Subcategory Form */}
              <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--color-gold-metallic)' }}>
                  {editingSubId ? 'Edit Subcategory' : 'Add New Subcategory'}
                </h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSubName.trim()) return;

                  const currentCats = settings?.categories || [];
                  const parentCat = currentCats.find(c => c.id === selectedSubCatParent.id);
                  if (!parentCat) return;

                  const subList = parentCat.subcategories || [];

                  let updatedSubs;
                  if (editingSubId) {
                    // Edit existing subcategory
                    updatedSubs = subList.map(sub => sub.id === editingSubId ? {
                      ...sub,
                      name: newSubName.trim(),
                      default_price: Number(newSubPrice) || 0
                    } : sub);
                    setEditingSubId(null);
                  } else {
                    // Add new subcategory
                    const newSub = {
                      id: 'sub-' + Date.now(),
                      name: newSubName.trim(),
                      default_price: Number(newSubPrice) || 0
                    };
                    updatedSubs = [...subList, newSub];
                  }

                  // Update settings categories
                  const updatedCats = currentCats.map(c => c.id === selectedSubCatParent.id ? {
                    ...c,
                    subcategories: updatedSubs
                  } : c);

                  // Save to db
                  handleSaveCategories(updatedCats);

                  // Update active parent reference state to trigger HMR update
                  const updatedParent = updatedCats.find(c => c.id === selectedSubCatParent.id);
                  setSelectedSubCatParent(updatedParent);

                  setNewSubName('');
                  setNewSubPrice('');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Subcategory Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Choker Set"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Default Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 3500"
                      value={newSubPrice}
                      onChange={(e) => setNewSubPrice(e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" className="btn-gold" style={{ flexGrow: 1, padding: '10px' }}>
                      {editingSubId ? 'Save Subcategory' : 'Add Subcategory'}
                    </button>
                    {editingSubId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubId(null);
                          setNewSubName('');
                          setNewSubPrice('');
                        }}
                        className="btn-outline-gold"
                        style={{ padding: '10px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Subcategories List */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Active Tiers</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Subcategory Name</th>
                        <th style={{ padding: '8px' }}>Default Price</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([...(selectedSubCatParent.subcategories || [])]).sort((a, b) => (a.default_price || 0) - (b.default_price || 0)).map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>{sub.name}</td>
                          <td style={{ padding: '10px 8px', fontFamily: 'var(--font-body)' }}>₹{sub.default_price?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setEditingSubId(sub.id);
                                  setNewSubName(sub.name);
                                  setNewSubPrice(sub.default_price || '');
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the subcategory "${sub.name}"?`)) {
                                    const currentCats = settings?.categories || [];
                                    const parentCat = currentCats.find(c => c.id === selectedSubCatParent.id);
                                    if (parentCat) {
                                      const subList = parentCat.subcategories || [];
                                      const updatedSubs = subList.filter(s => s.id !== sub.id);
                                      const updatedCats = currentCats.map(c => c.id === selectedSubCatParent.id ? {
                                        ...c,
                                        subcategories: updatedSubs
                                      } : c);
                                      handleSaveCategories(updatedCats);
                                      
                                      const updatedParent = updatedCats.find(c => c.id === selectedSubCatParent.id);
                                      setSelectedSubCatParent(updatedParent);
                                    }
                                  }
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,0,0,0.6)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(selectedSubCatParent.subcategories || []).length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                            No subcategory tiers found. Add one on the left to start!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Add/Edit Category Form */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--color-gold-metallic)' }}>
                  {editingCatId ? 'Edit Category' : 'Create New Category'}
                </h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const nameToSave = editingCatId ? editingCatName : newCatName;
                  if (!nameToSave.trim()) return;
                  
                  const currentCats = settings?.categories || [];
                  const imgToSave = editingCatId
                    ? (editingCatImageUrlInput.trim() || editingCatImage)
                    : (newCatImageUrlInput.trim() || newCatImage);

                  if (editingCatId) {
                    // Update existing
                    const updated = currentCats.map(c => c.id === editingCatId ? {
                      ...c,
                      name: nameToSave.trim(),
                      priority: Number(editingCatPriority) || 10,
                      image_url: imgToSave
                    } : c);
                    handleSaveCategories(updated);
                    setEditingCatId(null);
                    setEditingCatName('');
                    setEditingCatPriority('');
                    setEditingCatImage('');
                    setEditingCatImageUrlInput('');
                  } else {
                    // Add new
                    const newCat = {
                      id: 'cat-' + Date.now(),
                      name: nameToSave.trim(),
                      priority: Number(newCatPriority) || 10,
                      image_url: imgToSave,
                      subcategories: []
                    };
                    handleSaveCategories([...currentCats, newCat]);
                    setNewCatName('');
                    setNewCatPriority('');
                    setNewCatImage('');
                    setNewCatImageUrlInput('');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {/* Left Panel: Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Category Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Anklets"
                          value={editingCatId ? editingCatName : newCatName}
                          onChange={(e) => editingCatId ? setEditingCatName(e.target.value) : setNewCatName(e.target.value)}
                          className="premium-input"
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Display Priority (Lower shows first) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 5"
                          value={editingCatId ? editingCatPriority : newCatPriority}
                          onChange={(e) => editingCatId ? setEditingCatPriority(e.target.value) : setNewCatPriority(e.target.value)}
                          className="premium-input"
                        />
                      </div>
                    </div>

                    {/* Right Panel: Image Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(212,175,55,0.08)', padding: '16px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', justifyContent: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Category Background Image</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById(editingCatId ? 'editCatFileInput' : 'newCatFileInput').click()}
                          className="btn-outline-gold"
                          style={{ fontSize: '0.7rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Upload size={12} /> Upload Photo
                        </button>
                        <input
                          id={editingCatId ? 'editCatFileInput' : 'newCatFileInput'}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCatImageUpload(e, !!editingCatId)}
                          style={{ display: 'none' }}
                        />
                        
                        {(editingCatId ? editingCatImage : newCatImage) && (
                          <button
                            type="button"
                            onClick={() => editingCatId ? setEditingCatImage('') : setNewCatImage('')}
                            style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>

                      {/* Thumbnail Preview */}
                      {(editingCatId ? editingCatImage : newCatImage) && (
                        <div style={{ marginTop: '6px' }}>
                          <img
                            src={editingCatId ? editingCatImage : newCatImage}
                            alt="Category Preview"
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.2)' }}
                          />
                        </div>
                      )}

                      {/* Text URL Fallback */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Or Paste Image URL Link</label>
                        <input
                          type="url"
                          placeholder="Paste image web link..."
                          value={editingCatId ? editingCatImageUrlInput : newCatImageUrlInput}
                          onChange={(e) => editingCatId ? setEditingCatImageUrlInput(e.target.value) : setNewCatImageUrlInput(e.target.value)}
                          className="premium-input"
                          style={{ fontSize: '0.8rem', padding: '8px 10px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                    {editingCatId && (
                      <button type="button" onClick={() => {
                        setEditingCatId(null);
                        setEditingCatName('');
                        setEditingCatPriority('');
                        setEditingCatImage('');
                        setEditingCatImageUrlInput('');
                      }} className="btn-outline-gold" style={{ padding: '10px 24px' }}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn-gold" style={{ padding: '10px 30px' }}>
                      {editingCatId ? 'Save Category' : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--color-text-primary)' }}>Current Categories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...(settings?.categories || [])]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(212, 175, 55, 0.08)',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          gap: '20px'
                        }}
                      >
                        {/* 1. Category Image & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '2 1 200px' }}>
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.15)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={20} color="var(--color-text-muted)" />
                            </div>
                          )}
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>{cat.name}</h5>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              Display Priority: <strong style={{ color: 'var(--color-gold-champagne)' }}>{cat.priority}</strong>
                            </span>
                          </div>
                        </div>

                        {/* 2. Manage Subcategories Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1 1 180px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubCatParent(cat);
                              setNewSubName('');
                              setNewSubPrice('');
                              setEditingSubId(null);
                            }}
                            className="btn-outline-gold"
                            style={{
                              fontSize: '0.75rem',
                              padding: '8px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '20px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              width: '100%',
                              justifyContent: 'center'
                            }}
                          >
                            Manage Subcategories ({cat.subcategories?.length || 0})
                          </button>
                        </div>

                        {/* 3. Actions (Edit / Delete) */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flex: '0 0 100px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                              setEditingCatPriority(cat.priority);
                              setEditingCatImage(cat.image_url || '');
                              setEditingCatImageUrlInput('');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit Category"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              cursor: 'pointer',
                              color: 'var(--color-text-muted)',
                              padding: '8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                                const updated = (settings?.categories || []).filter(c => c.id !== cat.id);
                                handleSaveCategories(updated);
                              }
                            }}
                            title="Delete Category"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              cursor: 'pointer',
                              color: 'rgba(255,0,0,0.6)',
                              padding: '8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} color="var(--color-gold-metallic)" /> Daily Offers Management
            </h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Select Offer Type</label>
                <select
                  value={offerActionType}
                  onChange={(e) => setOfferActionType(e.target.value)}
                  className="premium-input"
                >
                  <option value="discount">Percentage Discount (%)</option>
                  <option value="flat">Flat Amount Discount (₹)</option>
                  <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                  <option value="free_gift">Free Gift With Purchase</option>
                </select>
              </div>

              {(offerActionType === 'discount' || offerActionType === 'flat') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '120px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {offerActionType === 'discount' ? 'Discount %' : 'Amount Off ₹'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={offerActionValue}
                    onChange={(e) => setOfferActionValue(e.target.value)}
                    className="premium-input"
                    placeholder={offerActionType === 'discount' ? 'e.g. 20' : 'e.g. 500'}
                  />
                </div>
              )}

              <button
                onClick={handleApplyOffer}
                style={{
                  background: 'linear-gradient(135deg, var(--color-gold-metallic) 0%, var(--color-gold-champagne) 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '46px'
                }}
              >
                Apply Offer
              </button>

              <button
                onClick={handleRemoveOffer}
                style={{
                  background: 'rgba(255,0,0,0.1)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(255,0,0,0.3)',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: '46px',
                  marginLeft: 'auto'
                }}
              >
                Clear Offers
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', width: '50px' }}>
                    <input 
                      type="checkbox"
                      checked={selectedOffersProducts.size === products.length && products.length > 0}
                      onChange={selectAllOffers}
                    />
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Product</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Price</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Active Offer</th>
                </tr>
              </thead>
              <tbody>
                {products.slice().sort((a, b) => a.price - b.price).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px' }}>
                      <input 
                        type="checkbox"
                        checked={selectedOffersProducts.has(p.id)}
                        onChange={() => toggleOfferSelection(p.id)}
                      />
                    </td>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.image_url || settings?.product_fallback_image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-champagne)' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {p.compare_at_price ? (
                        <>
                          <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>₹{p.compare_at_price.toLocaleString()}</div>
                          <div style={{ fontSize: '0.9rem', color: '#fff' }}>₹{p.price.toLocaleString()}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: '#fff' }}>₹{p.price.toLocaleString()}</div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {p.offer_type && p.offer_type !== 'none' ? (
                        <span style={{ 
                          background: p.offer_type === 'bogo' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                          color: p.offer_type === 'bogo' ? '#ef4444' : 'var(--color-gold-champagne)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {p.offer_tag}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        /* Boutique settings management suite */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Sync tip */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            marginBottom: '40px',
            background: 'rgba(212, 175, 55, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={18} color="#ff6b6b" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                <strong>Database Error Fix:</strong> If you are unable to save Categories, your database is full. Click the button to the right to clear out the large images and fix the issue.
              </p>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("This will clear all category images to fix the 1MB database limit error. Continue?")) {
                  const currentCats = settings?.categories || [];
                  const clearedCats = currentCats.map(c => ({ ...c, image_url: '' }));
                  const success = await db.saveSettings({ categories: clearedCats });
                  if (success) {
                    alert("Database fixed! You can now upload your category images again.");
                  } else {
                    alert("Still failing. Try removing them one by one.");
                  }
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', padding: '8px 16px', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
            >
              <AlertCircle size={12} /> Fix Database (Clear Images)
            </button>
          </div>

          {/* Settings form container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '40px 30px' }}
          >
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '12px', marginBottom: '8px' }}>
                Boutique Configuration Suite
              </h3>

              {/* Grid sections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Brand Logo Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Styled Brand Name (Logo Text)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALANKARA JEWELS"
                    value={setLogoText}
                    onChange={(e) => setSetLogoText(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Appears in header, footer, and inquiry documents.
                  </span>
                </div>

                {/* WhatsApp business line */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>WhatsApp Business Phone Line</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 919876543210 (Country code first, no spaces/special characters)"
                    value={setWhatsapp}
                    onChange={(e) => setSetWhatsapp(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    All client checkout summaries are sent pre-filled to this WhatsApp number.
                  </span>
                </div>
              </div>

              {/* Logo customization row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Logo Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Brand Logo Display Style</label>
                  <select
                    value={logoType}
                    onChange={(e) => setLogoType(e.target.value)}
                    style={{
                      background: 'rgba(10, 10, 10, 0.6)',
                      border: '1px solid var(--color-gold-border)',
                      color: 'var(--color-text-primary)',
                      padding: '13px 16px',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    <option value="text">Animated Golden Text Logo</option>
                    <option value="image">Graphic Image Logo File</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Toggle between typing your brand name or displaying a logo file.
                  </span>
                </div>

                {/* Logo Image Picker & Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Boutique Logo Image (Upload PNG/JPG)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('logoFileInput').click()}
                      className="btn-outline-gold"
                      style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Upload Brand Logo
                    </button>
                    <input
                      id="logoFileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    
                    {logoImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoImageUrl('');
                          setLogoType('text');
                        }}
                        style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Delete Logo / Revert
                      </button>
                    )}
                  </div>
                  
                  {/* Base64 Logo Preview */}
                  {logoType === 'image' && logoImageUrl && (
                    <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)', display: 'inline-flex' }}>
                      <img src={logoImageUrl} alt="Logo preview" style={{ maxHeight: '40px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Fallback Image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(212,175,55,0.05)', paddingTop: '20px', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Product Fallback Image (No Image)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('fallbackFileInput').click()}
                      className="btn-outline-gold"
                      style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Upload Fallback Image
                    </button>
                    <input
                      id="fallbackFileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFallbackUpload}
                      style={{ display: 'none' }}
                    />
                    
                    {fallbackImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFallbackImageUrl('')}
                        style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Remove Fallback
                      </button>
                    )}
                  </div>
                  
                  {/* Preview */}
                  {fallbackImageUrl && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)', display: 'inline-flex' }}>
                      <img src={fallbackImageUrl} alt="Fallback preview" style={{ maxHeight: '60px', width: 'auto', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  This image will be displayed for any product that does not have its own uploaded images.
                </span>
              </div>

              {/* Tagline / About */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Boutique Tagline & Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell clients about your heritage, specialty, or dedication to craftsmanship..."
                  value={setAboutText}
                  onChange={(e) => setSetAboutText(e.target.value)}
                  className="premium-input"
                  style={{ resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Appears in your landing Hero section and About panels.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Physical address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Physical Shop Location Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Bandra West, Mumbai, Maharashtra, India"
                    value={setAddress}
                    onChange={(e) => setSetAddress(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Displayed in the website footer.
                  </span>
                </div>

                {/* Email address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Customer Support Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@alankarajewels.com"
                    value={setEmail}
                    onChange={(e) => setSetEmail(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Displayed in the website footer for client support.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Instagram */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Instagram Profile Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. @alankarajewels"
                    value={setInstagram}
                    onChange={(e) => setSetInstagram(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Links customers to your social feed.
                  </span>
                </div>

                {/* Facebook page ID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Facebook Page ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AlankaraJewels"
                    value={setFacebook}
                    onChange={(e) => setSetFacebook(e.target.value)}
                    className="premium-input"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Links customers to your Facebook business page.
                  </span>
                </div>
              </div>

              {/* Action and Save Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{
                        color: 'var(--color-gold-metallic)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> Settings Saved & Synced Live!
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="btn-gold" style={{ padding: '14px 40px' }}>
                  Save Boutique Settings
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Slide-Up Form Modal for products (Create or Edit) */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Modal glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(5, 5, 5, 0.7)',
                backdropFilter: 'blur(8px)',
                zIndex: 101,
                cursor: 'pointer'
              }}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.4 }}
              className="glass-panel"
              style={{
                position: 'fixed',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: '650px',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '30px',
                zIndex: 102,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {editingItem ? 'Edit Masterpiece' : 'Add Masterpiece'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heritage Antique Choker Set"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="premium-input"
                  />
                </div>

                {/* Category & Subcategory Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Category dropdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setFormCategory(newCat);
                        
                        // Sync subcategory & auto-price
                        const catObj = (settings?.categories || []).find(c => c.name === newCat);
                        const subList = catObj?.subcategories || [];
                        const firstSub = subList[0];
                        if (firstSub) {
                          setFormSubcategory(firstSub.name);
                          setFormPrice(firstSub.default_price || '');
                        } else {
                          setFormSubcategory('');
                          setFormPrice('');
                        }
                      }}
                      style={{
                        background: 'rgba(10, 10, 10, 0.6)',
                        border: '1px solid var(--color-gold-border)',
                        color: 'var(--color-text-primary)',
                        padding: '13px 16px',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      {((settings?.categories && settings.categories.length > 0)
                        ? [...settings.categories].sort((a, b) => a.name.localeCompare(b.name))
                        : [
                            { id: '1', name: 'Necklaces', priority: 1 },
                            { id: '2', name: 'Rings', priority: 2 },
                            { id: '3', name: 'Bracelets', priority: 3 },
                            { id: '4', name: 'Earrings', priority: 4 }
                          ]
                       ).map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory dropdown (Dynamic based on Category) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Subcategory *</label>
                    <select
                      value={formSubcategory}
                      onChange={(e) => {
                        const newSub = e.target.value;
                        setFormSubcategory(newSub);
                        
                        // Auto-fill price
                        const catObj = (settings?.categories || []).find(c => c.name === formCategory);
                        const subObj = (catObj?.subcategories || []).find(s => s.name === newSub);
                        if (subObj && subObj.default_price) {
                          setFormPrice(subObj.default_price);
                        }
                      }}
                      style={{
                        background: 'rgba(10, 10, 10, 0.6)',
                        border: '1px solid var(--color-gold-border)',
                        color: 'var(--color-text-primary)',
                        padding: '13px 16px',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      {(() => {
                        const catObj = (settings?.categories || []).find(c => c.name === formCategory);
                        const subList = catObj?.subcategories || [];
                        if (subList.length === 0) {
                          return <option value="">No Subcategories</option>;
                        }
                        return [...subList].sort((a, b) => (a.default_price || 0) - (b.default_price || 0)).map(sub => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name} {sub.default_price ? `(₹${sub.default_price})` : ''}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Collection Line Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>


                  {/* Collection Line dropdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Collection Style Line *</label>
                    <select
                      value={formCollectionLine}
                      onChange={(e) => setFormCollectionLine(e.target.value)}
                      style={{
                        background: 'rgba(10, 10, 10, 0.6)',
                        border: '1px solid var(--color-gold-border)',
                        color: 'var(--color-text-primary)',
                        padding: '13px 16px',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      <option value="Daily Wear">Daily Wear</option>
                      <option value="Heritage">Heritage</option>
                      <option value="Royal">Royal</option>
                      <option value="Festive">Festive</option>
                      <option value="Bridal">Bridal</option>
                    </select>
                  </div>
                </div>

                {/* Prices Row */}
                {/* Offer & Prices Configuration Panel */}
                <div style={{
                  border: '1px solid rgba(212,175,55,0.1)',
                  padding: '16px',
                  borderRadius: '6px',
                  background: 'rgba(212,175,55,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Retail Price (selling price) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Retail Price (₹) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2450"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="premium-input"
                      />
                    </div>

                    {/* Stock Quantity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 1"
                        value={formStockQty}
                        onChange={(e) => setFormStockQty(e.target.value)}
                        className="premium-input"
                      />
                      <span style={{ fontSize: '0.7rem', color: 'rgba(212,175,55,0.6)' }}>
                        💡 Set to 0 to mark Out of Stock
                      </span>
                    </div>
                  </div>

                  {/* Shipping Info Row — Weight + Dimensions */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    padding: '14px',
                    background: 'rgba(99, 179, 237, 0.03)',
                    border: '1px solid rgba(99, 179, 237, 0.12)',
                    borderRadius: '6px'
                  }}>
                    {/* Header label for this section */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(99,179,237,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        📦 Shipping Info (for Shiprocket)
                      </span>
                    </div>

                    {/* Weight */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Weight (grams) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 150"
                        value={formWeightGrams}
                        onChange={(e) => setFormWeightGrams(e.target.value)}
                        className="premium-input"
                      />
                      <span style={{ fontSize: '0.68rem', color: 'rgba(99,179,237,0.55)', lineHeight: 1.4 }}>
                        Include product + box + packaging.<br/>
                        Necklace ≈ 150g | Earrings ≈ 80g | Bangles ≈ 200g
                      </span>
                    </div>

                    {/* Dimensions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Box Size (cm) — L × W × H</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="L"
                          value={formDimensions.l}
                          onChange={(e) => setFormDimensions(prev => ({ ...prev, l: e.target.value }))}
                          className="premium-input"
                          style={{ textAlign: 'center' }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="W"
                          value={formDimensions.w}
                          onChange={(e) => setFormDimensions(prev => ({ ...prev, w: e.target.value }))}
                          className="premium-input"
                          style={{ textAlign: 'center' }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="H"
                          value={formDimensions.h}
                          onChange={(e) => setFormDimensions(prev => ({ ...prev, h: e.target.value }))}
                          className="premium-input"
                          style={{ textAlign: 'center' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(99,179,237,0.55)' }}>
                        Optional — used for volumetric weight calc
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Active Offer Type</label>
                      <select
                        value={formOfferType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormOfferType(val);
                          if (val !== 'discount') setFormComparePrice('');
                          if (val !== 'custom') setFormOfferTag('');
                        }}
                        style={{
                          background: 'rgba(10, 10, 10, 0.6)',
                          border: '1px solid var(--color-gold-border)',
                          color: 'var(--color-text-primary)',
                          padding: '13px 16px',
                          borderRadius: '6px',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        <option value="none">No Offer</option>
                        <option value="discount">Special Discounted Price</option>
                        <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                        <option value="custom">Custom Text Tag</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional inputs based on selected Offer Type */}
                  {formOfferType === 'discount' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Original Price (₹) [Will be slashed out]</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 3200"
                        value={formComparePrice}
                        onChange={(e) => setFormComparePrice(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                  )}

                  {formOfferType === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Custom Offer Tag (e.g. "FREE Matching Ring" or "Flat 10% Off")</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter offer message..."
                        value={formOfferTag}
                        onChange={(e) => setFormOfferTag(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                  )}
                </div>

                {/* Multi-Image Design Uploader */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(212,175,55,0.08)', padding: '16px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    Product Design Images (Upload multiple design pictures) *
                  </label>
                  
                  {/* Trigger buttons */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('productFilesInput').click()}
                      className="btn-outline-gold"
                      style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Upload Photos
                    </button>
                    <input
                      id="productFilesInput"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleProductImagesUpload}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      Select one or multiple design options from your files.
                    </span>
                  </div>

                  {/* Previews Strip */}
                  {formImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      {formImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '55px', height: '55px' }}>
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.1)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                            }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fallback Paste Text Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Or Add Image URL (Pasted Link Fallback)</label>
                    <input
                      type="url"
                      placeholder="Paste direct web image link..."
                      value={formImageUrlInput}
                      onChange={(e) => setFormImageUrlInput(e.target.value)}
                      className="premium-input"
                      style={{ fontSize: '0.85rem', padding: '10px 12px' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Elaborate details about structure, gemstone cuts, craftsmanship..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="premium-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Status Toggle checkbox */}
                 {/* Status Toggle checkbox */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                   <input
                     type="checkbox"
                     id="formAvailable"
                     checked={formAvailable}
                     onChange={(e) => setFormAvailable(e.target.checked)}
                     style={{
                       width: '18px',
                       height: '18px',
                       accentColor: 'var(--color-gold-metallic)',
                       cursor: 'pointer'
                     }}
                   />
                   <label htmlFor="formAvailable" style={{ fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                     Make this item active and visible in the client catalog
                   </label>
                 </div>

                 {/* Showcase Flags Checkboxes */}
                 <div style={{
                   display: 'grid',
                   gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                   gap: '12px',
                   borderTop: '1px solid rgba(212,175,55,0.08)',
                   paddingTop: '16px',
                   marginTop: '10px'
                 }}>
                   {/* Latest Collection */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <input
                       type="checkbox"
                       id="formIsLatest"
                       checked={formIsLatest}
                       onChange={(e) => setFormIsLatest(e.target.checked)}
                       style={{
                         width: '18px',
                         height: '18px',
                         accentColor: 'var(--color-gold-metallic)',
                         cursor: 'pointer'
                       }}
                     />
                     <label htmlFor="formIsLatest" style={{ fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                       Add to Latest Collection Showcase
                     </label>
                   </div>

                   {/* Exclusive Collection */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <input
                       type="checkbox"
                       id="formIsExclusive"
                       checked={formIsExclusive}
                       onChange={(e) => setFormIsExclusive(e.target.checked)}
                       style={{
                         width: '18px',
                         height: '18px',
                         accentColor: 'var(--color-gold-metallic)',
                         cursor: 'pointer'
                       }}
                     />
                     <label htmlFor="formIsExclusive" style={{ fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                       Add to Exclusive Collection Showcase
                     </label>
                   </div>
                 </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-muted)',
                      padding: '12px 24px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.8rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold">
                    Save Piece
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
