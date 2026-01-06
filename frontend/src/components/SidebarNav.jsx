import React, { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import '../styles/theme.css'

/**
 * SidebarNav Component
 * Provides vertical navigation for the Business Dashboard.
 * Key features: 
 * - Dynamic route generation using URL parameters.
 * - Persistent 'Active' state styling via React Router.
 * - Collapsible layout to maximize workspace area.
 */
export default function SidebarNav() {
  // Toggle state to switch between expanded and minimized sidebar views
  const [open, setOpen] = useState(true)
  
  /** * useParams retrieves the 'id' (business UUID) from the current URL.
   * This allows the sidebar to generate contextually correct links
   * regardless of which business profile is being managed.
   */
  const { id } = useParams() 

  return (
    <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
      {/* Control button for the collapsible functionality */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        {open ? '⟨' : '⟩'}
      </button>

      {/* Navigation menu is rendered conditionally for clean transition states */}
      {open && (
        <nav>
          {/* NavLink pattern:
            The 'isActive' property is utilized to apply conditional styling.
            This gives the user immediate visual feedback on their current location.
          */}
          <NavLink
            to={`/dashboard/${id}`}
            end   // Ensures 'Overview' is only active on the base dashboard path
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Overview
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/profile`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Profile
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/services`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Services
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/media`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Media
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/metadata`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Metadata
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/coupons`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Coupons
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/visibility`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Visibility
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/jsonld`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            JSON‑LD Feeds
          </NavLink>

          <NavLink
            to={`/dashboard/${id}/operational-info`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Operational Info
          </NavLink>
        </nav>
      )}
    </aside>
  )
}