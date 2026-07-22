import React, { useState } from 'react';
import { LogIn, Key, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ setUser, setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.login(email, password);
      setSuccess('Logged in successfully! Redirecting...');
      setTimeout(async () => {
        // Fetch full profile info to set in parent state
        try {
          const profile = await api.getMe();
          setUser(profile.user);
          navigateTo('dashboard');
        } catch (err) {
          setError('Failed to resolve profile after login.');
        }
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '450px', width: '100%', margin: '40px auto 80px auto' }}>
      <div className="glass-card" style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '50%', width: 'fit-content', margin: '0 auto 16px auto' }}>
            <LogIn style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
          </div>
          <h2>Sign In to <span className="gradient-text">EventLux</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>Manage bookings, build portfolios, and save quotes.</p>
        </div>

        {/* Notices */}
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
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail style={{ width: '14px', color: 'var(--accent-primary)' }} /> Email Address
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

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Key style={{ width: '14px', color: 'var(--accent-secondary)' }} /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>

          {/* Forgot Pass link */}
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <a
              href="#forgot-password"
              onClick={() => navigateTo('forgot-password')}
              style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Register suggestion */}
        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <a
            href="#register"
            onClick={() => navigateTo('register')}
            style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}
          >
            Create account
          </a>
        </div>

      </div>
    </div>
  );
}
