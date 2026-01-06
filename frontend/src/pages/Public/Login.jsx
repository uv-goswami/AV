import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginUser } from '../../api/client' // Removed getBusinessByOwner import
import { useAuth } from '../../context/AuthContext'
import '../../styles/login.css'

export default function Login() {
  const { userId, login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 1. Authenticate (Now returns user_id AND business_id in one go)
      const response = await loginUser(formData.email, formData.password)
      
      const { user_id, business_id } = response

      if (!user_id) throw new Error("Login failed")

      // 2. Log in with context immediately
      login(user_id, business_id)

      // 3. Redirect immediately (No second wait!)
      if (business_id) {
        navigate(`/dashboard/${business_id}`)
      } else {
        // Fallback if no business exists yet
        navigate('/') 
      }

    } catch (err) {
      console.error(err)
      setError('Login failed. Check credentials.')
    }
  }

  // If already logged in, show a friendly message
  if (userId) {
    return (
      <div className="login-page">
        <div className="login-panel">
          <h2 className="login-title">You're already logged in</h2>
          <p className="login-sub">
             Go to your Dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <h2 className="login-title">Welcome back</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary full-width">Login</button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}