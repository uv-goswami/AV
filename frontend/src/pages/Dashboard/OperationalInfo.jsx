import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
// ✅ Centralized API helpers and cache management
import {
  getOperationalInfoByBusiness,
  createOperationalInfo,
  updateOperationalInfoByBusiness,
  deleteOperationalInfoByBusiness,
  getFromCache
} from '../../api/client'
import '../../styles/dashboard.css'

/**
 * OperationalInfo Component
 * * Manages business-specific facility data like hours of operation, accessibility, and amenities.
 * Includes sophisticated time-string parsing to bridge the gap between user-friendly 
 * 12-hour inputs and backend-required 24-hour formats.
 */
export default function OperationalInfo() {
  const { id } = useParams()
  
  /**
   * Performance Strategy: Instant UI Hydration
   * Attempts to load existing operational data from memory to ensure the 
   * dashboard content appears instantly for the user.
   */
  const [info, setInfo] = useState(() => {
    return getFromCache(`/operational-info/by-business/${id}`) || null
  })

  // Comprehensive form state covering all operational parameters
  const [form, setForm] = useState({
    opening_hours: '',
    closing_hours: '',
    off_days: [],
    delivery_options: '',
    reservation_options: '',
    wifi_available: false,
    accessibility_features: '',
    nearby_parking_spot: '',
    special_notes: ''
  })
  
  const [editing, setEditing] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  /**
   * Lifecycle Hook: Background Revalidation
   * Synchronizes the local state with the database to ensure data accuracy.
   */
  useEffect(() => {
    loadInfo()
  }, [id])

  async function loadInfo() {
    try {
      const data = await getOperationalInfoByBusiness(id)
      setInfo(data)

      // Map backend data to frontend form state, including time format conversion
      setForm({
        opening_hours: convertTo12Hour(data.opening_hours || ''),
        closing_hours: convertTo12Hour(data.closing_hours || ''),
        off_days: data.off_days || [],
        delivery_options: data.delivery_options || '',
        reservation_options: data.reservation_options || '',
        wifi_available: data.wifi_available || false,
        accessibility_features: data.accessibility_features || '',
        nearby_parking_spot: data.nearby_parking_spot || '',
        special_notes: data.special_notes || ''
      })
    } catch (err) {
      console.error("Operational info sync failed:", err)
      if (!info) setInfo(null)
    }
  }

  /**
   * convertTo12Hour
   * Helper utility to transform ISO-standard 24h time into a user-friendly 
   * format (e.g., "14:30" → "02:30 PM").
   */
  function convertTo12Hour(time) {
    if (!time.includes(":")) return time
    try {
      let [hour, minute] = time.split(":").map(Number)
      const ampm = hour >= 12 ? "PM" : "AM"
      hour = hour % 12 || 12
      return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} ${ampm}`
    } catch {
      return time
    }
  }

  /**
   * convertTo24Hour
   * Prepares user-inputted time strings for database storage 
   * (e.g., "02:30 PM" → "14:30").
   */
  function convertTo24Hour(str) {
    try {
      let [time, ampm] = str.split(" ")
      let [hour, minute] = time.split(":").map(Number)

      if (ampm === "PM" && hour !== 12) hour += 12
      if (ampm === "AM" && hour === 12) hour = 0

      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    } catch {
      return str
    }
  }

  /**
   * saveInfo
   * Handles both POST (creation) and PUT/PATCH (update) logic based on 
   * the existence of current operational data.
   */
  async function saveInfo() {
    try {
      const payload = {
        business_id: id,
        ...form,
        opening_hours: convertTo24Hour(form.opening_hours),
        closing_hours: convertTo24Hour(form.closing_hours)
      }

      if (info) {
        await updateOperationalInfoByBusiness(id, payload)
      } else {
        await createOperationalInfo(payload)
      }

      setEditing(false)
      loadInfo() // Refresh data and cache
    } catch (err) {
      console.error("Save operation failed:", err)
    }
  }

  async function deleteInfo() {
    try {
      await deleteOperationalInfoByBusiness(id)
      setInfo(null)
      setEditing(false)
    } catch (err) {
      console.error("Delete operation failed:", err)
    }
  }

  const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

  /**
   * toggleDay
   * Manages the 'off_days' array state for a multi-select dropdown interface.
   */
  function toggleDay(day) {
    setForm(prev => {
      const exists = prev.off_days.includes(day)
      return {
        ...prev,
        off_days: exists
          ? prev.off_days.filter(d => d !== day)
          : [...prev.off_days, day]
      }
    })
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>

      <div className="dashboard-content">
        <h2 className="page-title">Operational Info & Accessibility</h2>

        {!info && !editing && (
          <p className="placeholder-text">No operational details recorded. Add info to improve SEO and user clarity.</p>
        )}

        {editing ? (
          /* --- EDIT / CREATE MODE --- */
          <div className="form-section panel">
            <div className="form-header">
              <h3 className="form-title">{info ? 'Update Facility Details' : 'Establish Operational Info'}</h3>
            </div>

            <div className="form-body">
              <div className="grid">
                <input
                  type="text"
                  placeholder="Opening Hours (e.g. 09:00 AM)"
                  value={form.opening_hours}
                  onChange={e => setForm({ ...form, opening_hours: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Closing Hours (e.g. 06:00 PM)"
                  value={form.closing_hours}
                  onChange={e => setForm({ ...form, closing_hours: e.target.value })}
                />
              </div>

              {/* Multi-select logic for closed days */}
              <div className="form-group dropdown-container">
                <button type="button" className="ghost dropdown-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {form.off_days.length > 0 ? `Closed on: ${form.off_days.join(', ')}` : 'Select Off-Days'}
                </button>

                {dropdownOpen && (
                  <div className="panel dropdown-menu">
                    {weekdays.map(day => (
                      <div key={day} className="dropdown-item" onClick={() => toggleDay(day)}>
                        {day} {form.off_days.includes(day) && '✓'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Delivery Options (e.g. In-house, UberEats)"
                value={form.delivery_options}
                onChange={e => setForm({ ...form, delivery_options: e.target.value })}
              />

              <input
                type="text"
                placeholder="Reservation Policy"
                value={form.reservation_options}
                onChange={e => setForm({ ...form, reservation_options: e.target.value })}
              />

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={form.wifi_available}
                  onChange={e => setForm({ ...form, wifi_available: e.target.checked })}
                />
                Public WiFi Available
              </label>

              <input
                type="text"
                placeholder="Accessibility (e.g. Wheelchair ramp)"
                value={form.accessibility_features}
                onChange={e => setForm({ ...form, accessibility_features: e.target.value })}
              />

              <input
                type="text"
                placeholder="Nearby Parking Information"
                value={form.nearby_parking_spot}
                onChange={e => setForm({ ...form, nearby_parking_spot: e.target.value })}
              />

              <textarea
                placeholder="Additional operational notes..."
                value={form.special_notes}
                onChange={e => setForm({ ...form, special_notes: e.target.value })}
              />

              <div className="btn-group">
                <button onClick={saveInfo}>Save Configuration</button>
                <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          /* --- DISPLAY MODE --- */
          info && (
            <div className="panel info-display">
              <div className="info-grid">
                <p><strong>🕒 Business Hours:</strong> {convertTo12Hour(info.opening_hours)} – {convertTo12Hour(info.closing_hours)}</p>
                <p><strong>🗓️ Closed On:</strong> {info.off_days?.length > 0 ? info.off_days.join(', ') : 'Open daily'}</p>
                <p><strong>🚚 Delivery:</strong> {info.delivery_options || 'Not specified'}</p>
                <p><strong>📅 Reservations:</strong> {info.reservation_options || 'Not specified'}</p>
                <p><strong>📶 WiFi:</strong> {info.wifi_available ? 'Available' : 'No public WiFi'}</p>
                <p><strong>♿ Accessibility:</strong> {info.accessibility_features || 'Basic access'}</p>
                <p><strong>🅿️ Parking:</strong> {info.nearby_parking_spot || 'Check local street parking'}</p>
                {info.special_notes && <p><strong>📝 Notes:</strong> {info.special_notes}</p>}
              </div>

              <div className="btn-group-mt">
                <button onClick={() => setEditing(true)}>Edit Details</button>
                <button className="ghost" onClick={deleteInfo}>Reset All</button>
              </div>
            </div>
          )
        )}

        {!editing && (
          <button className="ghost" onClick={() => setEditing(true)}>
            {info ? 'Modify Operational Info' : '+ Initialize Operational Info'}
          </button>
        )}
      </div>
    </div>
  )
}