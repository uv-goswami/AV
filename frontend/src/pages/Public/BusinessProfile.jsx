import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
// ✅ Centralized client functions for data retrieval and memory-cache management
import { getBusiness, listServices, listMedia, getFromCache } from '../../api/client'
import JsonBlock from '../../components/JsonBlock'
import '../../styles/businessprofile.css'

/**
 * BusinessProfile Component
 * * Provides an aggregated view of a business's public profile, services, and media.
 * This component showcases the "Instant-Load" pattern by hydrating state from 
 * the cache before initiating background network requests for fresh data.
 */
export default function BusinessProfile() {
  const { businessId } = useParams()
  
  /**
   * Performance Strategy: State Initialization from Cache
   * To prevent "Loading..." flickers, we initialize state using synchronous 
   * cache lookups. This ensures that if the user has navigated here before, 
   * the content appears instantly.
   */
  const [business, setBusiness] = useState(() => getFromCache(`/business/${businessId}`) || null)
  const [services, setServices] = useState(() => getFromCache(`/services/?business_id=${businessId}&limit=100&offset=0`) || [])
  const [media, setMedia] = useState(() => getFromCache(`/media/?business_id=${businessId}&limit=100&offset=0`) || [])

  /**
   * Lifecycle Hook: Parallel Revalidation
   * Triggered when the businessId changes. By firing promises independently 
   * (rather than awaiting each in sequence), we reduce the total time 
   * required to synchronize the UI with the latest database state.
   */
  useEffect(() => {
    if (!businessId) return
    
    // Background fetch for core profile details
    getBusiness(businessId)
      .then(setBusiness)
      .catch((err) => console.error("Profile revalidation failed:", err))
    
    // Background fetch for associated service catalog
    listServices(businessId, 100, 0)
      .then(setServices)
      .catch((err) => console.error("Services revalidation failed:", err))

    // Background fetch for associated media assets
    listMedia(businessId, 100, 0)
      .then(setMedia)
      .catch((err) => console.error("Media revalidation failed:", err))
  }, [businessId])

  return (
    <div className="business-page container">
      {/* Conditional Rendering: Ensures the layout only renders once base data is available */}
      {business ? (
        <>
          <header className="profile-header">
            <h1>{business.name}</h1>
            <div className="biz-type-badge">{business.business_type || 'LocalBusiness'}</div>
            <p className="description-text">{business.description}</p>
          </header>

          {/* Contact & Location Section: Displays core facility coordinates */}
          <div className="panel profile-section">
            <h3>Contact & Location</h3>
            <div className="info-item"><strong>Phone:</strong> {business.phone || '—'}</div>
            <div className="info-item"><strong>Website:</strong> {business.website || '—'}</div>
            <div className="info-item"><strong>Address:</strong> {business.address || '—'}</div>
            <div className="info-item">
              <strong>Coordinates:</strong> {business.latitude ?? '—'}, {business.longitude ?? '—'}
            </div>
          </div>

          {/* Services Section: Iterates through the service catalog */}
          <div className="panel profile-section">
            <h3>Available Services</h3>
            {services.length === 0 && <div className="muted-text">No services listed at this time.</div>}
            <div className="service-grid">
              {services.map(s => (
                <div key={s.service_id} className="service-card panel">
                  <strong>{s.name}</strong>
                  <div className="category-tag">{s.service_type}</div>
                  <div className="service-desc">{s.description}</div>
                  <div className="price-tag">₹{s.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Gallery: Provides visual context through uploaded assets */}
          <div className="panel profile-section">
            <h3>Gallery</h3>
            {media.length === 0 && <div className="muted-text">No media assets found.</div>}
            <div className="media-grid">
              {media.map(m => (
                <div key={m.asset_id} className="media-asset-card panel">
                  <div className="meta-label">{m.media_type}</div>
                  {/* Note: Rendering the URL path; in production, this would be an <img> or <iframe> */}
                  <div className="asset-url">{m.url}</div>
                  {m.alt_text && <div className="alt-text-meta">{m.alt_text}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* AI/SEO Transparency: Displays the underlying data used for JSON-LD generation */}
          <JsonBlock title="Structured Data Payload (JSON-LD)" data={business} />
        </>
      ) : (
        /* Fallback State: Only visible if cache is empty and network is pending */
        <div className="loading-state">Synchronizing business profile...</div>
      )}
    </div>
  )
}