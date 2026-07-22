import React from 'react';
import { ShieldCheck, Award, Users, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* Banner */}
      <section style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>About <span className="gradient-text">EventLux</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
          Bridging the gap between hosts and local specialists. We unify 11 event categories into a single relational ecosystem powered by real-time bookings and heuristic AI planning.
        </p>
      </section>

      {/* Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '50%' }}>
            <Award style={{ color: 'var(--accent-primary)', width: '32px', height: '32px' }} />
          </div>
          <h3>Premium Quality</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            We vet all service providers, including caterers, makeup artists, and coordinators, to ensure your event meets world-class quality and sanitation standards.
          </p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(244,63,94,0.1)', padding: '16px', borderRadius: '50%' }}>
            <ShieldCheck style={{ color: 'var(--accent-secondary)', width: '32px', height: '32px' }} />
          </div>
          <h3>Reliability & Escrow</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Our real-time booking database secures your dates. When a service provider approves your booking request, your event schedule is locked in and protected.
          </p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '50%' }}>
            <Users style={{ color: '#10b981', width: '32px', height: '32px' }} />
          </div>
          <h3>Community First</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            We support local vendors, tailors, laundry wala, and student volunteers, helping channel revenue directly back to local service providers.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="glass-card" style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>How It Works</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Normally, planning a wedding requires negotiating separately with caterers, decorators, tailors, makeup artists, mehandi wallahs, laundry services, and finding volunteers. This takes weeks and leads to messy budgeting.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            <strong>EventLux</strong> solves this. We list local vendors across all 11 specialties. Our Heuristic AI recommendation engine acts as an instant planner, matching the optimal vendor for each category based on your budget, destination, guest count, and theme.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge badge-primary">11 Specialties</span>
            <span className="badge badge-success">SQL Real-time</span>
            <span className="badge badge-gold">AI Recommended</span>
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"
            alt="Event planning"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </section>

    </div>
  );
}
