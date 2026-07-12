import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function HeroSection({ logoText, tagline }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById('catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1600&auto=format&fit=crop&q=80',
      subtitle: 'Exclusive Handcrafted Masterpieces',
      title: logoText || 'Alankara Jewels',
      desc: tagline || 'Experience the pinnacle of fine jewelry craftsmanship. Where timeless, heritage aesthetics meet modern, bespoke design.',
      cta: 'Explore Collection'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&auto=format&fit=crop&q=80',
      subtitle: 'Navratri Special',
      title: 'Festive Offers',
      desc: 'Celebrate this festive season with exclusive discounts and Buy 1 Get 1 Free on selected premium collections.',
      cta: 'Shop Offers'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&auto=format&fit=crop&q=80',
      subtitle: 'Royal Masterpieces',
      title: 'Heritage Collection',
      desc: 'Discover our most exquisite pieces, crafted for eternity. Handpicked for the modern royalty.',
      cta: 'View Exclusives'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={{
      position: 'relative',
      height: '92vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#040404'
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%'
          }}
        >
          {/* Background Image */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: `url('${slides[currentSlide].image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35
            }}
          />
          {/* Gold Dust Particles/Gradients */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'radial-gradient(circle at center, transparent 30%, #060606 90%)'
          }} />

          {/* Content */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 20px',
            zIndex: 3
          }}>
            <div style={{ maxWidth: '900px' }}>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="sub-header"
                style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--color-gold-metallic)' }}
              >
                {slides[currentSlide].subtitle}
              </motion.p>
              
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{
                  fontSize: 'calc(2.5rem + 3vw)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  marginBottom: '24px'
                }}
              >
                <span className="text-gold-gradient">{slides[currentSlide].title}</span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'calc(0.95rem + 0.3vw)',
                  fontWeight: 300,
                  lineHeight: 1.6,
                  maxWidth: '650px',
                  margin: '0 auto 40px auto',
                  letterSpacing: '0.05em'
                }}
              >
                {slides[currentSlide].desc}
              </motion.p>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <button onClick={scrollToCatalog} className="btn-gold">
                  {slides[currentSlide].cta}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 10
      }}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: currentSlide === idx ? 'var(--color-gold-metallic)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0
            }}
          />
        ))}
      </div>

      {/* Animated Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 1.0 }}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={scrollToCatalog}
      >
        <span style={{ 
          fontSize: '0.7rem', 
          fontFamily: 'var(--font-body)', 
          letterSpacing: '0.25em',
          textTransform: 'uppercase', 
          color: 'var(--color-text-muted)' 
        }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} color="var(--color-gold-metallic)" />
        </motion.div>
      </motion.div>
    </div>
  );
}
