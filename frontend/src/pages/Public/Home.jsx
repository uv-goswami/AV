import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/home.css'
// ✅ Centralized API client for performance-critical tasks like data prefetching 
// and external site visibility analysis.
import { prefetch, runExternalVisibilityCheck } from '../../api/client'

/**
 * Home Component
 * * Serves as the primary landing page and user conversion funnel.
 * Features a 'Lead Magnet' audit tool to demonstrate value before authentication
 * and utilizes link-level prefetching to eliminate perceived directory load times.
 */
export default function Home() {
  /**
   * Quick Audit State Management
   * Orchestrates the flow for the external SEO/AI visibility checker.
   * This tool acts as a hook to engage potential users with instant feedback.
   */
  const [auditUrl, setAuditUrl] = useState('')
  const [auditResult, setAuditResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * handleAudit
   * Logic: External Domain Analysis.
   * Triggers an AI-powered scan of a user's existing website to evaluate 
   * its machine-readability and human-centric clarity.
   */
  const handleAudit = async (e) => {
    e.preventDefault()
    if (!auditUrl) return
    
    setLoading(true)
    setAuditResult(null)
    setError(null)

    try {
      // Calls the specialized external audit endpoint via the API client
      const data = await runExternalVisibilityCheck(auditUrl)
      if (data.error) throw new Error(data.error)
      setAuditResult(data)
    } catch (err) {
      console.error("External audit failure:", err)
      setError(err.message || "Failed to audit site")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section: Engineered for immediate impact and clarity of purpose */}
      <header className="hero">
        <div className="hero-inner">
          <h1>Elevate your local visibility with AV</h1>
          <p className="hero-sub">
            Build a rich business profile, generate Schema.org JSON‑LD, and turn your services and media
            into search‑ready experiences.
          </p>
          
          <div className="hero-actions">
            <Link to="/register" className="btn primary">Get started</Link>
            
            {/* Optimization: Link Prefetching
                The 'onMouseEnter' trigger warns the API client to warm up the 
                directory cache, ensuring a 0ms transition for the user.
            */}
            <Link 
              to="/directory" 
              className="btn secondary"
              onMouseEnter={() => prefetch('/business/directory-view')}
            >
              Browse directory
            </Link>
          </div>

          {/* --- NEW: Interactive Quick Audit Input --- 
              This section demonstrates the ability to integrate standalone 
              utility functions into a main marketing interface.
          */}
          <div style={{ marginTop: '2.5rem', maxWidth: '600px', marginLeft:'auto', marginRight:'auto' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              Already have a website? Check its AI Visibility score:
            </p>
            <form onSubmit={handleAudit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="url" 
                placeholder="https://yourwebsite.com" 
                required
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: 'none',
                  fontSize: '1rem',
                  color: '#333' 
                }}
              />
              <button 
                type="submit" 
                className="btn primary" 
                disabled={loading}
                style={{ padding: '0 25px' }}
              >
                {loading ? 'Scanning...' : 'Check'}
              </button>
            </form>

            {/* Error Feedback: Ensuring the UI remains informative during network issues */}
            {error && (
               <div style={{ marginTop:'10px', color: '#ffcdd2', background: 'rgba(255,0,0,0.2)', padding:'10px', borderRadius:'4px' }}>
                 ⚠️ {error}
               </div>
            )}

            {/* Audit Result Display: 
                Uses semantic color coding and structured grids to present 
                complex AI analysis in an easy-to-digest format.
            */}
            {auditResult && (
              <div className="panel" style={{ 
                  marginTop: '1.5rem', 
                  textAlign: 'left', 
                  background: 'white', 
                  color: '#333', 
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  animation: 'fadeIn 0.3s ease-out',
                  padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin:0, color: '#333', fontSize: '1.2rem' }}>Audit Results</h3>
                    {/* Visual Score Badge: Immediate status communication via color theory */}
                    <div style={{ 
                        background: auditResult.score >= 80 ? '#28a745' : auditResult.score >= 50 ? '#ffc107' : '#dc3545', 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        Score: {auditResult.score}/100
                    </div>
                </div>
                
                {/* Insights Grid: Contrasting AI 'Bot' needs with 'Human' experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                        <strong style={{ color: '#000', display: 'block', marginBottom: '5px' }}>Bot Perspective</strong>
                        <p style={{ color: '#555', margin: 0, lineHeight: '1.5' }}>{auditResult.bot_analysis}</p>
                    </div>
                    <div>
                        <strong style={{ color: '#000', display: 'block', marginBottom: '5px' }}>Human Perspective</strong>
                        <p style={{ color: '#555', margin: 0, lineHeight: '1.5' }}>{auditResult.human_analysis}</p>
                    </div>
                </div>

                <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <strong style={{ color: '#000' }}>Recommendations:</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.2rem', color: '#555', fontSize: '0.9rem' }}>
                        {auditResult.recommendations?.map((rec, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                        ))}
                    </ul>
                </div>
                
                {/* CTA Overlay: Direct link from data analysis to user registration */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <Link to="/register" style={{ fontWeight: 'bold', color: '#007bff', textDecoration: 'none' }}>
                        Create a free AV profile to fix this →
                    </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Feature Pillar Section: Highlighting the core technical value of the platform */}
      <main className="container">
        <section className="features">
          <div className="feature-card">
            <h3>Structured data, automatically</h3>
            <p>Generate JSON‑LD feeds from your profile, services, coupons, media, and operational info — optimized for search.</p>
          </div>
          <div className="feature-card">
            <h3>Visibility checks</h3>
            <p>Run quick audits for content completeness and get actionable recommendations to improve your score.</p>
          </div>
          <div className="feature-card">
            <h3>AI metadata</h3>
            <p>Extract entities, keywords, and intents from your content to inform SEO and customer discovery.</p>
          </div>
        </section>

        <section className="closing">
          <h3>Built for speed and clarity</h3>
          <p>Modular dashboards, clean components, and a public directory — everything you need to go from zero to visible.</p>
        </section>
      </main>
    </div>
  )
}