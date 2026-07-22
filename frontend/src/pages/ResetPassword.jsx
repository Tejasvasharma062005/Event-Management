import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api';

export default function ResetPassword({ setCurrentPage }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Parse token from hash parameter
  useEffect(() => {
    const parseToken = () => {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const tok = queryParams.get('token');
        if (tok) {
          setToken(tok);
          setError(null);
        } else {
          setError('Invalid recovery link. Reset token is missing.');
        }
      } else {
        setError('Invalid recovery link. Reset token is missing.');
      }
    };
    parseToken();
    window.addEventListener('hashchange', parseToken);
    return () => window.removeEventListener('hashchange', parseToken);
  }, []);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token is missing. Cannot reset password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.resetPassword(token, newPassword);
      setSuccess('Password updated successfully! Navigating to login...');
      setTimeout(() => {
        window.location.hash = '#login';
        setCurrentPage('login');
      }, 1500);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Error updating password.');
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
            <ShieldAlert style={{ color: 'var(--accent-secondary)', width: '28px', height: '28px' }} />
          </div>
          <h2>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            Enter a secure, new password for your EventLux profile.
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

        {/* Form */}
        <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Key style={{ width: '14px', color: 'var(--accent-primary)' }} /> New Password
            </label>
            <input
              type="password"
              required
              disabled={!token}
              placeholder="•••••••• (Min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Saving updates...' : 'Save Password'}
          </button>
        </form>

      </div>
    </div>
  );
}
