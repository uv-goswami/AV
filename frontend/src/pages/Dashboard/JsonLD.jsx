import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import '../../styles/dashboard.css'
// ✅ Centralized client utilities for consistent API communication and caching
import { API_BASE, getFromCache } from '../../api/client'

/**
 * JsonLD Management Page
 * Handles the generation, validation, and display of Schema.org structured data.
 * This data is essential for AI agents and search engines to understand business offerings.
 */
export default function JsonLD() {
  const { id } = useParams()
  
  /**
   * Performance Strategy: Cache-First Initialization
   * Retrieves existing feeds from the in-memory cache to provide an 
   * instantaneous UI experience (0ms latency) upon component mount.
   */
  const [feeds, setFeeds] = useState(() => {
    const cached = getFromCache(`/jsonld?business_id=${id}`)
    return Array.isArray(cached) ? cached : []
  })
  
  // Intelligence-based loading state: Only show a spinner if the cache is empty
  const [loading, setLoading] = useState(() => feeds.length === 0)

  /**
   * Lifecycle Hook: Data Revalidation
   * Triggered on mount or when the business ID changes to sync the UI 
   * with the latest server-side JSON-LD status.
   */
  useEffect(() => {
    loadFeeds()
  }, [id])

  async function loadFeeds() {
    // Optimization: Don't show loading state if we already have cached data to show
    if (feeds.length === 0) setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jsonld?business_id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setFeeds(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to sync JSON-LD feeds:", err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * generateFeed
   * Triggers the AI backend to synthesize new structured data based on the
   * business's latest profile, services, and operational info.
   */
  async function generateFeed() {
    try {
      await fetch(`${API_BASE}/jsonld/generate?business_id=${id}`, {
        method: 'POST'
      })
      // Refresh the list to show the new or updated feed
      loadFeeds()
    } catch (err) {
      console.error("Generation error:", err)
    }
  }

  /**
   * deleteFeed
   * Removes the SEO asset from the database and refreshes the view.
   */
  async function deleteFeed(feedId) {
    try {
      await fetch(`${API_BASE}/jsonld/${feedId}`, { method: 'DELETE' })
      loadFeeds()
    } catch (err) {
      console.error("Deletion error:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">JSON‑LD Feeds</h2>
        
        {/* Primary CTA for triggering AI data generation */}
        <button onClick={generateFeed}>Generate New Feed</button>

        {/* Conditional Rendering: Handles loading, empty, and populated states */}
        {loading ? (
          <p className="status-text">Synchronizing SEO data...</p>
        ) : feeds.length === 0 ? (
          <p className="placeholder-text">No JSON‑LD feeds generated yet. Click generate to start.</p>
        ) : (
          feeds.map(f => (
            <div key={f.feed_id} className="panel">
              <p><strong>Schema Type:</strong> {f.schema_type}</p>
              
              {/* Code block preserves JSON formatting for technical review */}
              <pre className="code">{f.jsonld_data}</pre>
              
              <p><strong>Status:</strong> {f.is_valid ? '✅ Valid' : '❌ Needs Review'}</p>
              
              {/* Error reporting: Only shows if the validator detected issues */}
              {f.validation_errors && (
                <div className="error-box">
                  <strong>Validation Feedback:</strong> {f.validation_errors}
                </div>
              )}
              
              <p className="meta-text">Generated At: {new Date(f.generated_at).toLocaleString()}</p>
              
              <button className="ghost" onClick={() => deleteFeed(f.feed_id)}>Remove Asset</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}