import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import '../../styles/dashboard.css'
// ✅ Leveraging a centralized API client for consistent data management
import { 
  API_BASE, 
  getFromCache, 
  listCoupons, 
  createCoupon 
} from '../../api/client'

/**
 * Coupons Management Page
 * Handles the creation, listing, and modification of business promotional offers.
 * Features an 'Instant-Load' strategy using local caching to improve perceived performance.
 */
export default function Coupons() {
  const { id } = useParams() // The business UUID from the route
  
  /**
   * Performance Strategy: Instant Load
   * We initialize state by checking the cache first. This allows the UI to 
   * render immediately with "stale" data while a fresh fetch runs in the background.
   */
  const [coupons, setCoupons] = useState(() => {
    const cached = getFromCache(`/coupons/?business_id=${id}&limit=20&offset=0`)
    return Array.isArray(cached) ? cached : []
  })
  
  // Local state for handling form inputs during create/edit actions
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_value: '',
    valid_from: '',
    valid_until: '',
    terms_conditions: ''
  })
  
  const [editing, setEditing] = useState(null) // Tracks the ID of the coupon being edited
  const [showForm, setShowForm] = useState(false)

  /**
   * Lifecycle Management: Revalidation
   * Fetches fresh data whenever the business ID changes or the component mounts.
   */
  useEffect(() => {
    loadCoupons()
  }, [id])

  async function loadCoupons() {
    try {
      // client helper automatically updates the cache and returns fresh data
      const data = await listCoupons(id, 20, 0)
      setCoupons(data)
    } catch (err) {
      console.error("Failed to sync coupons:", err)
    }
  }

  // Formatting utility to ensure ISO strings from the DB work with HTML5 date inputs
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    return dateString.split('T')[0] 
  }

  // Data Sanitization: Ensures optional empty fields are sent as 'null' to the API
  const getCleanPayload = (formData) => {
    return {
      code: formData.code,
      description: formData.description || null,
      discount_value: formData.discount_value || null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      terms_conditions: formData.terms_conditions || null
    }
  }

  /**
   * handleCreate
   * Submits a new coupon to the backend and triggers a background refresh.
   */
  async function handleCreate() {
    try {
      const payload = getCleanPayload(form)
      await createCoupon({ business_id: id, ...payload })

      // Reset form UI upon success
      setForm({ code: '', description: '', discount_value: '', valid_from: '', valid_until: '', terms_conditions: '' })
      setShowForm(false)
      loadCoupons()
    } catch (err) {
      console.error(err)
      alert("Network error: Could not create coupon")
    }
  }

  /**
   * handleUpdate
   * Performs a partial update (PATCH) and manually refreshes state.
   */
  async function handleUpdate(couponId) {
    try {
      const payload = getCleanPayload(form)
      const fullPayload = { business_id: id, ...payload }

      const res = await fetch(`${API_BASE}/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(`Update failed: ${JSON.stringify(errorData.detail)}`) 
        return
      }

      setEditing(null)
      loadCoupons() 
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * handleDelete
   * Implements an 'Optimistic UI' update by removing the item from local state 
   * immediately while the network request executes.
   */
  async function handleDelete(couponId) {
    try {
      await fetch(`${API_BASE}/coupons/${couponId}`, { method: 'DELETE' })
      setCoupons(prev => prev.filter(c => c.coupon_id !== couponId))
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Coupons</h2>

        <div className="collapsible-section">
          {coupons.length === 0 ? (
            <p className="placeholder-text">No active coupons available.</p>
          ) : (
            coupons.map(c => (
              <div key={c.coupon_id} className="panel">
                {editing === c.coupon_id ? (
                  /* --- Inline Edit Mode --- */
                  <div className="form-body">
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code" />
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                    <input value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder="Discount Value" />
                    
                    <label className="label-small">Valid From:</label>
                    <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
                    
                    <label className="label-small">Valid Until:</label>
                    <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                    
                    <textarea value={form.terms_conditions} onChange={e => setForm({ ...form, terms_conditions: e.target.value })} placeholder="Terms & Conditions" />
                    
                    <div className="btn-group">
                        <button onClick={() => handleUpdate(c.coupon_id)}>Save Changes</button>
                        <button className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* --- View Mode --- */
                  <div className="view-mode">
                    <strong>{c.code}</strong>
                    <p>{c.description}</p>
                    <p className="accent-text">Discount: {c.discount_value}</p>
                    <p className="meta-text">Valid: {formatDateForInput(c.valid_from)} → {formatDateForInput(c.valid_until)}</p>
                    
                    <div className="btn-group">
                      <button onClick={() => {
                        setEditing(c.coupon_id)
                        setForm({
                          code: c.code,
                          description: c.description || '',
                          discount_value: c.discount_value || '',
                          valid_from: formatDateForInput(c.valid_from),
                          valid_until: formatDateForInput(c.valid_until),
                          terms_conditions: c.terms_conditions || ''
                        })
                      }}>Edit</button>
                      <button className="ghost" onClick={() => handleDelete(c.coupon_id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* --- Create New Coupon Trigger --- */}
        {!showForm ? (
          <button className="ghost" onClick={() => setShowForm(true)}>+ Add New Coupon</button>
        ) : (
          <div className="collapsible-section">
            <h3 className="form-title">Create Promotional Offer</h3>
            <div className="form-body">
              <input placeholder="Code (e.g. SUMMER25)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              <textarea placeholder="Description of the offer" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input placeholder="Discount Value (e.g. 20% off)" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} />
              
              <label className="label-small">Valid From:</label>
              <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
              
              <label className="label-small">Valid Until:</label>
              <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              
              <textarea placeholder="Terms & Conditions" value={form.terms_conditions} onChange={e => setForm({ ...form, terms_conditions: e.target.value })} />
              
              <div className="btn-group">
                  <button onClick={handleCreate}>Publish Coupon</button>
                  <button className="ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}