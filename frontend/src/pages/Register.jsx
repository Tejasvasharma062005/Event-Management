import React, { useState } from 'react';
import { UserPlus, User, Building, Mail, Key, Sparkles, AlertCircle, CheckCircle, Briefcase, FileText, Globe, Eye, Image } from 'lucide-react';
import { api } from '../utils/api';

export default function Register({ setCurrentPage }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user or provider
  
  // Provider detailed states
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('event_manager');
  const [basePrice, setBasePrice] = useState('');
  const [location, setLocation] = useState('Jaipur');
  const [contactPhone, setContactPhone] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 07:00 PM');
  const [website, setWebsite] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      setError('Please fill in all basic details.');
      return;
    }

    if (role === 'provider') {
      if (!businessName || !contactPhone || !aadhaarNumber || !basePrice || !yearsExperience) {
        setError('Please fill in all required business credentials (Business Name, Phone, Aadhaar, Price, Experience).');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const socialLinksJson = JSON.stringify({
      instagram: socialInstagram,
      facebook: socialFacebook
    });

    const payload = {
      email,
      password,
      fullName,
      role,
      businessName,
      category,
      basePrice: parseFloat(basePrice),
      location,
      contactPhone,
      servicesOffered,
      bannerImage,
      businessLogo,
      profilePhoto,
      yearsExperience: parseInt(yearsExperience),
      gstNumber,
      panNumber,
      aadhaarNumber,
      workingHours,
      website,
      socialLinksJson,
      description: serviceDescription
    };

    try {
      await api.register(email, password, fullName, role === 'provider' ? 'provider' : 'user');
      
      // If provider, let's onboard their details directly
      if (role === 'provider') {
        // Automatically log them in to save onboarding details
        const loginData = await api.login(email, password);
        await api.onboardProvider(payload);
        api.logout(); // log out again to let them sign in normally
      }

      setSuccess('Account created successfully! Awaiting administrator approval. Navigating to login page...');
      setTimeout(() => {
        navigateTo('login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'event_manager', name: 'Event Manager' },
    { id: 'decorator', name: 'Decorator' },
    { id: 'caterer', name: 'Caterer' },
    { id: 'invitation_printer', name: 'Invitation Printer' },
    { id: 'venue', name: 'Venue Owner' },
    { id: 'salon', name: 'Salon Expert' },
    { id: 'barber', name: 'Barber' },
    { id: 'laundry', name: 'Laundry Service' },
    { id: 'tailor', name: 'Tailor' },
    { id: 'clothing_brand', name: 'Clothing Brand' },
    { id: 'jewellery_shop', name: 'Jewellery Shop' },
    { id: 'lighting', name: 'Lighting Provider' },
    { id: 'sound', name: 'Sound System Provider' },
    { id: 'music_artist', name: 'Music Artist' },
    { id: 'dance_artist', name: 'Dance Artist' },
    { id: 'dance_group', name: 'Dance Group' },
    { id: 'choreographer', name: 'Choreographer' },
    { id: 'volunteers', name: 'Family Assistant Volunteer' },
    { id: 'security_guards', name: 'Security Guard' },
    { id: 'bouncers', name: 'Bouncer' }
  ];

  const destinations = ['Jaipur', 'Udaipur', 'Goa', 'Delhi', 'Mumbai', 'Kolkata'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: role === 'provider' ? '800px' : '480px', width: '100%', margin: '40px auto 80px auto', transition: 'max-width 0.3s ease' }}>
      <div className="glass-card" style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '50%', width: 'fit-content', margin: '0 auto 16px auto' }}>
            <UserPlus style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
          </div>
          <h2>Join <span className="gradient-text">EventLux</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>Choose your role below to plan events or list your services.</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', padding: '12px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
            <AlertCircle style={{ flexShrink: 0, width: '16px' }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', padding: '12px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
            <CheckCircle style={{ flexShrink: 0, width: '16px' }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Role Selection tab toggle */}
          <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: 'var(--border-radius-sm)' }}>
            <button
              type="button"
              onClick={() => setRole('user')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: role === 'user' ? 'var(--accent-primary)' : 'transparent',
                color: role === 'user' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              <User style={{ width: '14px' }} /> Customer User
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: role === 'provider' ? 'var(--accent-secondary)' : 'transparent',
                color: role === 'provider' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              <Building style={{ width: '14px' }} /> Service Provider Partner
            </button>
          </div>

          {/* Core Credentials Section */}
          <div style={{ display: 'grid', gridTemplateColumns: role === 'provider' ? '1fr 1fr' : '1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles style={{ width: '14px', color: 'var(--accent-primary)' }} /> Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail style={{ width: '14px', color: 'var(--accent-secondary)' }} /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: role === 'provider' ? 'span 2' : 'span 1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Key style={{ width: '14px', color: '#10b981' }} /> Password
              </label>
              <input
                type="password"
                required
                placeholder="•••••••• (Min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* Provider Specific Sections */}
          {role === 'provider' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              
              {/* Business details */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase style={{ width: '16px', color: 'var(--accent-primary)' }} /> Business Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Royal Events"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Service Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-control"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Base Price (INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Years of Experience *</label>
                    <input
                      type="number"
                      required
                      placeholder="5"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>City Location *</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="form-control"
                    >
                      {destinations.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 99999 88888"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Working Hours</label>
                    <input
                      type="text"
                      placeholder="09:00 AM - 07:00 PM"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Website (optional)</label>
                    <input
                      type="text"
                      placeholder="www.mybrand.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Verification & Credentials */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText style={{ width: '16px', color: 'var(--accent-secondary)' }} /> Verification & IDs
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Aadhaar Card Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="1234-5678-9012"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>PAN Card Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label>GST Registration Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="08AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Profiles & Media */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Image style={{ width: '16px', color: '#10b981' }} /> Banners & Photos
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Profile Photo URL</label>
                    <input
                      type="text"
                      placeholder="https://unsplash.com/..."
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Business Logo URL</label>
                    <input
                      type="text"
                      placeholder="https://unsplash.com/..."
                      value={businessLogo}
                      onChange={(e) => setBusinessLogo(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label>Cover Banner Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-1511..."
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe style={{ width: '16px', color: '#fbbf24' }} /> Social Channels
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Instagram Handle (e.g. brand_insta)</label>
                    <input
                      type="text"
                      placeholder="mybrand_insta"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Facebook Page Handle</label>
                    <input
                      type="text"
                      placeholder="mybrand_fb"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label>Services Offered Details (Comma separated list)</label>
                    <input
                      type="text"
                      placeholder="Bridal Stage, LED Board, Pathways floral design"
                      value={servicesOffered}
                      onChange={(e) => setServicesOffered(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label>Business Description Narrative</label>
                    <textarea
                      placeholder="Briefly showcase your expertise, work background, previous notable clients..."
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="form-control"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Registering credentials...' : 'Register Account'}
          </button>
        </form>

        {/* Login suggestion */}
        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <a
            href="#login"
            onClick={() => navigateTo('login')}
            style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
          >
            Sign In
          </a>
        </div>

      </div>
    </div>
  );
}
