import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Help from './pages/Help';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AIRecommendation from './pages/AIRecommendation';
import { api } from './utils/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Sync token session on mount
  useEffect(() => {
    const syncSession = async () => {
      const token = localStorage.getItem('event_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          api.logout();
        }
      }
      setSessionLoading(false);
    };

    syncSession();
  }, []);

  // Handle Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      // Strip query parameters for routing state, e.g. #services?category=caterer -> services
      const pageId = hash.substring(1).split('?')[0] || 'home';
      
      const validPages = [
        'home', 'services', 'portfolio', 'about', 'help', 
        'login', 'register', 'forgot-password', 'reset-password', 
        'dashboard', 'ai-recommendation'
      ];

      if (validPages.includes(pageId)) {
        setCurrentPage(pageId);
      } else {
        setCurrentPage('home');
        window.location.hash = '#home';
      }
    };

    // Trigger on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protect Dashboard Route
  useEffect(() => {
    if (!sessionLoading) {
      if (currentPage === 'dashboard' && !user) {
        window.location.hash = '#login';
        setCurrentPage('login');
      }
    }
  }, [currentPage, user, sessionLoading]);

  const renderActivePage = () => {
    if (sessionLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulseGlow 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading EventLux Session...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;
      case 'services':
        return <Services user={user} setCurrentPage={setCurrentPage} />;
      case 'portfolio':
        return <Portfolio />;
      case 'about':
        return <About />;
      case 'help':
        return <Help />;
      case 'login':
        return <Login setUser={setUser} setCurrentPage={setCurrentPage} />;
      case 'register':
        return <Register setCurrentPage={setCurrentPage} />;
      case 'forgot-password':
        return <ForgotPassword setCurrentPage={setCurrentPage} />;
      case 'reset-password':
        return <ResetPassword setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return <Dashboard user={user} setUser={setUser} />;
      case 'ai-recommendation':
        return <AIRecommendation user={user} setCurrentPage={setCurrentPage} />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <div className="background-video-wrapper">
        <video autoPlay loop muted playsInline className="background-video">
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="background-video-overlay"></div>
      </div>
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} setUser={setUser} />
      <main className="main-content">
        {renderActivePage()}
      </main>
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}
