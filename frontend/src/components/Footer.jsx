import React from 'react';
import { Sparkles, Mail, Phone, MapPin, Shield, HelpCircle } from 'lucide-react';

export default function Footer({ setCurrentPage }) {
  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '60px 24px 30px 24px', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* Brand Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <a href="#home" onClick={() => navigateTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            <Sparkles style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
            <span>Event<span className="gradient-text">Lux</span></span>
          </a>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            A premium full-stack event orchestration suite powered by real-time database integrations and heuristic AI recommendation engines.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.1rem' }}>Sitemap</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <li><a href="#home" onClick={() => navigateTo('home')} style={{ hover: 'color: white' }}>Home</a></li>
            <li><a href="#services" onClick={() => navigateTo('services')}>Services</a></li>
            <li><a href="#portfolio" onClick={() => navigateTo('portfolio')}>Portfolios</a></li>
            <li><a href="#about" onClick={() => navigateTo('about')}>About Us</a></li>
            <li><a href="#help" onClick={() => navigateTo('help')}>Help & FAQ</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.1rem' }}>Categories</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <li>Caterers & Decorators</li>
            <li>Mehandi & Makeup Artists</li>
            <li>Clothing & Tailoring</li>
            <li>Volunteers & Cleaners</li>
            <li>Laundry & Salon Experts</li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.1rem' }}>Contact Info</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
              <span>support@eventlux.com</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
              <span>+91 99999 88888</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
              <span>Rajasthan, India</span>
            </li>
          </ul>
        </div>

      </div>

      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>&copy; {new Date().getFullYear()} EventLux. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield style={{ width: '12px', height: '12px' }} /> Privacy Policy
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle style={{ width: '12px', height: '12px' }} /> Terms of Service
          </span>
        </div>
      </div>
    </footer>
  );
}
