import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
// ✅ Centralized client functions for business profile data and session caching
import { getBusiness, updateBusiness, getFromCache } from '../../api/client'
import '../../styles/dashboard.css'

/**
 * Business Profile Management Page
 * Handles the display and modification of core business identity data.
 * Employs a cache-first strategy to eliminate perceived loading times.
 */
export default function Profile() {
  const { id } = useParams()

  /**
   * Performance Strategy: Instant Hydration
   * Initializes the state using memory cache. This allows the user to see 
   * their profile immediately (0ms latency) while the app syncs with the server.
   */
  const cachedBusiness = getFromCache(`/business/${id}`)
  
  const [business, setBusiness] = useState(cachedBusiness || null)
  
  // Prepare form state immediately if cache exists to ensure an interactive UI
  const [form, setForm] = useState(cachedBusiness ? toEditable(cachedBusiness) : null)
  
  const [editing, setEditing] = useState(false)
  
  // Intelligent loading: Only show a spinner if the cache is completely empty
  const [loading, setLoading] = useState(!cachedBusiness)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /**
   * Revalidation Hook: Background Sync
   * Effectively the 'Refresh' part of the SWR pattern. Checks the server 
   * for the latest profile data once the component is mounted.
   */
  useEffect(() => {
    loadBusiness()
  }, [id])

  async function loadBusiness() {
    if (!business) setLoading(true)
    setError('')
    
    try {
      const data = await getBusiness(id)
      setBusiness(data)
      
      /**
       * UX Guardrail:
       * Only update form state if the user is NOT currently editing.
       * This prevents the "jumping input" bug where a background sync 
       * overwrites what the user is currently typing.
       */
      if (!editing) {
        setForm(toEditable(data))
      }
    } catch (e) {
      console.error("Profile sync failed:", e)
      if (!business) setError('Failed to load business profile.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * toEditable
   * Transformation utility to sanitize DB objects into flat form-friendly objects.
   * Ensures 'null' values from the DB are rendered as empty strings in HTML inputs.
   */
  function toEditable(b) {
    return {
      name: b?.name || '',
      description: b?.description || '',
      business_type: b?.business_type || '',
      phone: b?.phone || '',
      website: b?.website || '',
      address: b?.address || '',
      latitude: b?.latitude ?? '',
      longitude: b?.longitude ?? '',
      timezone: b?.timezone || '',
      quote_slogan: b?.quote_slogan || '',
      identification_mark: b?.identification_mark || '',
      published: !!b?.published
    }
  }

  function onChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  /**
   * onSave
   * Synchronizes the local form state with the backend.
   * Includes type-casting for coordinates to ensure API compatibility.
   */
  async function onSave() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        // Ensure coordinates are sent as floats or null
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude)
      }
      
      const updated = await updateBusiness(id, payload)
      setBusiness(updated)
      setForm(toEditable(updated))
      setEditing(false)
    } catch (e) {
      console.error("Save error:", e)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function onCancel() {
    // Reset form to the last known-good state from memory
    setForm(toEditable(business))
    setEditing(false)
    setError('')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Business Profile</h2>

        {loading ? (
          <p className="status-text">Synchronizing profile...</p>
        ) : !business ? (
          <p className="placeholder-text">No business profile found.</p>
        ) : (
          <>
            {!editing ? (
              /* --- VIEW MODE: Clean display of business information --- */
              <div className="panel profile-view">
                <p><strong>Name:</strong> {business.name}</p>
                <p><strong>Description:</strong> {business.description || '-'}</p>
                <p><strong>Type:</strong> {business.business_type || '-'}</p>
                <p><strong>Phone:</strong> {business.phone || '-'}</p>
                <p><strong>Website:</strong> {business.website || '-'}</p>
                <p><strong>Address:</strong> {business.address || '-'}</p>
                <p><strong>Latitude:</strong> {business.latitude ?? '-'}</p>
                <p><strong>Longitude:</strong> {business.longitude ?? '-'}</p>
                <p><strong>Timezone:</strong> {business.timezone || '-'}</p>
                <p><strong>Quote/Slogan:</strong> {business.quote_slogan || '-'}</p>
                <p><strong>Identification mark:</strong> {business.identification_mark || '-'}</p>
                <p><strong>Status:</strong> {business.published ? '🟢 Published' : '🔴 Draft'}</p>

                <div className="btn-group-mt">
                  <button className="ghost" onClick={() => setEditing(true)}>Edit profile</button>
                </div>
              </div>
            ) : (
              /* --- EDIT MODE: Input-heavy form with validation feedback --- */
              <div className="form-body panel">
                {error && <p className="error-message">{error}</p>}

                <div className="input-group">
                  <label>Business Name</label>
                  <input
                    value={form.name}
                    onChange={e => onChange('name', e.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => onChange('description', e.target.value)}
                    placeholder="What does your business do?"
                    rows={3}
                  />
                </div>

                <div className="grid">
                   <div className="input-group">
                      <label>Type</label>
                      <input
                        value={form.business_type}
                        onChange={e => onChange('business_type', e.target.value)}
                        placeholder="e.g. Restaurant"
                      />
                   </div>
                   <div className="input-group">
                      <label>Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => onChange('phone', e.target.value)}
                        placeholder="+91..."
                      />
                   </div>
                </div>

                <div className="input-group">
                  <label>Website</label>
                  <input
                    value={form.website}
                    onChange={e => onChange('website', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="input-group">
                  <label>Full Address</label>
                  <textarea
                    value={form.address}
                    onChange={e => onChange('address', e.target.value)}
                    placeholder="Street, City, ZIP"
                    rows={2}
                  />
                </div>

                <div className="grid">
                  <div className="input-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={e => onChange('latitude', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={e => onChange('longitude', e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Timezone</label>
                  <input
                    value={form.timezone}
                    onChange={e => onChange('timezone', e.target.value)}
                    placeholder="Asia/Kolkata"
                  />
                </div>

                <div className="input-group">
                  <label>Slogan</label>
                  <input
                    value={form.quote_slogan}
                    onChange={e => onChange('quote_slogan', e.target.value)}
                  />
                </div>

                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => onChange('published', e.target.checked)}
                  />
                  <span>Publish Profile</span>
                </label>

                <div className="btn-group-mt">
                  <button onClick={onSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}