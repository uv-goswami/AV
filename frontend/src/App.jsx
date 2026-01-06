import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'

// Public-Facing View Imports:
// These represent the 'marketing' and 'discovery' layer of the application.
import Home from './pages/Public/Home'
import Login from './pages/Public/Login'
import Register from './pages/Public/Register'
import Directory from './pages/Public/Directory'

// ✅ Dynamic Storefront: Renders a comprehensive public profile for specific businesses.
import BusinessDetail from './pages/Public/BusinessDetail' 

// Dashboard Module Imports:
// These represent the 'authenticated' management layer where business owners interact with AI tools.
import DashboardHome from './pages/Dashboard/DashboardHome'
import Profile from './pages/Dashboard/Profile'
import Services from './pages/Dashboard/Services'
import Media from './pages/Dashboard/Media'
import Metadata from './pages/Dashboard/Metadata'
import Coupons from './pages/Dashboard/Coupons'
import Visibility from './pages/Dashboard/Visibility'
import JsonLD from './pages/Dashboard/JsonLD'
import OperationalInfo from './pages/Dashboard/OperationalInfo'

/**
 * NotFound Component (Fallback)
 * * Logic: Error Boundary / Catch-all.
 * Handles undefined routes to prevent the application from crashing and 
 * provides a graceful exit strategy for users who navigate to broken links.
 */
function NotFound() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  )
}

/**
 * Root App Component
 * * Architecture: The Global Entry Point.
 * * DESIGN PATTERNS USED:
 * 1. Provider Pattern: Wrapping everything in <AuthProvider> ensures that the 
 * authentication state is accessible globally without 'Prop Drilling'.
 * * 2. Composition Pattern: The <Navbar /> is placed outside of <Routes /> so 
 * it remains persistent across all page transitions, improving performance.
 * * 3. Declarative Routing: Uses 'react-router-dom' to map URL paths to 
 * specific view controllers (Components).
 */
export default function App() {
  return (
    /* History API Wrapper: Enables client-side routing and URL navigation */
    <Router>
      {/* Context Provider: Orchestrates global authentication and session management */}
      <AuthProvider>
        
        {/* Persistent Layout: Navigational shell that persists during route changes */}
        <Navbar />
        
        {/* Route Dispatcher: Matches the current URL to the correct view component */}
        <Routes>
          
          {/* --- LANDING & AUTHENTICATION STACK --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- PUBLIC MARKETPLACE STACK --- 
              Logic: Directory for discovery and a dynamic route (:id) for 
              individual business storefronts.
          */}
          <Route path="/directory" element={<Directory />} />
          
          {/* ✅ Parameterized Public Route: 
              The ':id' allows this single component to serve infinite business profiles 
              by pulling the ID from the URL using the 'useParams' hook.
          */}
          <Route path="/business/:id" element={<BusinessDetail />} />

          {/* --- ADMINISTRATIVE DASHBOARD STACK --- 
              Architecture: Modular Routing.
              Each aspect of the business profile (Media, SEO, Services) is 
              separated into specialized views for better maintainability (SOLID principles).
          */}
          <Route path="/dashboard/:id" element={<DashboardHome />} />
          <Route path="/dashboard/:id/profile" element={<Profile />} />
          <Route path="/dashboard/:id/services" element={<Services />} />
          <Route path="/dashboard/:id/media" element={<Media />} />
          <Route path="/dashboard/:id/metadata" element={<Metadata />} />
          <Route path="/dashboard/:id/coupons" element={<Coupons />} />
          <Route path="/dashboard/:id/visibility" element={<Visibility />} />
          <Route path="/dashboard/:id/jsonld" element={<JsonLD />} />
          <Route path="/dashboard/:id/operational-info" element={<OperationalInfo />} />

          {/* --- FALLBACK ROUTE --- 
              Ensures the UI remains resilient against malformed URLs.
          */}
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </AuthProvider>
    </Router>
  )
}