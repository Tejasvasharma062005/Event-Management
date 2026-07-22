import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Heart, Shield, ArrowRight, UserCheck, Star, Sparkle, UserPlus } from 'lucide-react';
import { api } from '../utils/api';

export default function Home({ setCurrentPage }) {
  const [stats, setStats] = useState({
    providers: 0,
    completedBookings: 0,
    clients: 0,
    averageRating: 5.0
  });
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const statsData = await api.getStats();
        setStats(statsData);
        
        const providersList = await api.getProviders();
        // Sort by rating desc
        const sorted = [...providersList].sort((a, b) => b.rating - a.rating);
        setFeaturedProviders(sorted.slice(0, 3));
      } catch (err) {
        console.error('Error loading home statistics / featured partners:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    { id: 'event_manager', name: 'Event Manager', icon: '💼' },
    { id: 'decorator', name: 'Stage & Floral Decor', icon: '🌸' },
    { id: 'caterer', name: 'Catering Services', icon: '🍽️' },
    { id: 'invitation_printer', name: 'Invitation Printer', icon: '✉️' },
    { id: 'venue', name: 'Luxury Venues', icon: '🏰' },
    { id: 'salon', name: 'Bridal Makeovers & Salon', icon: '💄' },
    { id: 'barber', name: 'Grooming Barber', icon: '💈' },
    { id: 'laundry', name: 'Express Laundry', icon: '👕' },
    { id: 'tailor', name: 'Bespoke Tailor', icon: '✂️' },
    { id: 'clothing_brand', name: 'Clothing Brands', icon: '👗' },
    { id: 'jewellery_shop', name: 'Jewellery Shops', icon: '💎' },
    { id: 'lighting', name: 'Ambient Lighting', icon: '⚡' },
    { id: 'sound', name: 'Sound Systems', icon: '🔊' },
    { id: 'music_artist', name: 'Music Artists', icon: '🎤' },
    { id: 'dance_artist', name: 'Dance Artists', icon: '💃' },
    { id: 'dance_group', name: 'Dance Groups & Troupes', icon: '👯' },
    { id: 'choreographer', name: 'Dance Choreographer', icon: '🎵' },
    { id: 'volunteers', name: 'Event Volunteers', icon: '🤝' },
    { id: 'security_guards', name: 'Security Guards', icon: '👮' },
    { id: 'bouncers', name: 'VVIP Bouncers', icon: '🛡️' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
      
      {/* Hero Section */}
      <section style={{ padding: '40px 0', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10%', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 60%)', zindex: -1 }}></div>
        
        <div className="badge badge-primary" style={{ marginBottom: '20px', gap: '6px', padding: '6px 14px' }}>
          <Sparkles style={{ width: '14px', height: '14px' }} />
          Smart Event Orchestration
        </div>
        
        <h1 style={{ fontSize: 'calc(2.5rem + 1.5vw)', maxWidth: '900px', marginBottom: '24px', lineHeight: 1.15 }}>
          Your Entire Event Planned in Real-Time with <span className="gradient-text">Heuristic AI</span>
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '700px', marginBottom: '40px' }}>
          Onboard professional caterers, decorators, make-up artists, mehandi experts, volunteers, and drycleaners. Get custom automated quotations tailored to your exact budget.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          <button onClick={() => navigateTo('ai-recommendation')} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
            Launch AI Recommendation <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
          <button onClick={() => navigateTo('services')} className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
            Explore Services
          </button>
        </div>
      </section>

      {/* Feature Split Section */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div className="glass-card" style={{ display: 'flex', gap: '20px', padding: '30px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: 'var(--border-radius-sm)', height: 'fit-content' }}>
            <Sparkles style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
          </div>
          <div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>AI Recommendation Engine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Answer six simple event metrics (budget, guests, destination, etc.) and let our intelligent engine scan real vendor profiles to produce an itemized quotation.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '20px', padding: '30px' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: 'var(--border-radius-sm)', height: 'fit-content' }}>
            <UserCheck style={{ color: 'var(--accent-secondary)', width: '28px', height: '28px' }} />
          </div>
          <div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>11 Core Specialist Roles</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              From luxury caterers and floral decorators to helper volunteers, dry cleaners, tailors, and mehandi experts. Fully unified dashboard and management panel.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '20px', padding: '30px' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: 'var(--border-radius-sm)', height: 'fit-content' }}>
            <Heart style={{ color: '#fbbf24', width: '28px', height: '28px' }} />
          </div>
          <div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>Real-time Syncing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Connected directly to a local SQL backend. Make a booking request or update your vendor portfolios, and see the updates reflect across search results instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Browse by Categories */}
      <section>
        <div className="section-title-wrapper">
          <h2 className="section-title">Verified Services Portfolio</h2>
          <p className="section-subtitle">Select a category below to explore real vendor profiles, reviews, and starting rates.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                window.location.hash = `services?category=${cat.id}`;
                setCurrentPage('services');
              }}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                background: 'rgba(25, 28, 48, 0.4)'
              }}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block' }}>{cat.icon}</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{cat.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '60px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats.providers}</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', marginTop: '8px' }}>Verified Service Partners</p>
        </div>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{stats.completedBookings}</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', marginTop: '8px' }}>Completed Booking Orders</p>
        </div>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fbbf24' }}>{stats.clients}</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', marginTop: '8px' }}>Registered Clients</p>
        </div>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981' }}>{stats.averageRating.toFixed(1)} ⭐</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', marginTop: '8px' }}>Average Partner Rating</p>
        </div>
      </section>

      {/* Featured Service Partners */}
      <section>
        <div className="section-title-wrapper">
          <h2 className="section-title">Featured Service Partners</h2>
          <p className="section-subtitle">Meet our top-rated specialists currently active and accepting bookings.</p>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'pulseGlow 1s linear infinite', margin: '0 auto' }}></div>
          </div>
        ) : featuredProviders.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', background: 'rgba(25, 28, 48, 0.4)' }}>
            <Sparkle style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto' }} />
            <h3 style={{ marginBottom: '12px' }}>Your Premium Platform is Ready</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
              We have initialized the relational SQLite database environment. Register a new vendor profile or run a seed file to populate initial vendor listings!
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigateTo('register')} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                <UserPlus style={{ width: '16px' }} /> Register Service Partner
              </button>
              <button onClick={() => navigateTo('services')} className="btn btn-secondary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                Explore Services
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {featuredProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={() => {
                  window.location.hash = `services?category=${provider.category}`;
                  setCurrentPage('services');
                }}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  background: 'rgba(25, 28, 48, 0.4)'
                }}
              >
                <div style={{ height: '160px', position: 'relative' }}>
                  <img
                    src={provider.banner_image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'}
                    alt={provider.business_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="badge badge-gold" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Star style={{ width: '12px', height: '12px', fill: '#fbbf24' }} />
                      {provider.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '12px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{provider.business_name}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>📍 {provider.location}</span>
                    <span>💰 Starting at {provider.base_price.toLocaleString()} INR</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineClamp: '2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                    {provider.description}
                  </p>
                  <button className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%', padding: '10px', fontSize: '0.85rem' }}>
                    View & Book Vendor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
