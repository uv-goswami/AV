import React, { createContext, useContext, useState, useEffect } from 'react'

/**
 * Authentication Context
 * Acts as the "Single Source of Truth" for the user's login status across the app.
 */
const AuthContext = createContext()

/**
 * AuthProvider Component
 * Wraps the application to provide global access to authentication state.
 * It handles both memory-based state (React useState) and persistent storage (LocalStorage).
 */
export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null)
  const [businessId, setBusinessId] = useState(null)

  /**
   * Session Hydration:
   * When the app first loads, check LocalStorage to see if a session exists.
   * This prevents the user from being logged out on a page refresh.
   */
  useEffect(() => {
    const storedUser = localStorage.getItem('user_id')
    const storedBusiness = localStorage.getItem('business_id')
    if (storedUser) setUserId(storedUser)
    if (storedBusiness) setBusinessId(storedBusiness)
  }, [])

  /**
   * login:
   * Updates the global state and synchronizes with LocalStorage.
   * @param {string} userId - The unique ID of the authenticated user.
   * @param {string} businessId - The associated business profile ID.
   */
  const login = (userId, businessId) => {
    localStorage.setItem('user_id', userId)
    setUserId(userId)
    if (businessId) {
      localStorage.setItem('business_id', businessId)
      setBusinessId(businessId)
    }
  }

  /**
   * logout:
   * Performs a clean teardown of the session by clearing memory and storage.
   */
  const logout = () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('business_id')
    setUserId(null)
    setBusinessId(null)
  }

  return (
    /* The Provider makes the auth state and helper functions available to all nested components */
    <AuthContext.Provider value={{ userId, businessId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Custom Hook:
 * A shorthand way for components to consume the AuthContext.
 * Usage: const { userId, logout } = useAuth();
 */
export const useAuth = () => useContext(AuthContext)