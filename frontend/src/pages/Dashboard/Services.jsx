import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
// ✅ Centralized API client for service operations and cache retrieval
import { listServices, createService, updateService, deleteService, getFromCache } from '../../api/client'
import '../../styles/dashboard.css'

/**
 * Services Management Component
 * * Provides an interface for business owners to manage their service catalog.
 * Implements an optimistic-loading strategy via memory caching to ensure 
 * the dashboard remains responsive during network synchronization.
 */
export default function Services() {
  const { id } = useParams() // Extract business UUID from the route
  
  /**
   * Performance Strategy: Instant Hydration
   * Initializes local state from the application cache. This ensures the 
   * list of services appears instantly (0ms) if the data was previously fetched.
   */
  const [services, setServices] = useState(() => {
    // Exact cache key matching the API client's request pattern
    const cached = getFromCache(`/services/?business_id=${id}&limit=100&offset=0`)
    return Array.isArray(cached) ? cached : []
  })

  // State for managing form inputs and tracking the currently edited item
  const [form, setForm] = useState({ name: '', description: '', price: '', service_type: 'restaurant' })
  const [editing, setEditing] = useState(null)

  /**
   * Revalidation Hook: Background Synchronization
   * Ensures the UI is consistent with the latest database state upon mounting.
   */
  useEffect(() => {
    refresh()
  }, [id])

  /**
   * refresh
   * Utility function to trigger a data fetch and update both the 
   * global cache and the local UI state.
   */
  async function refresh() {
    try {
      const data = await listServices(id, 100, 0)
      setServices(data)
    } catch (err) {
      console.error("Failed to sync services list:", err)
    }
  }

  /**
   * onCreate
   * Handles the submission of new service entities.
   * Includes type casting for price to ensure backend schema validation passes.
   */
  async function onCreate(e) {
    e.preventDefault()
    try {
      await createService({ business_id: id, ...form, price: Number(form.price) })
      // Reset form state to initial values after successful creation
      setForm({ name: '', description: '', price: '', service_type: 'restaurant' })
      refresh()
    } catch (err) {
      console.error("Service creation error:", err)
    }
  }

  /**
   * onUpdate
   * Synchronizes modifications of an existing service with the backend.
   */
  async function onUpdate(serviceId) {
    try {
      await updateService(serviceId, { ...form, price: Number(form.price) })
      setEditing(null) // Exit edit mode
      refresh()
    } catch (err) {
      console.error("Service update error:", err)
    }
  }

  /**
   * onDelete
   * Removes a service entry and triggers a revalidation of the list.
   */
  async function onDelete(serviceId) {
    try {
      await deleteService(serviceId)
      refresh()
    } catch (err) {
      console.error("Service deletion error:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Services</h2>

        {/* List Display: Handles both Empty and Populated states */}
        {services.length === 0 ? (
          <p className="placeholder-text">No services listed yet.</p>
        ) : (
          services.map(s => (
            <div key={s.service_id} className="panel service-card">
              {editing === s.service_id ? (
                /* --- INLINE EDIT MODE --- */
                <div className="form-body">
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Service Name" />
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" />
                  <div className="btn-group-mt">
                    <button onClick={() => onUpdate(s.service_id)}>Save Changes</button>
                    <button className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* --- VIEW MODE --- */
                <div className="view-mode">
                  <strong>{s.name}</strong>
                  <p>{s.description}</p>
                  <p className="accent-text">₹{s.price}</p>
                  <div className="btn-group-mt">
                    <button className="ghost" onClick={() => { setEditing(s.service_id); setForm(s) }}>Edit</button>
                    <button className="ghost" onClick={() => onDelete(s.service_id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* --- CREATION INTERFACE --- */}
        <div className="form-section panel" style={{ marginTop: '20px' }}>
          <div className="form-header">
            <h3 className="form-title">Add New Service</h3>
          </div>
          <form className="form-body" onSubmit={onCreate}>
            <input
              placeholder="Service name (e.g., Haircut, Menu Item)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Detailed description of the service..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              required
            />
            
            <button type="submit">Publish Service</button>
          </form>
        </div>
      </div>
    </div>
  )
}