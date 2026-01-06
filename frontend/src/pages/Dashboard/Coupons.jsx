import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import '../../styles/dashboard.css'
// ✅ Centralized API client for business operations and high-performance cache access
import { 
  API_BASE, 
  getFromCache, 
  listCoupons, 
  createCoupon 
} from '../../api/client'

/**
 * Coupons Management Component
 * * Logic: Handles the lifecycle of promotional offers and discounts.
 * * UX Strategy: Employs a 'Cache-First' strategy to eliminate perceived latency 
 * while maintaining a background sync to ensure data integrity.
 */
export default function Coupons() {
  const { id } = useParams()
  
  /**
   * Performance Strategy: Instant UI Hydration
   * Initializes local state by synchronously reading from the application cache.
   * This ensures returning users see their data immediately (0ms delay).
   */
  const [coupons, setCoupons] = useState(() => {
    // Exact match for the URL used in the API client to ensure cache-hit consistency
    const cached = getFromCache(`/coupons/?business_id=${id}&limit=20&offset=0`)
    return Array.isArray(cached) ? cached : []
  })
  
  // Local form state for coupon creation and inline editing
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_value: '',
    valid_from: '',
    valid_until: '',
    terms_conditions: ''
  })
  
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  /**
   * Background Revalidation:
   * Fires post-render to ensure the UI is eventually consistent with the server.
   */
  useEffect(() => {
    loadCoupons()
  }, [id])

  async function loadCoupons() {
    try {
      // Re-fetches fresh data and updates the global cache via the client helper
      const data = await listCoupons(id, 20, 0)
      setCoupons(data)
    } catch (err) {
      console.error("Coupons synchronization failed:", err)
    }
  }

  /**
   * formatDateForInput
   * Data Normalization utility to transform ISO-8601 strings from the DB 
   * into the 'YYYY-MM-DD' format required by standard HTML5 date inputs.
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    return dateString.split('T')[0] 
  }

  /**
   * getCleanPayload
   * Ensures data integrity by sanitizing empty strings into 'null' values, 
   * adhering to the backend's optional field schema.
   */
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
   * Triggers the API client to persist a new coupon. 
   * Note: The client automatically invalidates stale caches on POST.
   */
  async function handleCreate() {
    try {
      const payload = getCleanPayload(form)
      await createCoupon({ business_id: id, ...payload })

      setForm({ code: '', description: '', discount_value: '', valid_from: '', valid_until: '', terms_conditions: '' })
      setShowForm(false)
      loadCoupons()
    } catch (err) {
      console.error(err)
      alert("Network error occurred")
    }
  }

  /**
   * handleUpdate
   * Implements inline editing logic. Uses a raw fetch here to target 
   * specific resource IDs and refreshes the local state upon success.
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
      setForm({ code: '', description: '', discount_value: '', valid_from: '', valid_until: '', terms_conditions: '' })
      
      // Manual reload to force cache synchronization after a PATCH operation
      loadCoupons() 
    } catch (err) {
      console.error(err)
      alert("Network error occurred")
    }
  }

  /**
   * handleDelete
   * Implements an 'Optimistic UI' pattern by removing the item from local state 
   * immediately, ensuring the interface feels responsive to the user.
   */
  async function handleDelete(couponId) {
    try {
      await fetch(`${API_BASE}/coupons/${couponId}`, { method: 'DELETE' })
      
      // Filter state locally to provide immediate visual feedback
      setCoupons(prev => prev.filter(c => c.coupon_id !== couponId))
    } catch (err) {
      console.error("Deletion failed:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Manage Business Coupons</h2>

        {/* --- COUPON LISTING AREA --- */}
        <div className="collapsible-section">
          {coupons.length === 0 ? (
            <p className="placeholder-text">No active coupons found. Create one to drive engagement.</p>
          ) : (
            coupons.map(c => (
              <div key={c.coupon_id} className="panel coupon-card">
                {editing === c.coupon_id ? (
                  /* --- INLINE EDIT FORM --- */
                  <div className="edit-mode">
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Promo Code" />
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Offer Description" />
                    <input value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder="Discount Value" />
                    
                    <label className="input-label">Validity Start:</label>
                    <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
                    
                    <label className="input-label">Validity End:</label>
                    <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                    
                    <textarea value={form.terms_conditions} onChange={e => setForm({ ...form, terms_conditions: e.target.value })} placeholder="Legal Terms & Conditions" />
                    
                    <div className="btn-group-mt">
                        <button onClick={() => handleUpdate(c.coupon_id)}>Save Snapshot</button>
                        <button className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* --- VIEW MODE --- */
                  <div className="view-mode">
                    <strong>Code: {c.code}</strong>
                    <p>{c.description}</p>
                    <p className="accent-text">Value: {c.discount_value}</p>
                    
                    <p className="meta-text">Timeline: {formatDateForInput(c.valid_from)} — {formatDateForInput(c.valid_until)}</p>
                    <p className="terms-text">{c.terms_conditions}</p>
                    
                    <div className="btn-group-mt">
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
                        }}>Edit Offer</button>
                        <button className="ghost" onClick={() => handleDelete(c.coupon_id)}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* --- CREATION INTERFACE --- */}
        {!showForm ? (
          <button className="ghost" onClick={() => setShowForm(true)}>+ Add New Coupon</button>
        ) : (
          <div className="collapsible-section panel">
            <h3 className="form-title">Launch New Coupon</h3>
            <div className="form-body">
              <input placeholder="Promo Code (e.g. SUMMER25)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              <textarea placeholder="Discount details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input placeholder="Discount (e.g. 20% OFF)" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} />
              
              <label className="input-label">Start Date:</label>
              <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
              
              <label className="input-label">End Date:</label>
              <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              
              <textarea placeholder="Fine print / Terms..." value={form.terms_conditions} onChange={e => setForm({ ...form, terms_conditions: e.target.value })} />
              
              <div className="btn-group-mt">
                  <button onClick={handleCreate}>Publish Coupon</button>
                  <button className="ghost" onClick={() => setShowForm(false)}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 