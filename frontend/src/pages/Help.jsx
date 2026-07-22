import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});

  // Support Chat State
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Welcome to EventLux Support. How can I help you plan your event today?", sender: 'system' }
  ]);
  const [inputVal, setInputVal] = useState('');

  const faqs = [
    {
      q: "How does the AI Recommendation Engine generate the quotation?",
      a: "The AI recommendation engine uses a scoring matching algorithm. It takes your event parameters (budget, guests, destination, theme) and divides your target budget across 11 vendor categories (caterers, decorators, makeup, etc.) using priority weights. It then queries the database for providers matching your destination, scores them based on proximity to the category budget and vendor rating, and builds an itemized, custom-tailored quotation."
    },
    {
      q: "Can I register as a Service Provider?",
      a: "Yes! During registration, select the 'Service Provider' role. Once registered, you can log in, access your Provider Dashboard, configure your business details (category, base rates, phone, location), and upload portfolios."
    },
    {
      q: "How do I reset my password if I forget it?",
      a: "Click 'Sign In' -> 'Forgot Password'. Enter your registered email address. The system will look up your account and dispatch a real email using Nodemailer (configured in backend/.env). Click the link in the email, enter your new password, and your access is immediately restored."
    },
    {
      q: "Is this app connected to a real database?",
      a: "Yes. The backend uses a local SQLite database (`event_management.db`). Registration, vendor profiles, portfolio files, custom quotations, and event bookings are saved to the relational tables in real-time."
    }
  ];

  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now(), text: inputVal, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Simulate system response
    setTimeout(() => {
      let replyText = "Thanks for your question. You can try our AI Recommendation engine in the navbar to generate an instant event quote, or register a service provider account to list your business!";
      if (inputVal.toLowerCase().includes('budget') || inputVal.toLowerCase().includes('quote')) {
        replyText = "To get a quotation, please navigate to the 'AI Recommendation' page, input your event parameters, and click generate. It scans all live caterers, decorators, and makeup artists in real-time.";
      } else if (inputVal.toLowerCase().includes('reset') || inputVal.toLowerCase().includes('password')) {
        replyText = "If you forgot your password, go to the Sign In page and click 'Forgot Password'. It will trigger an email reset token.";
      } else if (inputVal.toLowerCase().includes('onboard') || inputVal.toLowerCase().includes('register')) {
        replyText = "You can register as a vendor by selecting 'Service Provider' role on the Register page. Once logged in, upload your portfolios in the Dashboard.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: replyText, sender: 'system' }]);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* Banner */}
      <section style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Help & <span className="gradient-text">Support</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '650px', margin: '0 auto' }}>
          Have questions about setting up your provider profile or generating quotes? Browse our FAQs or chat with our live support bot.
        </p>
      </section>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        
        {/* FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2>Frequently Asked Questions</h2>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ marginBottom: '10px' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="glass-card"
                style={{ padding: '20px', cursor: 'pointer', background: 'rgba(25, 28, 48, 0.4)' }}
                onClick={() => toggleFaq(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle style={{ width: '18px', color: 'var(--accent-primary)' }} />
                    {faq.q}
                  </h4>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                    {faqOpen[index] ? '−' : '+'}
                  </span>
                </div>
                {faqOpen[index] && (
                  <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No matches found for your search query.</p>
            )}
          </div>
        </div>

        {/* Support Tools: Chat & Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Chat Assistant */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: '20px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare style={{ color: 'var(--accent-primary)', width: '20px' }} />
              Live Support Simulator
            </h3>
            
            {/* Messages body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    maxWidth: '80%',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask support..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="form-control"
                style={{ padding: '10px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </form>
          </div>

          {/* Email Support Ticket */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail style={{ color: 'var(--accent-secondary)', width: '20px' }} />
              Submit a Support Request
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              💡 <strong>Logged In?</strong> You can raise official support tickets and get replies directly from the platform administrator on your <a href="#dashboard" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Dashboard</a>. Otherwise, use the form below to send a general inquiry:
            </p>

            {contactSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <CheckCircle style={{ color: '#10b981', width: '48px', height: '48px' }} />
                <h4>Request Received!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We have registered your general inquiry. Our team will contact you within 24 hours.</p>
                <button onClick={() => setContactSubmitted(false)} className="btn btn-secondary" style={{ marginTop: '10px', padding: '6px 14px', fontSize: '0.85rem' }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Full Name</label>
                  <input type="text" required className="form-control" placeholder="John Doe" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Email Address</label>
                  <input type="email" required className="form-control" placeholder="john@example.com" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Message Content</label>
                  <textarea required className="form-control" rows="3" placeholder="Describe your issue..."></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
