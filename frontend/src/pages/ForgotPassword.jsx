import React, { useState } from 'react';
import { Mail, HelpCircle, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

export default function ForgotPassword({ setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulatedLink, setSimulatedLink] = useState(null);

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    setCurrentPage(pageId);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please input your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setSimulatedLink(null);

    try {
      const data = await api.forgotPassword(email);
      setSuccess('Reset instructions generated!');
      
      if (data.simulated && data.resetUrl) {
        setSimulatedLink(data.resetUrl);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Error executing request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '450px', width: '100%', margin: '40px auto 80px auto' }}>
      <div className="glass-card" style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        
        {/* Back Link */}
        <button
          onClick={() => navigateTo('login')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '20px' }}
        >
          <ArrowLeft style={{ width: '14px' }} /> Back to Sign In
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '50%', width: 'fit-content', margin: '0 auto 16px auto' }}>
            <HelpCircle style={{ color: 'var(--accent-primary)', width: '28px', height: '28px' }} />
          </div>
          <h2>Forgot Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            We'll send a recovery link to your registered email to update your credentials.
          </p>
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

        {/* Simulated developer bypass overlay */}
        {simulatedLink && (
          <div style={{ background: 'var(--bg-tertiary)', border: '1px dashed var(--accent-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '6px' }}>🛠️ Offline Mail Bypass:</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>SMTP is offline. Click the direct link below to reset the password:</p>
            <a
              href={simulatedLink}
              onClick={(e) => {
                e.preventDefault();
                // Extract token and navigate directly to ResetPassword page!
                const url = new URL(simulatedLink);
                const token = url.searchParams.get('token');
                window.location.hash = `reset-password?token=${token}`;
                setCurrentPage('reset-password');
              }}
              style={{ color: 'var(--accent-secondary)', fontWeight: 'bold', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              Reset Password Direct Link
            </a>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail style={{ width: '14px', color: 'var(--accent-primary)' }} /> Registered Email
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Dispatched request...' : 'Send Recovery Email'}
          </button>
        </form>

      </div>
    </div>
  );
}
