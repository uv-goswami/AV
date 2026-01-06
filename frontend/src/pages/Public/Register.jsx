import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom' // Added Link here
// Import all necessary API functions
import { createUser, getBusinessByOwner, updateBusiness } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import '../../styles/register.css'

export default function Register() {
  const navigate = useNavigate()
  const { userId, login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    businessType: 'restaurant',
    businessAddress: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { email, password, name, businessName, businessType, businessAddress } = formData

    if (!email || !password || !businessName || !businessAddress) {
      setError('Please fill all required fields.')
      return
    }

    try {
      // 1. Create the User
      // (Your backend automatically creates a placeholder Business when a user is created)
      const user = await createUser({
        email,
        name,
        auth_provider: 'password',
        password_hash: password
      })

      // 2. Fetch that auto-created placeholder business
      const business = await getBusinessByOwner(user.user_id)

      // 3. Update the placeholder business with the actual details from the form
      if (business) {
         await updateBusiness(business.business_id, {
             name: businessName,
             business_type: businessType,
             address: businessAddress
         })
      }

      // 4. Log the user in with BOTH IDs
      // This is crucial for the Navbar to see the businessId immediately
      login(user.user_id, business.business_id)

      // 5. Redirect to the Dashboard
      navigate(`/dashboard/${business.business_id}`)

    } catch (err) {
      console.error(err)
      setError('Registration failed. Try again.')
    }
  }

  if (userId) {
    return (
      <div className="register-page">
        <div className="register-panel">
          <h2 className="register-title">You're already registered</h2>
          <p className="register-sub">
            You are logged in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-panel">
        <h2 className="register-title">Create your account</h2>
        <p className="register-sub">Join AV and start enhancing your visibility</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            name="name"
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
          />
          <input
            name="businessName"
            type="text"
            placeholder="Business Name"
            value={formData.businessName}
            onChange={handleChange}
          />
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="restaurant">Restaurant</option>
            <option value="salon">Salon</option>
            <option value="clinic">Clinic</option>
          </select>
          <input
            name="businessAddress"
            type="text"
            placeholder="Business Address"
            value={formData.businessAddress}
            onChange={handleChange}
          />

          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary full-width">Register & Create Business</button>
        </form>

        <p className="register-footer">
          {/* Replaced <a> with <Link> to fix 404 */}
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}