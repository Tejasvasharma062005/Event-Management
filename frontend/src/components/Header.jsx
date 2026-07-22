import React from 'react';
import { Sparkles, User, LogOut, Menu, X } from 'lucide-react';
import { api } from '../utils/api';

export default function Header({ currentPage, setCurrentPage, user, setUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.hash = '#home';
    setCurrentPage('home');
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolios' },
    { id: 'about', label: 'About Us' },
    { id: 'help', label: 'Help & FAQ' }
  ];

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-header" style={{ height: '80px', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <a href="#home" onClick={() => navigateTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          <Sparkles style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
          <span>Event<span className="gradient-text">Lux</span></span>
        </a>

        {/* Desktop Nav */}
        <nav style={{ display: 'none', gap: '30px', alignItems: 'center' }} className="desktop-nav-container">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => navigateTo(link.id)}
              style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: currentPage === link.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: currentPage === link.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                padding: '4px 0',
                transition: 'all 0.2s'
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <style>{`
          @media (min-width: 900px) {
            .desktop-nav-container { display: flex !important; }
            .mobile-menu-btn { display: none !important; }
          }
        `}</style>

        {/* Action Button & User Info */}
        <div style={{ display: 'none', gap: '16px', alignItems: 'center' }} className="desktop-nav-container">
          <button
            onClick={() => navigateTo('ai-recommendation')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            AI Quotation
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="#dashboard"
                onClick={() => navigateTo('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: 'var(--bg-tertiary)',
                  padding: '8px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <User style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                <span>
                  {user.role === 'admin'
                    ? 'Admin Panel'
                    : user.role === 'provider'
                    ? 'Provider Portal'
                    : (user.fullName || user.full_name || 'User').split(' ')[0]}
                </span>
              </a>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title="Logout"
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          ) : (
            <a
              href="#login"
              onClick={() => navigateTo('login')}
              className="btn btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Sign In
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {mobileMenuOpen ? <X style={{ width: '28px', height: '28px' }} /> : <Menu style={{ width: '28px', height: '28px' }} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: 0,
            width: '100%',
            height: 'calc(100vh - 80px)',
            background: 'var(--bg-primary)',
            zIndex: 999,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            borderTop: '1px solid var(--border-color)',
            animation: 'fadeInUp 0.3s ease forwards'
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => navigateTo(link.id)}
              style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: currentPage === link.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {link.label}
            </a>
          ))}

          <button
            onClick={() => navigateTo('ai-recommendation')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '10px' }}
          >
            <Sparkles style={{ width: '18px', height: '18px' }} />
            AI Quotation Engine
          </button>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <a
                href="#dashboard"
                onClick={() => navigateTo('dashboard')}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                <User style={{ width: '18px', height: '18px' }} />
                <span>
                  {user.role === 'admin'
                    ? 'Admin Panel'
                    : user.role === 'provider'
                    ? 'Provider Portal'
                    : `Dashboard (${(user.fullName || user.full_name || 'User').split(' ')[0]})`}
                </span>
              </a>
              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                Logout
              </button>
            </div>
          ) : (
            <a
              href="#login"
              onClick={() => navigateTo('login')}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px', textAlign: 'center' }}
            >
              Sign In
            </a>
          )}
        </div>
      )}
    </header>
  );
}
