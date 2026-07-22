import React, { useState } from 'react';
import { Sparkles, Calendar, DollarSign, MapPin, Compass, Users, Check, ChevronRight, ChevronLeft, RefreshCw, Bookmark, Shield, Home, Eye } from 'lucide-react';
import { api } from '../utils/api';

export default function AIRecommendation({ user, setCurrentPage }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  
  // Quiz Form inputs
  const [eventType, setEventType] = useState('Wedding');
  const [budget, setBudget] = useState(600000);
  const [guests, setGuests] = useState(150);
  const [duration, setDuration] = useState('3'); // in days/hours
  const [eventDate, setEventDate] = useState('2026-12-15');
  
  const [destination, setDestination] = useState('Udaipur');
  const [venue, setVenue] = useState('');
  const [theme, setTheme] = useState('Royal');
  const [indoorOutdoor, setIndoorOutdoor] = useState('Outdoor');

  const [decorationPref, setDecorationPref] = useState('Heavy traditional gold drapery');
  const [foodPref, setFoodPref] = useState('Traditional Royal Mughlai');
  const [musicPref, setMusicPref] = useState('Sufi Live Band');

  const [securityReq, setSecurityReq] = useState('Yes');
  const [photographyReq, setPhotographyReq] = useState('Yes');
  const [accommodationReq, setAccommodationReq] = useState('Yes');
  
  const [specialReq, setSpecialReq] = useState('');

  // Result state
  const [quotation, setQuotation] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const eventTypes = ['Wedding', 'Birthday Party', 'Corporate Event', 'Sangeet / Mehandi', 'Anniversary Celebration'];
  const destinations = ['Udaipur', 'Jaipur', 'Goa', 'Delhi', 'Mumbai', 'Kolkata'];
  const themes = [
    { name: 'Royal', icon: '👑', desc: 'Regal canopies, brass lights, and traditional elements.' },
    { name: 'Minimalist', icon: '🍃', desc: 'Modern pastel themes, soft lighting, and eco focus.' },
    { name: 'Floral', icon: '🌸', desc: 'Extensive flower paths, backdrops, and rose canopies.' },
    { name: 'Modern Glow', icon: '⚡', desc: 'Neon stages, futuristic lasers, and high-tech sound.' },
    { name: 'Vintage', icon: '📜', desc: 'Classical chandeliers, retro colors, and wood layouts.' }
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const runRecommendationEngine = async () => {
    setStep(6);
    setLoading(true);
    
    const progressMsgs = [
      'Scanning local SQL approved providers database...',
      'Matching venues and decorators in Udaipur & Jaipur...',
      'Assessing food preferences and plate calculations...',
      'Matching sound systems, artists, and live band performers...',
      'Allocating volunteers and security details...',
      'Verifying total platform fee estimations...',
      'Finalizing itemized quotation and professional timeline...'
    ];

    progressMsgs.forEach((msg, idx) => {
      setTimeout(() => {
        setLoaderMessage(msg);
      }, idx * 300);
    });

    setTimeout(async () => {
      try {
        const result = await api.generateRecommendation({
          eventType,
          budget,
          guests,
          duration,
          theme,
          indoorOutdoor,
          destination,
          venue,
          eventDate,
          decorationPref,
          foodPref,
          musicPref,
          securityReq,
          photographyReq,
          accommodationReq,
          specialReq
        });
        setQuotation(result);
        setIsSaved(!!user);
        setStep(7);
      } catch (err) {
        console.error(err);
        alert('Could not compute proposal quotation. Check backend.');
        setStep(5);
      } finally {
        setLoading(false);
      }
    }, progressMsgs.length * 300 + 100);
  };

  const saveQuotationToProfile = async () => {
    if (!user) {
      alert('Please Sign In or Register to save quotations permanently.');
      setCurrentPage('login');
      window.location.hash = '#login';
      return;
    }
    setIsSaved(true);
    alert('Quotation successfully stored in your profile database!');
  };

  const handleBookVendor = async (providerId, estPrice) => {
    if (!user) {
      alert('Please Sign In or Register to request booking.');
      setCurrentPage('login');
      window.location.hash = '#login';
      return;
    }
    try {
      await api.createBooking({
        providerId,
        eventDate,
        totalPrice: estPrice,
        quotationId: quotation.quotationId
      });
      alert('Booking request submitted to partner. Review details in Dashboard.');
    } catch (err) {
      alert(err.message || 'Failed to submit booking.');
    }
  };

  const getFriendlyCategory = (cat) => {
    const mapping = {
      event_manager: 'Event Manager',
      decorator: 'Decorator',
      caterer: 'Caterer',
      invitation_printer: 'Invitation Printer',
      venue: 'Venue Owner',
      salon: 'Salon Expert',
      barber: 'Barber',
      laundry: 'Laundry Service',
      tailor: 'Tailor',
      clothing_brand: 'Clothing Brand',
      jewellery_shop: 'Jewellery Shop',
      lighting: 'Lighting Provider',
      sound: 'Sound System Provider',
      music_artist: 'Music Artist',
      dance_artist: 'Dance Artist',
      dance_group: 'Dance Group',
      choreographer: 'Choreographer',
      volunteers: 'Family Volunteer',
      security_guards: 'Security Guard',
      bouncers: 'Bouncer'
    };
    return mapping[cat] || cat;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '750px', width: '100%', margin: '40px auto 80px auto' }}>
      
      {/* Wizard Header (Steps 1 to 5) */}
      {step <= 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', textAlign: 'center' }}>
          <div className="badge badge-primary" style={{ alignSelf: 'center' }}>
            AI Planner Wizard
          </div>
          <h1>Generate Custom <span className="gradient-text">Event Quotation</span></h1>
          
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  background: step >= s ? 'var(--accent-primary)' : 'transparent',
                  transition: 'background 0.3s ease'
                }}
              ></div>
            ))}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Section {step} of 5: Configure event requirements</p>
        </div>
      )}

      {/* STEP 1: EVENT METRICS */}
      {step === 1 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3><span style={{ color: 'var(--accent-primary)' }}>Step 1:</span> Basic Event Parameters</h3>
          
          <div className="form-group">
            <label>Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="form-control">
              {eventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Event Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Event Duration (in days)</label>
              <input
                type="number"
                required
                min="1"
                max="10"
                className="form-control"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Expected Guests ({guests} Pax)</label>
            <input
              type="range"
              min="10"
              max="2000"
              step="10"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>10 Guests</span>
              <span>2,000 Guests</span>
            </div>
          </div>

          <div className="form-group">
            <label>Target Budget Limit (INR: {budget.toLocaleString()})</label>
            <input
              type="range"
              min="50000"
              max="5000000"
              step="50000"
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>INR 50,000</span>
              <span>INR 50,00,000 (50 Lakhs)</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={handleNext} className="btn btn-primary">
              Next Step <ChevronRight style={{ width: '16px' }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SETTING & DESTINATION */}
      {step === 2 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3><span style={{ color: 'var(--accent-secondary)' }}>Step 2:</span> Destination & Venue Settings</h3>
          
          <div className="form-group">
            <label>Target City</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className="form-control">
              {destinations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Specific Venue (Optional)</label>
            <input
              type="text"
              placeholder="E.g. Jagmandir Palace Udaipur, Grand Hyatt, or Home"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Venue Setting Layout</label>
            <select value={indoorOutdoor} onChange={(e) => setIndoorOutdoor(e.target.value)} className="form-control">
              <option value="Indoor">Indoor (Banquet Hall, Ballroom)</option>
              <option value="Outdoor">Outdoor (Beachfront lawn, garden yard)</option>
              <option value="Hybrid">Hybrid (Indoor halls + Outdoor setups)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Event Theme</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {themes.map((t) => (
                <div
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    padding: '16px',
                    background: theme === t.name ? 'var(--bg-tertiary)' : 'rgba(25,28,48,0.3)',
                    borderColor: theme === t.name ? 'var(--accent-primary)' : 'var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                  <h4 style={{ fontSize: '0.95rem' }}>{t.name}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button onClick={handleBack} className="btn btn-secondary">
              <ChevronLeft style={{ width: '16px' }} /> Back
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              Next Step <ChevronRight style={{ width: '16px' }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FOOD & ENTERTAINMENT */}
      {step === 3 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3><span style={{ color: '#fbbf24' }}>Step 3:</span> Catering & Decors Preferences</h3>
          
          <div className="form-group">
            <label>Food & Catering Style</label>
            <select value={foodPref} onChange={(e) => setFoodPref(e.target.value)} className="form-control">
              <option value="Traditional Royal Mughlai">Traditional Royal Mughlai Buffet</option>
              <option value="Pure Veg Buffet">Pure Vegetarian Buffet</option>
              <option value="Multi-cuisine Live">Multi-cuisine Live Counters (Italian/Thai/Continental)</option>
              <option value="Standard Fast Food">Standard Fast Food & Starter Platters</option>
            </select>
          </div>

          <div className="form-group">
            <label>Decor and Floral Layout Style</label>
            <select value={decorationPref} onChange={(e) => setDecorationPref(e.target.value)} className="form-control">
              <option value="Heavy traditional gold drapery">Heavy Traditional Gold & Canopy Mandap Drapery</option>
              <option value="Minimalist pastel floral">Minimalist Pastel Flower Pathways & Wooden Arches</option>
              <option value="Neon/laser lights">Modern Neon Lighting & Cyber Stages</option>
              <option value="Vintage wood details">Retro Chandeliers & Dark Oak Wood Panels</option>
            </select>
          </div>

          <div className="form-group">
            <label>Music & Performing Artists</label>
            <select value={musicPref} onChange={(e) => setMusicPref(e.target.value)} className="form-control">
              <option value="Sufi Live Band">Sufi Live Band Fusion Ensemble</option>
              <option value="High energy DJ soundboard">High Energy DJ Soundboard & EDM Dancefloor</option>
              <option value="Classical Sitar">Classical Instrumental Sitar & Flute Recital</option>
              <option value="Solo Kathak/Bollywood">Bollywood / Traditional Dance Performers</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button onClick={handleBack} className="btn btn-secondary">
              <ChevronLeft style={{ width: '16px' }} /> Back
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              Next Step <ChevronRight style={{ width: '16px' }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SECURITY & LOGISTICS */}
      {step === 4 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3><span style={{ color: '#10b981' }}>Step 4:</span> Safety & Logistics Settings</h3>
          
          <div className="form-group">
            <label>Do you require stage/VVIP security bouncers and guards?</label>
            <select value={securityReq} onChange={(e) => setSecurityReq(e.target.value)} className="form-control">
              <option value="Yes">Yes, deploy professional guards and bouncers</option>
              <option value="No">No security personnel needed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Do you require professional photography & videography?</label>
            <select value={photographyReq} onChange={(e) => setPhotographyReq(e.target.value)} className="form-control">
              <option value="Yes">Yes, include media package recommendations</option>
              <option value="No">No photography package required</option>
            </select>
          </div>

          <div className="form-group">
            <label>Do you require family hotel accommodation coordination?</label>
            <select value={accommodationReq} onChange={(e) => setAccommodationReq(e.target.value)} className="form-control">
              <option value="Yes">Yes, match local venue rooms and lodging</option>
              <option value="No">No lodging services required</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button onClick={handleBack} className="btn btn-secondary">
              <ChevronLeft style={{ width: '16px' }} /> Back
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              Next Step <ChevronRight style={{ width: '16px' }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SPECIAL INSTRUCTIONS */}
      {step === 5 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3><span style={{ color: 'var(--accent-primary)' }}>Step 5:</span> Add Special Instructions</h3>
          
          <div className="form-group">
            <label>Special Instructions & Personal Demands</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="E.g. We require wheelchair access for all pathways, organic vegan catering only, or a custom sky lantern ceremony at night..."
              value={specialReq}
              onChange={(e) => setSpecialReq(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={handleBack} className="btn btn-secondary">
              <ChevronLeft style={{ width: '16px' }} /> Back
            </button>
            <button onClick={runRecommendationEngine} className="btn btn-primary">
              <Sparkles style={{ width: '16px' }} /> Compute Quotation
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: LOADER */}
      {step === 6 && (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--border-color)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid transparent', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          
          <h3>EventLux Heuristic Orchestration</h3>
          <p style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.05rem', minHeight: '30px' }}>
            {loaderMessage}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Matching requirements with approved database registers...</p>
        </div>
      )}

      {/* STEP 7: PRESENTATION RESULTS */}
      {step === 7 && quotation && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Header Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '2px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-gold" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Sparkles style={{ width: '12px' }} /> Heuristic AI Quotation
                </span>
                <h2 style={{ fontSize: '1.8rem', marginTop: '8px' }}>Quotation: {eventType} Plan</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={saveQuotationToProfile}
                  className="btn btn-secondary"
                  disabled={isSaved}
                  style={{ display: 'flex', gap: '6px', padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Bookmark style={{ width: '14px', fill: isSaved ? 'white' : 'transparent' }} />
                  {isSaved ? 'Stored in DB' : 'Save to Profile'}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', gap: '6px', padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <RefreshCw style={{ width: '14px' }} /> Plan Another
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Destination</span>
                <p style={{ fontWeight: 'bold' }}>{destination}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Guests</span>
                <p style={{ fontWeight: 'bold' }}>{guests} Pax</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Theme Style</span>
                <p style={{ fontWeight: 'bold' }}>{theme}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duration</span>
                <p style={{ fontWeight: 'bold' }}>{duration} Days</p>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '6px' }}>AI Orchestration Summary:</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {quotation.summaryNarrative}
              </p>
            </div>

            {quotation.suggestedThemeDetails && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <h4 style={{ marginBottom: '4px' }}>Ambience and Styling Advice:</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{quotation.suggestedThemeDetails}</p>
              </div>
            )}

            {quotation.suggestedDestinationDetails && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <h4 style={{ marginBottom: '4px' }}>Destination Insights:</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{quotation.suggestedDestinationDetails}</p>
              </div>
            )}
          </div>

          {/* Budget Meter */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Computed Cost: <strong>INR {quotation.totalCost.toLocaleString()}</strong></span>
              <span>Target Budget Limit: <strong>INR {budget.toLocaleString()}</strong></span>
            </div>
            
            <div style={{ height: '14px', background: 'var(--bg-tertiary)', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${Math.min(100, (quotation.totalCost / budget) * 100)}%`,
                  background: quotation.totalCost > budget ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                  transition: 'width 1s ease'
                }}
              ></div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>
              Status: <span style={{ color: quotation.totalCost > budget ? '#fb7185' : '#34d399', fontWeight: 600 }}>{quotation.statusText}</span>
            </p>
          </div>

          {/* Heuristic Budget Allocation Breakdown */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign style={{ color: '#fbbf24', width: '20px' }} />
              Heuristic Budget Allocation Breakdown
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Compare target category allocation (based on heuristic prioritizations) against actual matched vendor rates:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quotation.vendors.map((vendor, idx) => {
                const targetPercentage = {
                  venue: 0.25,
                  caterer: 0.25,
                  decorator: 0.15,
                  event_manager: 0.10,
                  clothing_brand: 0.05,
                  jewellery_shop: 0.05,
                  lighting: 0.03,
                  sound: 0.02,
                  music_artist: 0.03,
                  volunteers: 0.02,
                  security_guards: 0.02,
                  bouncers: 0.02,
                  salon: 0.01,
                  laundry: 0.01
                }[vendor.category] || 0.05;

                const targetAllocatedAmount = Math.round(budget * targetPercentage);
                const actualAmount = vendor.estimatedPrice;
                const ratio = Math.min(100, Math.round((actualAmount / targetAllocatedAmount) * 100));

                return (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getFriendlyCategory(vendor.category)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target priority: {Math.round(targetPercentage * 100)}%</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Allocated: <strong>INR {targetAllocatedAmount.toLocaleString()}</strong>
                        </span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: actualAmount > targetAllocatedAmount ? '#fb7185' : '#34d399', marginTop: '2px' }}>
                          Matched: INR {actualAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${ratio}%`,
                          background: actualAmount > targetAllocatedAmount ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                          borderRadius: '4px',
                          height: '100%'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Timeline */}
          {quotation.timeline && quotation.timeline.length > 0 && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ color: 'var(--accent-primary)', width: '20px' }} />
                Suggested Event Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quotation.timeline.map((stepNode, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                    <div style={{ background: 'var(--accent-glow)', border: '2px solid var(--accent-primary)', borderRadius: '50%', width: '12px', height: '12px', marginTop: '6px', flexShrink: 0 }}></div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stepNode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Vendors Checklist */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Matched Local Providers Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quotation.vendors.map((vendor, idx) => (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '20px 24px',
                    background: 'rgba(25, 28, 48, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="badge badge-primary" style={{ width: 'fit-content', fontSize: '0.65rem' }}>{getFriendlyCategory(vendor.category)}</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{vendor.businessName}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Location: {vendor.location}</span>
                      <span>Rating: {vendor.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated Cost Allocation</span>
                      <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>INR {vendor.estimatedPrice.toLocaleString()}</p>
                    </div>
                    
                    <button
                      onClick={() => handleBookVendor(vendor.providerId, vendor.estimatedPrice)}
                      className="btn btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                    >
                      Book Vendor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!user && (
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '20px', borderRadius: 'var(--border-radius-sm)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                You are currently viewing this quotation as a guest. Log in to save it to your dashboard database.
              </p>
              <button onClick={() => { setCurrentPage('login'); window.location.hash = '#login'; }} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Log In / Register
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
export { AIRecommendation };
