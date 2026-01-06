/**
 * API Client Configuration
 * Handles all outbound communication to the FastAPI backend. 
 * Includes an integrated caching layer to provide 'Instant Load' capabilities 
 * and reduce unnecessary server pressure.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
export const BASE = API_BASE

// CLIENT-SIDE CACHE
// An in-memory store to keep the application responsive. 
// This prevents 'Loading...' flickers when navigating between pages.
const REQUEST_CACHE = new Map()

/**
 * getFromCache
 * * Logic: Synchronous Cache Reading.
 * Used by components during state initialization to retrieve data instantly.
 */
export function getFromCache(path) {
  const url = `${BASE}${path}`
  return REQUEST_CACHE.get(url) || null
}

/**
 * api (Core Orchestrator)
 * * Pattern: Fetch Wrapper with Cache-Aside Logic.
 * Every network request passes through this function to ensure uniform 
 * headers, error handling, and cache synchronization.
 */
async function api(path, init = {}) {
  const url = `${BASE}${path}`
  const method = init.method || 'GET'

  // 1. CACHE HIT (Instant Return): 
  // For GET requests, return the existing data immediately to the caller.
  if (method === 'GET' && REQUEST_CACHE.has(url)) {
    return REQUEST_CACHE.get(url)
  }

  // 2. NETWORK REQUEST:
  // Standardize headers for JSON communication.
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })

  // 3. ROBUST ERROR HANDLING:
  if (!res.ok) {
    const text = await res.text()
    // Graceful Degradation: Ignore 404 for optional business operational info
    if (res.status === 404 && path.includes('operational-info')) {
        return null;
    }
    console.error(`API Error [${res.status}]:`, text)
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const data = await res.json()

  // 4. CACHE PERSISTENCE: 
  // Store the fresh response to serve the next component request.
  if (method === 'GET') {
    REQUEST_CACHE.set(url, data)
  }

  // 5. CACHE INVALIDATION:
  // Important: If data is modified (POST/PATCH/DELETE), the cache 
  // is cleared to ensure the user never sees 'Ghost' or outdated data.
  if (['POST', 'PATCH', 'DELETE'].includes(method)) {
    REQUEST_CACHE.clear()
  }

  return data
}

/**
 * prefetch
 * * Optimization: Anticipatory Loading.
 * Manually warms up the cache for a specific route. Used on hover 
 * to make the next page transition feel instantaneous.
 */
export const prefetch = (path) => {
  const url = `${BASE}${path}`
  if (!REQUEST_CACHE.has(url)) {
    api(path, { method: 'GET' }).catch(() => {})
  }
}

// --- 🔐 AUTHENTICATION MODULE ---
export const login = (email, password) =>
  api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

// --- 👤 USER MANAGEMENT MODULE ---
export const createUser = (payload) =>
  api('/users/', { method: 'POST', body: JSON.stringify(payload) })

export const getUserByEmail = (email) =>
  api(`/users/by-email/${encodeURIComponent(email)}`)

// --- 🏢 BUSINESS PROFILE MODULE ---

// Directory View: Specialized aggregate fetch for the public marketplace
export const getDirectoryView = () => 
  api('/business/directory-view')

export const createBusiness = (payload) =>
  api('/business/', { method: 'POST', body: JSON.stringify(payload) })

export const listBusinesses = (limit = 10, offset = 0) =>
  api(`/business/?limit=${limit}&offset=${offset}`)

export const getBusiness = (businessId) =>
  api(`/business/${businessId}`)

export const getBusinessByOwner = (ownerId) =>
  api(`/business/by-owner/${ownerId}`)

export const updateBusiness = (businessId, payload) =>
  api(`/business/${businessId}`, { method: 'PATCH', body: JSON.stringify(payload) })

// --- 🛠 SERVICES MODULE ---
export const createService = (payload) =>
  api('/services/', { method: 'POST', body: JSON.stringify(payload) })

export const getService = (serviceId) =>
  api(`/services/${serviceId}`)

export const listServices = (businessId, limit = 10, offset = 0) =>
  api(`/services/?business_id=${businessId}&limit=${limit}&offset=${offset}`)

