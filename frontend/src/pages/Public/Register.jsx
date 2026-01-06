import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom' 
// ✅ Importing standardized API helpers for user and business lifecycle management
import { createUser, getBusinessByOwner, updateBusiness } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import '../../styles/register.css'

/**
 * Register Component
 * * Manages the multi-tenant onboarding process.
 * This component orchestrates a three-step creation sequence:
 * 1. Identity Provisioning (User creation)
 * 2. Resource Retrieval (Fetching the auto-generated business placeholder)
 * 3. Profile Initialization (Populating business details)
 */
export default function Register() {
  const navigate = useNavigate()
  const { userId, login } = useAuth()

  // Initializing local form state for all required onboarding fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    businessType: 'restaurant',
    businessAddress: ''
  })
  
  const [error, setError] = useState('')

  // Generic handler for controlled input synchronization
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  /**
   * handleSubmit
   * * Logic: Resource Orchestration.
   * Ensures that a user is not just "created," but also has a fully 
   * initialized business profile before they enter the dashboard.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const { email, password, name, businessName, businessType, businessAddress } = formData

    // Client-side validation: Preventing unnecessary API calls for incomplete data
    if (!email || !password || !businessName || !businessAddress) {
      setError('Please fill all required fields.')
      return
    }

    try {
      /**
       * Step 1: User Account Creation.
       * The backend triggers a "Post-Create" signal that automatically 
       * generates an empty business profile linked to this user's ID.
       */
      const user = await createUser({
        email,
        name,
        auth_provider: 'password',
        password_hash: password
      })

      /**
       * Step 2: Placeholder Retrieval.
       * Fetching the record created by the backend hook to get its unique UUID.
       */
      const business = await getBusinessByOwner(user.user_id)

      /**
       * Step 3: Profile Initialization.
       * Updating the placeholder with the metadata provided in the registration form.
       */
      if (business) {
         await updateBusiness(business.business_id, {
             name: businessName,
             business_type: businessType,
             address: businessAddress
         })
      }

      /**
       * Session Initialization:
       * Calling the Context Provider to hydrate the app with the new credentials.
       * Passing the business_id here is critical for immediate Sidebar/Navbar navigation.
       */
      login(user.user_id, business.business_id)

      // Step 5: Directing the user to their new command center
      navigate(`/dashboard/${business.business_id}`)

    } catch (err) {
      console.error("Onboarding failed:", err)
      setError('Registration failed. Please try again.')
    }
  }

  /**
   * Defensive UX:
   * Redirects or displays a message if an active session is detected,
   * preventing duplicate registrations.
   */
  if (userId) {
    return (
      <div className="register-page">
        <div className="register-panel">
          <h2 className="register-title">Account already active</h2>
          <p className="register-sub">
            You are currently logged in. Visit your dashboard to manage your business.
          </p>
          <Link to="/" className="btn secondary full-width" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop: '1rem'}}>
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-panel">
        <header>
          <h2 className="register-title">Create your account</h2>
          <p className="register-sub">Join AV and start enhancing your business visibility</p>
        </header>

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Section: Account Credentials */}
          <div className="input-group">
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Secure Password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <input
            name="name"
            type="text"
            placeholder="Full Name"
            required
            value={formData.name}
            onChange={handleChange}
          />

          {/* Section: Business Metadata */}
          <div className="business-setup-divider">
            <span>Business Details</span>
          </div>

          <input
            name="businessName"
            type="text"
            placeholder="Business Name"
            required
            value={formData.businessName}
            onChange={handleChange}
          />

          <select
            name="businessType"
            className="styled-select"
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="restaurant">Restaurant</option>
            <option value="salon">Salon</option>
            <option value="clinic">Clinic</option>
            <option value="retail">Retail</option>
          </select>

          <input
            name="businessAddress"
            type="text"
            placeholder="Business Street Address"
            required
            value={formData.businessAddress}
            onChange={handleChange}
          />

          {error && <p className="error-message" role="alert">{error}</p>}
          
          <button type="submit" className="btn primary full-width">
            Register & Create Business
          </button>
        </form>

        <footer className="register-footer">
          {/* Using React Router Link for optimized SPA navigation */}
          Already have an account? <Link to="/login">Login here</Link>
        </footer>
      </div>
    </div>
  )
}