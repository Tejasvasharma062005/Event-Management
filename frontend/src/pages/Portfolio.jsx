import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Portfolio() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  
  // Lightbox State
  const [activeProvider, setActiveProvider] = useState(null);
  const [activePortfolios, setActivePortfolios] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchAllProviders = async () => {
      setLoading(true);
      try {
        const data = await api.getProviders();
        setProviders(data);
        setError(null);
      } catch (err) {
        console.error('Fetch portfolios/providers error:', err);
        setError('Could not fetch portfolio galleries. Verify database connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllProviders();
  }, []);

  const openPortfolioDetail = async (provider) => {
    try {
      const details = await api.getProviderDetails(provider.id);
      setActiveProvider(details.provider);
      setActivePortfolios(details.portfolios || []);
      if (details.portfolios && details.portfolios.length > 0) {
        setSelectedImage(details.portfolios[0]);
      } else {
        setSelectedImage({
          image_url: provider.banner_image,
          title: 'Main Portfolio Cover',
          description: provider.description
        });
      }
    } catch (err) {
      console.error(err);
      alert('Could not fetch portfolio images');
    }
  };

  const filteredProviders = filterCategory 
    ? providers.filter(p => p.category === filterCategory)
    : providers;

  const categories = [
    { id: 'event_manager', name: 'Event Manager' },
    { id: 'decorator', name: 'Decoration' },
    { id: 'caterer', name: 'Catering' },
    { id: 'invitation_printer', name: 'Invitations' },
    { id: 'venue', name: 'Venues' },
    { id: 'salon', name: 'Salon' },
    { id: 'barber', name: 'Barber' },
    { id: 'laundry', name: 'Laundry' },
    { id: 'tailor', name: 'Tailoring' },
    { id: 'clothing_brand', name: 'Clothing' },
    { id: 'jewellery_shop', name: 'Jewellery' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'sound', name: 'Sound Systems' },
    { id: 'music_artist', name: 'Music Artists' },
    { id: 'dance_artist', name: 'Dance Artists' },
    { id: 'dance_group', name: 'Dance Groups' },
    { id: 'choreographer', name: 'Choreography' },
    { id: 'volunteers', name: 'Volunteers' },
    { id: 'security_guards', name: 'Security' },
    { id: 'bouncers', name: 'Bouncers' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Banner */}
      <section style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Inspirational Portfolios <span className="gradient-text">Gallery</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore real photos of events, styling, gourmet plates, and floral decoration setups.</p>
      </section>

      {/* Category Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
        <button
          onClick={() => setFilterCategory('')}
          className={`btn ${filterCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          All Portfolios
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`btn ${filterCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulseGlow 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading portfolios...</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Camera style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No portfolios available in this category yet.</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Log in and onboard a new provider in this category to test database updates!</p>
        </div>
      ) : (
        /* Masonry-like Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => openPortfolioDetail(provider)}
              className="glass-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'rgba(25, 28, 48, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}
            >
              <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={provider.banner_image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'}
                  alt={provider.business_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s' }}
                  className="portfolio-img-hover"
                />
                <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '20px 16px' }}>
                  <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{provider.category}</span>
                  <h3 style={{ fontSize: '1.2rem', color: 'white' }}>{provider.business_name}</h3>
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin style={{ width: '14px', color: 'var(--accent-primary)' }} />
                  {provider.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag style={{ width: '14px', color: 'var(--accent-secondary)' }} />
                  INR {provider.base_price.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styled masonry CSS helper */}
      <style>{`
        .portfolio-img-hover:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* Lightbox Modal slider */}
      {activeProvider && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setActiveProvider(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '950px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              padding: '0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column: Image viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#050508' }}>
              <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={selectedImage?.image_url}
                  alt={selectedImage?.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <button
                  onClick={() => setActiveProvider(null)}
                  style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              {/* Thumbnails row */}
              <div style={{ display: 'flex', gap: '8px', padding: '16px', overflowX: 'auto', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                {activePortfolios.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedImage(item)}
                    style={{
                      height: '60px',
                      width: '60px',
                      flexShrink: 0,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImage?.id === item.id ? '2px solid var(--accent-primary)' : '2px solid transparent'
                    }}
                  >
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Title and Details */}
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{activeProvider.category}</span>
                <h2 style={{ fontSize: '1.6rem' }}>{activeProvider.business_name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location: {activeProvider.location}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  {selectedImage?.title || 'Portfolio Image'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {selectedImage?.description || 'Visual collection item details.'}
                </p>
              </div>

              {selectedImage?.price > 0 && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--border-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Itemized Price Quote:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>INR {selectedImage.price.toLocaleString()}</span>
                </div>
              )}

              <button
                onClick={() => {
                  window.location.hash = `services?category=${activeProvider.category}`;
                  setActiveProvider(null);
                }}
                className="btn btn-primary"
                style={{ marginTop: 'auto', padding: '12px' }}
              >
                Inquire / Book Vendor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