export const updateService = (serviceId, payload) =>
  api(`/services/${serviceId}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteService = (serviceId) =>
  api(`/services/${serviceId}`, { method: 'DELETE' })

// --- 🕒 OPERATIONAL INFO MODULE ---
export const createOperationalInfo = (payload) =>
  api('/operational-info/', { method: 'POST', body: JSON.stringify(payload) })

export const getOperationalInfoByBusiness = (businessId) =>
  api(`/operational-info/by-business/${businessId}`)

export const updateOperationalInfoByBusiness = (businessId, payload) =>
  api(`/operational-info/by-business/${businessId}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteOperationalInfoByBusiness = (businessId) =>
  api(`/operational-info/by-business/${businessId}`, { method: 'DELETE' })

// --- 📁 MULTIMEDIA ASSETS MODULE ---
export const uploadMediaFile = async (businessId, mediaType, file) => {
  const data = new FormData()
  data.append('business_id', businessId)
  data.append('media_type', mediaType)
  data.append('file', file)

  // Multipart/Form-Data requires a raw fetch to handle boundary delimiters
  const res = await fetch(`${BASE}/media/upload`, {
    method: 'POST',
    body: data
  })
  
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  
  // Clean cache to reflect newly uploaded assets across the dashboard
  REQUEST_CACHE.clear()
  return res.json()
}

export const getMedia = (mediaId) =>
  api(`/media/${mediaId}`)

export const listMedia = (businessId, limit = 10, offset = 0) =>
  api(`/media/?business_id=${businessId}&limit=${limit}&offset=${offset}`)

export const deleteMedia = (mediaId) =>
  api(`/media/${mediaId}`, { method: 'DELETE' })

// --- 🎟 COUPONS & OFFERS MODULE ---
export const createCoupon = (payload) =>
  api('/coupons/', { method: 'POST', body: JSON.stringify(payload) })

export const getCoupon = (couponId) =>
  api(`/coupons/${couponId}`)

export const listCoupons = (businessId, limit = 10, offset = 0) =>
  api(`/coupons/?business_id=${businessId}&limit=${limit}&offset=${offset}`)

// --- 🤖 AI METADATA MODULE ---
export const createAiMetadata = (payload) =>
  api('/ai-metadata/', { method: 'POST', body: JSON.stringify(payload) })

export const getAiMetadata = (metadataId) =>
  api(`/ai-metadata/${metadataId}`)

export const listAiMetadata = (businessId, limit = 10, offset = 0) =>
  api(`/ai-metadata/?business_id=${businessId}&limit=${limit}&offset=${offset}`)

/**
 * generateAiMetadata
 * Triggers the AI pipeline to analyze the business profile.
 */
export const generateAiMetadata = (businessId) =>
  api(`/ai-metadata/generate?business_id=${businessId}`, { method: 'POST' })

export const deleteAiMetadata = (metadataId) =>
  api(`/ai-metadata/${metadataId}`, { method: 'DELETE' })

// --- 📜 JSON-LD SEO MODULE ---
export const generateJsonLD = (businessId) =>
  api(`/jsonld/generate?business_id=${businessId}`, { method: 'POST' })

export const listJsonLD = (businessId) =>
  api(`/jsonld/?business_id=${businessId}`)

export const getJsonLD = (feedId) =>
  api(`/jsonld/${feedId}`)

export const deleteJsonLD = (feedId) =>
  api(`/jsonld/${feedId}`, { method: 'DELETE' })

// --- 📈 VISIBILITY & AUDIT MODULE ---
export const runVisibilityCheck = (businessId) =>
  api(`/visibility/run?business_id=${businessId}`, { method: 'POST' })

export const listVisibilityResults = (businessId, limit = 20, offset = 0) =>
  api(`/visibility/result?business_id=${businessId}&limit=${limit}&offset=${offset}`)

export const listVisibilitySuggestions = (businessId, limit = 20, offset = 0) =>
  api(`/visibility/suggestion?business_id=${businessId}&limit=${limit}&offset=${offset}`)

/**
 * runExternalVisibilityCheck
 * * Logic: External Lead Generation.
 * Allows unauthenticated users to audit external sites from the landing page.
 */
export const runExternalVisibilityCheck = (url) =>
  api('/visibility/external', { method: 'POST', body: JSON.stringify({ url }) })