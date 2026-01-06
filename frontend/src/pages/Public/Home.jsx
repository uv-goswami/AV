import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/home.css'
// ✅ Centralized client for high-performance data prefetching and analysis
import { prefetch, runExternalVisibilityCheck } from '../../api/client'

/**
 * Home Component
 * * The primary conversion landing page for the platform.
 * Beyond simple presentation, this component implements a 'Lead Magnet' through 
 * a quick-audit tool and utilizes performance-driven navigation through 
 * link-level prefetching.
 */
export default function Home() {
  // UI state for the External Site Audit (Leads generation tool)
  const [auditUrl, setAuditUrl] = useState('')
  const [auditResult, setAuditResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * handleAudit
   * * Feature Logic: External Site Visibility Analysis.
   * This handles the primary "Aha!" moment for users by providing an 
   * instant AI analysis of their existing web presence before they even sign up.
   */
  const handleAudit = async (e) => {
    e.preventDefault()
    if (!auditUrl) return
    
    setLoading(true)
    setAuditResult(null)
    setError(null)

    try {
      // Logic: Calls the Gemini-powered analysis engine for non-platform websites
      const data = await runExternalVisibilityCheck(auditUrl)
      if (data.error) throw new Error(data.error)
      setAuditResult(data)
    } catch (err) {
      console.error("Home audit failed:", err)
      setError(err.message || "Failed to audit site")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section: Optimized for core value proposition and immediate engagement */}
      <header className="hero">
        <div className="hero-inner">
          <h1>Elevate your local visibility with AV</h1>
          <p className="hero-sub">
            Build a rich business profile, generate Schema.org JSON‑LD, and turn your services and media
            into search‑ready experiences.
          </p>
          
          <div className="hero-actions">
            <Link to="/register" className="btn primary">Get started</Link>
            
            {/* Performance Optimization: Link Prefetching
                onMouseEnter triggers a background fetch for the directory data.
                This makes the directory page load INSTANTLY when the user clicks.
            */}
            <Link 
              to="/directory" 
              className="btn secondary"
              onMouseEnter={() => prefetch('/business/directory-view')}
            >
              Browse directory
            </Link>
          </div>

          {/* --- Interactive Audit Tool (Conversion Hook) --- */}
          <div className="quick-audit-container" style={{ marginTop: '2.5rem', maxWidth: '600px', marginLeft:'auto', marginRight:'auto' }}>
            <p className="label-text" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              Already have a website? Check its AI Visibility score:
            </p>
            <form onSubmit={handleAudit} className="audit-form" style={{ display: 'flex', gap: '10px' }}>
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

            {/* Error Feedback: Ensuring robust UX during network failures */}
            {error && (
               <div className="error-alert" style={{ marginTop:'10px', color: '#ffcdd2', background: 'rgba(255,0,0,0.2)', padding:'10px', borderRadius:'4px' }}>
                 ⚠️ {error}
               </div>
            )}

            {/* Audit Results Presentation: 
                Uses conditional logic and visual scoring to drive user interest.
            */}
            {auditResult && (
              <div className="panel audit-result-card" style={{ 
                  marginTop: '1.5rem', 
                  textAlign: 'left', 
                  background: 'white', 
                  color: '#333', 
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  animation: 'fadeIn 0.3s ease-out',
                  padding: '1.5rem'
              }}>
                <div className="card-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin:0, color: '#333', fontSize: '1.2rem' }}>Audit Results</h3>
                    {/* Semantic Score Badge: Communicates status via color theory */}
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
                
                {/* Data Grid: Highlighting the dual-audience (Bot vs. Human) design of the system */}
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

                <div className="recommendations-box" style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <strong style={{ color: '#000' }}>Strategic Recommendations:</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.2rem', color: '#555', fontSize: '0.9rem' }}>
                        {auditResult.recommendations?.map((rec, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                        ))}
                    </ul>
                </div>
                
                {/* Conversion Path: Linking audit failure to the platform's value */}
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

      {/* Feature Architecture: Highlighting the platform's three primary technical pillars */}
      <main className="container">
        <section className="features-grid">
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

        <section className="closing-statement">
          <h3>Built for speed and clarity</h3>
          <p>Modular dashboards, clean components, and a public directory — everything you need to go from zero to visible.</p>
        </section>
      </main>
    </div>
  )
}