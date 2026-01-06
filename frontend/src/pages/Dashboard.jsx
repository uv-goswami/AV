import React, { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
// ✅ Centralized client utilities for resource-specific data fetching and caching
import { getBusiness, listServices, listMedia, getFromCache } from '../api/client'
import { useAuth } from '../context/AuthContext'
import SidebarNav from '../components/SidebarNav'
import StatCard from '../components/StatCard'
import JsonBlock from '../components/JsonBlock'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/dashboard.css'

/**
 * Dashboard Main Component
 * * Acts as the primary command center for authenticated business owners.
 * Responsibilities include:
 * 1. Enforcing Route Protection (Authorization check).
 * 2. Implementing the Stale-While-Revalidate pattern for multiple data streams.
 * 3. Orchestrating UI components (Stats, Sidebar, and Collapsible data views).
 */
export default function Dashboard() {
  const { id } = useParams() // Business UUID from the URL
  const { userId } = useAuth() // Global authentication status

  /**
   * Performance: Synchronous State Initialization
   * We leverage the getFromCache helper to populate the initial state instantly.
   * This ensures the user sees their data immediately (0ms latency) without 
   * a white screen or a global loading spinner.
   */
  const [business, setBusiness] = useState(() => {
    return getFromCache(`/business/${id}`) || null
  })

  const [services, setServices] = useState(() => {
    return getFromCache(`/services/?business_id=${id}&limit=100&offset=0`) || []
  })

  const [media, setMedia] = useState(() => {
    return getFromCache(`/media/?business_id=${id}&limit=100&offset=0`) || []
  })

  /**
   * Lifecycle Hook: Background Synchronization
   * This effect runs post-render to ensure that even though we showed 
   * cached data, we are currently fetching the most up-to-date values 
   * from the backend API.
   */
  useEffect(() => {
    if (userId) {
      // Parallel revalidation of all dashboard-level resources
      getBusiness(id).then(setBusiness).catch((err) => console.error("Biz Sync Error:", err))
      listServices(id, 100, 0).then(setServices).catch((err) => console.error("Service Sync Error:", err))
      listMedia(id, 100, 0).then(setMedia).catch((err) => console.error("Media Sync Error:", err))
    }
  }, [id, userId])

  /**
   * Authorization Guard:
   * Professional implementation of a Protected Route. If the context 
   * indicates no active session, we perform a clean redirect to login.
   */
  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="dashboard-page">
      {/* Global Navigation Shell */}
      <SidebarNav />

      <div className="dashboard-content container">
        <h2 className="page-title">Dashboard Overview</h2>

        {/* Top-Level Metrics: Using reusable StatCard components for UI consistency */}
        <div className="grid">
          <StatCard title="Profile" value={business ? '✓' : '—'} />
          <StatCard title="Services" value={services.length} />
          <StatCard title="Media Assets" value={media.length} />
        </div>

        {/* Data Management Sections: 
            Utilizes the CollapsibleSection pattern to keep a complex UI 
            organized and manageable for the end user. 
        */}
        
        <CollapsibleSection title="Profile Overview">
          {business ? (
            <div className="profile-details">
              <p><strong>Name:</strong> {business.name}</p>
              <p><strong>Description:</strong> {business.description || '—'}</p>
              <p><strong>Category:</strong> {business.business_type || 'LocalBusiness'}</p>
              <p><strong>Contact:</strong> {business.phone || '—'}</p>
              <p><strong>Link:</strong> {business.website || '—'}</p>
              <p><strong>Location:</strong> {business.address || '—'}</p>
            </div>
          ) : (
            <p className="placeholder-text">Business profile data is synchronizing...</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Services Catalog">
          {services.length === 0 ? (
            <p className="placeholder-text">No services listed yet.</p>
          ) : (
            services.map(s => (
              <div key={s.service_id} className="panel service-item">
                <strong>{s.name}</strong>
                <div className="small-meta">{s.description}</div>
                <div className="price-tag">₹{s.price} {s.currency || 'INR'}</div>
              </div>
            ))
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Media Gallery">
          {media.length === 0 ? (
            <p className="placeholder-text">No media assets found.</p>
          ) : (
            media.map(m => (
              <div key={m.asset_id} className="panel media-item">
                <div className="meta-label">{m.media_type.toUpperCase()}: {m.url}</div>
                {m.alt_text && <div className="alt-text-meta">{m.alt_text}</div>}
              </div>
            ))
          )}
        </CollapsibleSection>

        {/* Feature Placeholders: Ready for the next phase of development */}
        <CollapsibleSection title="AI Metadata & SEO">
          <p className="muted">Generate insights and entities to inform search intent via Gemini AI.</p>
        </CollapsibleSection>

        <CollapsibleSection title="Promotional Coupons">
          <p className="muted">Create and manage exclusive business offers.</p>
        </CollapsibleSection>

        <CollapsibleSection title="Visibility Audit Results">
          <p className="muted">Run AI-powered checks to see how your business appears to bots and humans.</p>
        </CollapsibleSection>

        <CollapsibleSection title="Technical JSON-LD Feed">
          {/* Transparency: Shows the actual data payload used for AI discovery */}
          {business && <JsonBlock title="Current Schema Payload" data={business} />}
        </CollapsibleSection>
      </div>
    </div>
  )
}