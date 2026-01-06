import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginUser } from '../../api/client' 
import { useAuth } from '../../context/AuthContext'
import '../../styles/login.css'

/**
 * Login Component
 * * The primary gateway for business owners to access their dashboard.
 * Designed with a high-performance redirection strategy that minimizes 
 * network round-trips by retrieving the user and business context in a single call.
 */
export default function Login() {
  /**
   * Auth Context Integration:
   * Consumes the global auth state to check if a user is already authenticated
   * and provides the 'login' method to update session data across the app.
   */
  const { userId, login } = useAuth()
  const navigate = useNavigate()
  
  // Controlled form state for local input management
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  /**
   * handleSubmit
   * Orchestrates the multi-step authentication and routing process.
   * 1. Validates credentials via the API.
   * 2. Synchronizes the Global Context with the response data.
   * 3. Executes conditional routing based on the user's business status.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // API call: Returns user_id AND business_id to prevent "Waterfall" fetches later
      const response = await loginUser(formData.email, formData.password)
      
      const { user_id, business_id } = response

      if (!user_id) throw new Error("Login failed")

      /**
       * State Hydration:
       * Updates the AuthProvider, which automatically triggers a re-render 
       * of the Navbar and protected routes throughout the application.
       */
      login(user_id, business_id)

      /**
       * Context-Aware Routing:
       * Directs the user to their specific business dashboard if it exists,
       * or falls back to the home page if they are a new user without a profile.
       */
      if (business_id) {
        navigate(`/dashboard/${business_id}`)
      } else {
        navigate('/') 
      }

    } catch (err) {
      console.error("Authentication Error:", err)
      setError('Login failed. Please check your credentials.')
    }
  }

  /**
   * Defensive UX:
   * If a user is already logged in (detected via Context), we intercept the 
   * login view to prevent redundant sessions and guide them back to their dashboard.
   */
  if (userId) {
    return (
      <div className="login-page">
        <div className="login-panel">
          <h2 className="login-title">You're already logged in</h2>
          <p className="login-sub">
             Navigate to your Dashboard to continue.
          </p>
          <Link to="/" className="btn secondary full-width" style={{display:'block', textAlign:'center', textDecoration:'none'}}>
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <header>
          <h2 className="login-title">Welcome back</h2>
          <p className="login-sub">Log in to manage your AI-ready business profile</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email input field - linked to local state via onChange */}
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          
          {/* Password input field */}
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />

          {/* Error Message: Semantic visual feedback for failed attempts */}
          {error && <p className="error-message" role="alert">{error}</p>}

          <button type="submit" className="btn primary full-width">
            Sign In
          </button>
        </form>

        <footer className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register your business</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}