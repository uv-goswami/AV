import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import StatCard from '../../components/StatCard'
import '../../styles/dashboard.css'
// Centralized API config and memory-cache access for high performance
import { API_BASE, getFromCache } from '../../api/client'

/**
 * DashboardHome Component
 * * Serves as the landing view for the business administration portal.
 * Employs a cache-first rendering strategy to ensure the UI is instantly 
 * interactive while fresh data is synchronized in the background.
 */
export default function DashboardHome() {
  const { id } = useParams()
  const navigate = useNavigate()

  /**
   * Performance Strategy: Instant Load
   * By initializing state with values from the local cache, we eliminate 
   * initial loading states for returning users, achieving 0ms perceived latency.
   */
  
  const [profileOk, setProfileOk] = useState(() => {
    const cached = getFromCache(`/business/${id}`)
    return !!cached
  })

  const [serviceCount, setServiceCount] = useState(() => {
    const cached = getFromCache(`/services/?business_id=${id}&limit=100&offset=0`)
    return Array.isArray(cached) ? cached.length : 0
  })

  const [visibilityScore, setVisibilityScore] = useState(() => {
    const cached = getFromCache(`/visibility/result?business_id=${id}&limit=1&offset=0`)
    if (Array.isArray(cached) && cached.length > 0) {
      return cached[0].visibility_score
    }
    return '—'
  })

  /**
   * Data Revalidation: Background Sync
   * Effectively the 'Refresh' part of the SWR pattern. Once the component mounts,
   * we fire background requests to ensure the cached data matches the server state.
   */
  useEffect(() => {
    loadProfile()
    loadServices()
    loadVisibility()
  }, [id])

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/business/${id}`)
      setProfileOk(res.ok)
    } catch (err) {
      console.error("Profile sync error:", err)
      if (!profileOk) setProfileOk(false) 
    }
  }

  async function loadServices() {
    try {
      const res = await fetch(`${API_BASE}/services?business_id=${id}&limit=100&offset=0`)
      if (res.ok) {
        const data = await res.json()
        setServiceCount(Array.isArray(data) ? data.length : 0)
      }
    } catch (err) {
      console.error("Services sync error:", err)
    }
  }

  async function loadVisibility() {
    try {
      const res = await fetch(`${API_BASE}/visibility/result?business_id=${id}&limit=1&offset=0`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setVisibilityScore(data[0].visibility_score)
        } else {
          setVisibilityScore('—')
        }
      }
    } catch (err) {
      console.error("Visibility sync error:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Dashboard Overview</h2>
        
        {/* Metric Grid: Utilizes reusable StatCard components for UI consistency */}
        <div className="grid">
          <StatCard
            title="Profile"
            value={profileOk ? '✓' : '✗'}
            onClick={() => navigate(`/dashboard/${id}/profile`)}
          />
          <StatCard
            title="Services"
            value={serviceCount}
            onClick={() => navigate(`/dashboard/${id}/services`)}
          />
          <StatCard
            title="Visibility Score"
            value={visibilityScore}
            onClick={() => navigate(`/dashboard/${id}/visibility`)}
          />
        </div>
      </div>
    </div>
  )
}