import React, { useEffect, useState } from "react"
// ✅ Centralized API client for directory data and memory-cache management
import { API_BASE, getDirectoryView, getFromCache } from "../../api/client"
import "../../styles/directory.css"

/**
 * Directory Component
 * * Acts as the public-facing marketplace for all AI-ready businesses.
 * Utilizes a "Cache-First" rendering strategy to eliminate loading flickers
 * and employs Schema.org Microdata for improved SEO and AI discoverability.
 */
export default function Directory() {
  /**
   * Performance Strategy: Instant Hydration
   * We initialize state by checking the local memory cache synchronously.
   * This ensures that if a user returns to the directory from a detail page,
   * the list renders with 0ms delay, providing a native-app feel.
   */
  const [businesses, setBusinesses] = useState(() => {
    // Check if we have data in memory
    const cached = getFromCache('/business/directory-view')
    
    // If cache exists, format it immediately so the UI renders INSTANTLY
    if (Array.isArray(cached)) {
      return cached.map((biz) => ({
        ...biz,
        hours: biz.operational_info,
      }))
    }
    return []
  })

  /**
   * UX Optimization: Smart Loading State
   * We only show a loading spinner if we have absolutely no data to show.
   * If the cache is populated, the user sees content immediately, and the 
   * background refresh happens silently in the background.
   */
  const [loading, setLoading] = useState(() => businesses.length === 0)

  /**
   * Lifecycle Hook: Background Refresh
   * This effect triggers the "Revalidate" part of our SWR strategy,
   * ensuring the UI is eventually consistent with the latest server data.
   */
  useEffect(() => {
    loadDirectory()
  }, [])

  async function loadDirectory() {
    // Only show spinner if we strictly have nothing to show
    if (businesses.length === 0) setLoading(true)
    
    try {
      /**
       * Data Fetching:
       * Uses the centralized helper which automatically persists the 
       * response into the REQUEST_CACHE for future navigation.
       */
      const data = await getDirectoryView()

      const formattedData = data.map((biz) => ({
        ...biz,
        hours: biz.operational_info,
      }))

      setBusinesses(formattedData)
    } catch (err) {
      console.error("Failed to load directory:", err)
      if (businesses.length === 0) setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * getImageUrl
   * Normalization utility for media assets, handling both local and remote paths.
   */
  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}${url}`
  }

  return (
    <div className="directory-page container">
      <h1 className="directory-title">Business Directory</h1>
      <p className="directory-sub">
        Explore AI-ready local businesses and services.
      </p>

      {/* Conditional Rendering: Prioritizing content over spinners to reduce bounce rates */}
      {loading ? (
        <div className="muted">Loading directory...</div>
      ) : businesses.length === 0 ? (
        <div className="muted">No businesses found.</div>
      ) : (
        <div className="directory-grid">
          {businesses.map((biz) => (
            /**
             * SEO Excellence:
             * Using the <article> tag combined with Schema.org Microdata.
             * This informs Search Engines and AI Agents (Gemini/GPT) that this
             * specific block represents a 'LocalBusiness' entity.
             */
            <article
              key={biz.business_id}
              className="directory-card"
              itemScope
              itemType="https://schema.org/LocalBusiness"
              style={{ padding: '20px' }}
            >
              {/* Header with small Logo layout */}
              <header className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                
                {/* Logo Section: Visual branding with fallback handling */}
                {biz.media && biz.media.length > 0 ? (
                  <img
                    src={getImageUrl(biz.media[0].url)}
                    alt={biz.name}
                    style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        flexShrink: 0 
                    }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : null}

                {/* Text Section: Mapping data to Schema.org properties */}
                <div style={{ flexGrow: 1 }}>
                    <h2 itemProp="name" style={{ margin: 0, fontSize: '1.3rem' }}>{biz.name}</h2>
                    <span className="biz-type" style={{ display:'block', marginTop:'4px', fontSize:'0.9rem', color:'#666' }}>
                    {biz.business_type || "Business"}
                    </span>
                </div>
              </header>

              {/* Entity Description: Truncated to maintain grid uniformity */}
              {biz.description && (
                <p className="card-description" itemProp="description" style={{ marginBottom: '15px' }}>
                  {biz.description.length > 90 
                    ? biz.description.substring(0, 90) + "..." 
                    : biz.description}
                </p>
              )}

              {/* Data Meta-tags: Explicitly marking Location and Hours for AI crawlers */}
              <div className="card-meta">
                <p>
                  <strong>📍 Location:</strong>{" "}
                  <span itemProp="address">{biz.address || "Online / Remote"}</span>
                </p>

                {biz.hours && (
                  <p>
                    <strong>🕒 Hours:</strong>{" "}
                    <span itemProp="openingHours">
                        {biz.hours.opening_time} - {biz.hours.closing_time}
                    </span>
                  </p>
                )}

                {/* Engagement Metrics: Showcasing the breadth of the business offerings */}
                {biz.services.length > 0 && (
                  <p>
                    <strong>🛠 Services:</strong> {biz.services.length} available
                  </p>
                )}

                {/* Conversion Badges: Visual indicators for active promotions */}
                {biz.coupons.length > 0 && (
                  <div style={{
                    marginTop: '10px', 
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: '#e6f4ea',
                    color: '#1e7e34',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    🎟 {biz.coupons.length} Special Offer{biz.coupons.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Call to Action: SEO-friendly link to the individual storefront */}
              <a
                href={`/business/${biz.business_id}`}
                className="card-link"
                itemProp="url"
                style={{ marginTop: '15px', display: 'block', textAlign: 'center' }}
              >
                View Details
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}