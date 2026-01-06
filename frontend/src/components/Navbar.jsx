import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Navbar.css'

/**
 * Navbar Component
 * The primary navigation controller for the application.
 * Responsibilities include managing responsive mobile states, 
 * integrating global authentication context, and handling secure logout redirects.
 */
export default function Navbar() {
  // Local state for toggling the mobile navigation overlay
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Accessing global auth state from context to determine UI visibility
  const { userId, businessId, logout } = useAuth()
  
  // Hook for programmatic navigation (used post-logout)
  const navigate = useNavigate()

  /**
   * handleLogout
   * Clears the authentication session and cleans up the UI state 
   * before redirecting the user to the landing page.
   */
  const handleLogout = () => {
    logout()           // Executes context-level logout logic
    navigate("/")      // Ensures the user is safely redirected away from protected routes
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Semantic Link for the brand logo */}
        <Link to="/" className="logo">AV</Link>

        {/* Desktop Navigation Links:
            Using NavLink for automatic 'active' class injection on active routes.
        */}
        <div className="nav-links">
          <NavLink to="/" className="nav-item">Home</NavLink>
          <NavLink to="/directory" className="nav-item">Directory</NavLink>
          {/* Conditional rendering: Only show Dashboard if a business profile is associated */}
          {businessId && <NavLink to={`/dashboard/${businessId}`} className="nav-item">Dashboard</NavLink>}
        </div>

        {/* Auth Actions Section:
            Dynamically switches between User meta/Logout and Login/Signup triggers.
        */}
        <div className="nav-right">
          {userId ? (
            <>
              <span className="nav-item">Logged in</span>
              <button onClick={handleLogout} className="nav-item">Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-item">Login</NavLink>
              <NavLink to="/register" className="nav-item nav-cta">Sign Up</NavLink>
            </>
          )}
        </div>

        {/* Mobile Burger Menu Trigger */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>

      {/* Mobile Menu Overlay:
          Ensures the mobile experience matches the desktop functionality
          while handling automatic menu closure on click.
      */}
      {menuOpen && (
        <div className="nav-mobile">
          <NavLink to="/" className="nav-item" onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/directory" className="nav-item" onClick={() => setMenuOpen(false)}>Directory</NavLink>
          {userId && <NavLink to={`/dashboard/${userId}`} className="nav-item" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>}
          {userId ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false) }}
              className="nav-item"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="nav-item" onClick={() => setMenuOpen(false)}>Login</NavLink>
              <NavLink to="/register" className="nav-item nav-cta" onClick={() => setMenuOpen(false)}>Sign Up</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}