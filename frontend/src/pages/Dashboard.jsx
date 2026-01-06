import React, { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
// ✅ Import getFromCache
import { getBusiness, listServices, listMedia, getFromCache } from '../api/client'
import { useAuth } from '../context/AuthContext'
import SidebarNav from '../components/SidebarNav'
import StatCard from '../components/StatCard'
import JsonBlock from '../components/JsonBlock'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/dashboard.css'

export default function Dashboard() {
  const { id } = useParams()
  const { userId } = useAuth()

  // 🚀 INSTANT LOAD: Synchronous Cache Reading
  const [business, setBusiness] = useState(() => {
    return getFromCache(`/business/${id}`) || null
  })

  const [services, setServices] = useState(() => {
    return getFromCache(`/services/?business_id=${id}&limit=100&offset=0`) || []
  })

  const [media, setMedia] = useState(() => {
    return getFromCache(`/media/?business_id=${id}&limit=100&offset=0`) || []
  })

  // 🚀 BACKGROUND UPDATE
  useEffect(() => {
    if (userId) {
      getBusiness(id).then(setBusiness).catch(() => {})
      listServices(id, 100, 0).then(setServices).catch(() => {})
      listMedia(id, 100, 0).then(setMedia).catch(() => {})
    }
  }, [id, userId])

  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="dashboard-page">
      <SidebarNav />
      <div className="dashboard-content container">
        <h2 className="page-title">Dashboard Overview</h2>

        {/* Stats */}
        <div className="grid">
          <StatCard title="Profile" value={business ? '✓' : '—'} />
          <StatCard title="Services" value={services.length} />
          <StatCard title="Media Assets" value={media.length} />
        </div>

        {/* Collapsible sections */}
        <CollapsibleSection title="Profile">
          {business ? (
            <div>
              <p><strong>Name:</strong> {business.name}</p>
              <p><strong>Description:</strong> {business.description || '—'}</p>
              <p><strong>Type:</strong> {business.business_type || 'LocalBusiness'}</p>
              <p><strong>Phone:</strong> {business.phone || '—'}</p>
              <p><strong>Website:</strong> {business.website || '—'}</p>
              <p><strong>Address:</strong> {business.address || '—'}</p>
              {/* TODO: Add edit form bound to PATCH /business/:id */}
            </div>
          ) : (
            <p>No business profile found.</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Services">
          {services.length === 0 ? (
            <p>No services listed.</p>
          ) : (
            services.map(s => (
              <div key={s.service_id} className="panel">
                <strong>{s.name}</strong>
                <div>{s.description}</div>
                <div>₹{s.price} {s.currency}</div>
                {/* TODO: Add edit/delete buttons bound to /services */}
              </div>
            ))
          )}
          {/* TODO: Add create service form bound to POST /services */}
        </CollapsibleSection>

        <CollapsibleSection title="Media">
          {media.length === 0 ? (
            <p>No media uploaded.</p>
          ) : (
            media.map(m => (
              <div key={m.asset_id} className="panel">
                <div>{m.media_type}: {m.url}</div>
                {m.alt_text && <div>{m.alt_text}</div>}
                {/* TODO: Add delete button bound to /media */}
              </div>
            ))
          )}
          {/* TODO: Add upload form bound to POST /media */}
        </CollapsibleSection>

        <CollapsibleSection title="Metadata">
          <p>AI Metadata section (generate/edit via /ai-metadata and /ai-metadata/generate)</p>
          {/* TODO: Add generate button + list metadata */}
        </CollapsibleSection>

        <CollapsibleSection title="Coupons">
          <p>Coupons section (manage via /coupons)</p>
          {/* TODO: Add create/edit/delete forms */}
        </CollapsibleSection>

        <CollapsibleSection title="Visibility">
          <p>Visibility checks (run via /visibility/run, list results via /visibility/result)</p>
          {/* TODO: Add run button + show results */}
        </CollapsibleSection>

        <CollapsibleSection title="JSON-LD Feeds">
          {business && <JsonBlock title="Generated JSON-LD" data={business} />}
          {/* TODO: Add generate button + list feeds via /jsonld */}
        </CollapsibleSection>
      </div>
    </div>
  )
}