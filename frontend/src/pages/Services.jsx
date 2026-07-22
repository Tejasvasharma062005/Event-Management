import React, { useState, useEffect } from 'react';
import { Search, MapPin, Tag, Star, Calendar, MessageSquare, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Services({ user, setCurrentPage }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');

  // Booking/Detail State
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Parse category from URL query hash parameters e.g., #services?category=caterer
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const cat = queryParams.get('category');
        if (cat) setCategory(cat);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await api.getProviders({ category, location, minPrice, maxPrice, search });
      setProviders(data);
      setError(null);
    } catch (err) {
      console.error('Fetch providers error:', err);
      setError('Could not fetch services list. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [category, location, minPrice, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  const selectProviderForDetails = async (provider) => {
    try {
      const details = await api.getProviderDetails(provider.id);
      setSelectedProvider(details.provider);
      setPortfolios(details.portfolios || []);
      setReviews(details.reviews || []);
      setBookingSuccess(false);
      setBookingError(null);
      setBookingDate('');
    } catch (err) {
      console.error('Fetch provider details error:', err);
      alert('Could not fetch provider details');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to request a booking.');
      setCurrentPage('login');
      window.location.hash = '#login';
      return;
    }

    if (!bookingDate) {
      setBookingError('Please select a valid event date.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      await api.createBooking({
        providerId: selectedProvider.id,
        eventDate: bookingDate,
        totalPrice: selectedProvider.base_price
      });
      setBookingSuccess(true);
    } catch (err) {
      console.error('Booking creation error:', err);
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const getFriendlyCategory = (cat) => {
    const mapping = {
      event_manager: 'Event Manager',
      decorator: 'Stage & Floral Decor',
      caterer: 'Catering Service',
      invitation_printer: 'Invitation Printer',
      venue: 'Luxury Venue',
      salon: 'Bridal Makeovers & Salon',
      barber: 'Grooming Barber',
      laundry: 'Express Laundry',
      tailor: 'Bespoke Tailor',
      clothing_brand: 'Clothing Brand',
      jewellery_shop: 'Jewellery Shop',
      lighting: 'Ambient Lighting',
      sound: 'Sound System',
      music_artist: 'Music Artist',
      dance_artist: 'Dance Artist',
      dance_group: 'Dance Group & Troupe',
      choreographer: 'Dance Choreographer',
      volunteers: 'Event Volunteer',
      security_guards: 'Security Guard',
      bouncers: 'VVIP Bouncer'
    };
    return mapping[cat] || cat;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Title */}
      <section style={{ textAlign: 'center', padding: '20px 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Explore Professional <span className="gradient-text">Services</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Filter by department or search specifically for verified event vendors.</p>
      </section>

      {/* Filter and Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* Filters Sidebar */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search style={{ width: '18px', color: 'var(--accent-primary)' }} /> Filters
          </h3>

          {/* Search text */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search vendor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
              Go
            </button>
          </form>

          {/* Category Dropdown */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-control">
              <option value="">All Departments</option>
              <option value="event_manager">Event Manager</option>
              <option value="decorator">Stage & Floral Decor</option>
              <option value="caterer">Catering Services</option>
              <option value="invitation_printer">Invitation Printer</option>
              <option value="venue">Luxury Venues</option>
              <option value="salon">Bridal Makeovers & Salon</option>
              <option value="barber">Grooming Barber</option>
              <option value="laundry">Express Laundry</option>
              <option value="tailor">Tailors</option>
              <option value="clothing_brand">Clothing Brands</option>
              <option value="jewellery_shop">Jewellery Shops</option>
              <option value="lighting">Ambient Lighting</option>
              <option value="sound">Sound Systems</option>
              <option value="music_artist">Music Artists</option>
              <option value="dance_artist">Dance Artists</option>
              <option value="dance_group">Dance Groups & Troupes</option>
              <option value="choreographer">Dance Choreographers</option>
              <option value="volunteers">Event Volunteers</option>
              <option value="security_guards">Security Guards</option>
              <option value="bouncers">VVIP Bouncers</option>
            </select>
          </div>

          {/* Location Dropdown */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Destination Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="form-control">
              <option value="">All Destinations</option>
              <option value="delhi">Delhi</option>
              <option value="mumbai">Mumbai</option>
              <option value="jaipur">Jaipur</option>
              <option value="udaipur">Udaipur</option>
              <option value="goa">Goa</option>
              <option value="kolkata">Kolkata</option>
            </select>
          </div>

          {/* Price Range */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Min Rate</label>
              <input
                type="number"
                placeholder="INR Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Max Rate</label>
              <input
                type="number"
                placeholder="INR Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setCategory('');
              setLocation('');
              setMinPrice('');
              setMaxPrice('');
              setSearch('');
            }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
          >
            Reset Filters
          </button>
        </div>

        {/* Vendors Listing Grid */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertCircle style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulseGlow 1s linear infinite', margin: '0 auto 20px auto' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Scanning SQL Database...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <MapPin style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No matching service providers found.</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Try relaxing your budget, query, or destination filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {providers.map((provider) => (
                <div key={provider.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                  <div style={{ height: '160px', width: '100%', position: 'relative' }}>
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
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                      <span className="badge badge-primary">{getFriendlyCategory(provider.category)}</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{provider.business_name}</h3>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: '14px', color: 'var(--accent-primary)' }} />
                        {provider.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag style={{ width: '14px', color: 'var(--accent-secondary)' }} />
                        INR {provider.base_price.toLocaleString()}{provider.category === 'caterer' || provider.category === 'salon' ? '/plate' : ' starting'}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineClamp: '2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                      {provider.description}
                    </p>

                    <button
                      onClick={() => selectProviderForDetails(provider)}
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: 'auto', padding: '10px' }}
                    >
                      View Details & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Details & Booking Modal overlay */}
      {selectedProvider && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setSelectedProvider(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              padding: '0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner/Intro details */}
            <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '240px', width: '100%', position: 'relative' }}>
                <img
                  src={selectedProvider.banner_image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'}
                  alt={selectedProvider.business_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={() => setSelectedProvider(null)}
                  style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="badge badge-primary" style={{ width: 'fit-content' }}>
                  {getFriendlyCategory(selectedProvider.category)}
                </span>
                
                <h2 style={{ fontSize: '1.8rem' }}>{selectedProvider.business_name}</h2>
                
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin style={{ width: '16px', color: 'var(--accent-primary)' }} />
                    {selectedProvider.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: '16px', fill: '#fbbf24', color: '#fbbf24' }} />
                    {selectedProvider.rating.toFixed(1)} Rating
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{selectedProvider.description}</p>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Services Rendered:</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {selectedProvider.services_offered || 'Standard specialized service packages.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolios & Booking Request Panel */}
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Portfolio Grid preview */}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Portfolio Showcase</h3>
                {portfolios.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No portfolio images uploaded by this vendor yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {portfolios.map((item) => (
                      <div key={item.id} style={{ height: '70px', borderRadius: '4px', overflow: 'hidden' }} title={item.title}>
                        <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Reviews Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Customer Reviews</h3>
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet for this vendor.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {reviews.map((rev) => (
                      <div key={rev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--border-radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rev.reviewer_name}</span>
                          <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Request Form */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ color: 'var(--accent-secondary)', width: '18px' }} />
                  Request Booking
                </h3>

                {bookingSuccess ? (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', padding: '16px', borderRadius: 'var(--border-radius-sm)', textAlign: 'center' }}>
                    <CheckCircle style={{ width: '32px', height: '32px', margin: '0 auto 8px auto' }} />
                    <h4>Booking Request Submitted!</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      Vendor has been notified. Check status on your client Dashboard.
                    </p>
                    <button onClick={() => setSelectedProvider(null)} className="btn btn-secondary" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '0.8rem' }}>
                      Close Detail Screen
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Event Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="form-control"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimated Rate:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        INR {selectedProvider.base_price.toLocaleString()}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {selectedProvider.category === 'caterer' || selectedProvider.category === 'salon' ? '/unit' : ' total'}
                        </span>
                      </span>
                    </div>

                    {bookingError && (
                      <p style={{ color: '#fb7185', fontSize: '0.85rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <AlertCircle style={{ width: '14px' }} /> {bookingError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      {isSubmittingBooking ? 'Submitting request...' : 'Confirm Request Booking'}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
