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
   * We initialize state by checking the local memory cache.
   * This ensures that if a user returns to the directory from a detail page,
   * the list renders with 0ms delay.
   */
  const [businesses, setBusinesses] = useState(() => {
    const cached = getFromCache('/business/directory-view')
    
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
   * background refresh happens silently.
   */
  const [loading, setLoading] = useState(() => businesses.length === 0)

  // Lifecycle: Trigger background revalidation on component mount
  useEffect(() => {
    loadDirectory()
  }, [])

  /**
   * loadDirectory
   * Fetches fresh directory data and synchronizes it with the UI and Cache.
   */
  async function loadDirectory() {
    if (businesses.length === 0) setLoading(true)
    
    try {
      // ✅ Helper handles the API call and cache update internally
      const data = await getDirectoryView()

      const formattedData = data.map((biz) => ({
        ...biz,
        hours: biz.operational_info,
      }))

      setBusinesses(formattedData)
    } catch (err) {
      console.error("Directory synchronization failed:", err)
      // Fallback: If network fails and cache is empty, ensure state is an empty array
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

      {/* Conditional Rendering: Prioritizing content over spinners */}
      {loading ? (
        <div className="status-message">Synchronizing marketplace...</div>
      ) : businesses.length === 0 ? (
        <div className="status-message">No businesses found in this directory.</div>
      ) : (
        <div className="directory-grid">
          {businesses.map((biz) => (
            /* SEO Excellence: Using <article> and Schema.org (itemScope/itemType).
               This allows AI agents like Gemini and GPT to parse the content accurately.
            */
            <article
              key={biz.business_id}
              className="directory-card"
              itemScope
              itemType="https://schema.org/LocalBusiness"
            >
              <header className="card-header-flex">
                
                {/* Media Section: Displays business logo or representative image */}
                {biz.media && biz.media.length > 0 ? (
                  <img
                    src={getImageUrl(biz.media[0].url)}
                    alt={biz.name}
                    className="card-logo"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : null}

                <div className="card-title-group">
                    <h2 itemProp="name" className="card-title">{biz.name}</h2>
                    <span className="biz-type-meta">
                    {biz.business_type || "Local Business"}
                    </span>
                </div>
              </header>

              {/* Data Snippet: Truncated for consistent grid alignment */}
              {biz.description && (
                <p className="card-description" itemProp="description">
                  {biz.description.length > 90 
                    ? biz.description.substring(0, 90) + "..." 
                    : biz.description}
                </p>
              )}

              <div className="card-meta">
                <p>
                  <strong>📍 Location:</strong>{" "}
                  <span itemProp="address">{biz.address || "Online"}</span>
                </p>

                {biz.hours && (
                  <p>
                    <strong>🕒 Hours:</strong>{" "}
                    <span itemProp="openingHours">
                        {biz.hours.opening_time} - {biz.hours.closing_time}
                    </span>
                  </p>
                )}

                {/* Engagement Metrics: Showing breadth of services */}
                {biz.services.length > 0 && (
                  <p>
                    <strong>🛠 Services:</strong> {biz.services.length} listings
                  </p>
                )}

                {/* Promotion Indicators: Driving conversion through visibility */}
                {biz.coupons.length > 0 && (
                  <div className="coupon-badge">
                    🎟 {biz.coupons.length} Exclusive Offer{biz.coupons.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* CTA: Contextual navigation to detail view */}
              <a
                href={`/business/${biz.business_id}`}
                className="card-cta"
                itemProp="url"
              >
                View Full Profile
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}