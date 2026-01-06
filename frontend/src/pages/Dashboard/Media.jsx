import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
// ✅ Centralized API helpers for consistent media operations and caching
import { listMedia, uploadMediaFile, deleteMedia, API_BASE, getFromCache } from '../../api/client'
import '../../styles/dashboard.css'

/**
 * Media Management Component
 * * Handles the lifecycle of business assets including images, videos, and documents.
 * Features automatic file-type detection, size validation, and cache-first rendering.
 */
export default function Media() {
  const { id } = useParams()
  
  /**
   * Performance: Instant UI Loading
   * Retrieves previously fetched media assets from the global cache to 
   * eliminate loading flickers for returning users.
   */
  const [media, setMedia] = useState(() => {
    const cached = getFromCache(`/media/?business_id=${id}&limit=100&offset=0`)
    return Array.isArray(cached) ? cached : []
  })

  // State for managing the upload form and binary file data
  const [form, setForm] = useState({ media_type: null, file: null })
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Revalidation Hook: Background Synchronization
   * Ensures the UI reflects the most recent assets stored on the server.
   */
  useEffect(() => {
    loadMedia()
  }, [id])

  async function loadMedia() {
    try {
      const data = await listMedia(id, 100, 0)
      setMedia(data)
    } catch (err) {
      console.error("Media sync error:", err)
    }
  }

  /**
   * handleUpload
   * Orchestrates the multipart/form-data submission to the backend.
   * Includes client-side safety checks to prevent unnecessary server strain.
   */
  async function handleUpload() {
    try {
      if (!form.file || !form.media_type) return

      // Security & UX: Prevent uploads exceeding the 50MB infrastructure limit
      if (form.file.size > 50 * 1024 * 1024) {
        setError('File too large. Max allowed size is 50 MB.')
        return
      }

      await uploadMediaFile(id, form.media_type, form.file)
      
      // Reset state upon successful synchronization
      setForm({ media_type: null, file: null })
      setShowForm(false)
      setError(null)
      loadMedia() // Refresh the media gallery
    } catch (err) {
      console.error(err)
      setError('Upload failed. Please check file type and network connection.')
    }
  }

  async function handleDelete(assetId) {
    try {
      await deleteMedia(assetId)
      loadMedia()
    } catch (err) {
      console.error("Deletion failed:", err)
    }
  }

  /**
   * detectMediaType
   * Helper utility to classify files based on extensions.
   * This simplifies the UI by removing the need for users to manually select a category.
   */
  function detectMediaType(file) {
    if (!file) return null
    const ext = file.name.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document'
    return null
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">Media Assets</h2>

        {/* User Feedback: Display validation or network errors */}
        {error && <p className="error-message">{error}</p>}

        <div className="media-gallery">
          {media.length === 0 ? (
            <p className="placeholder-text">No media uploaded yet.</p>
          ) : (
            media.map(m => (
              <div key={m.asset_id} className="panel media-card">
                <p className="meta-label"><strong>Type:</strong> {m.media_type.toUpperCase()}</p>

                {/* Polymorphic Rendering: Display the asset based on its content type */}
                {m.media_type === 'image' && (
                  <img
                    src={`${API_BASE}${m.url}`}
                    alt="Business Asset"
                    className="preview-image"
                    loading="lazy"
                  />
                )}
                
                {m.media_type === 'video' && (
                  <video controls className="preview-video">
                    <source src={`${API_BASE}${m.url}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                
                {m.media_type === 'document' && (
                  <div className="document-link">
                    <a href={`${API_BASE}${m.url}`} target="_blank" rel="noopener noreferrer">
                      📄 View Document
                    </a>
                  </div>
                )}

                <button className="ghost delete-btn" onClick={() => handleDelete(m.asset_id)}>
                  Delete Asset
                </button>
              </div>
            ))
          )}
        </div>

        {/* Toggleable Upload Interface */}
        {!showForm ? (
          <button className="ghost" onClick={() => setShowForm(true)}>+ Upload New Media</button>
        ) : (
          <div className="form-section panel">
            <div className="form-header">
              <h3 className="form-title">Upload Asset</h3>
              <p className="form-desc">Select an image, video, or document (max 50 MB)</p>
            </div>
            <div className="form-body">
              <input
                type="file"
                className="file-input"
                onChange={e => {
                  const file = e.target.files[0]
                  const type = detectMediaType(file)
                  if (!type && file) {
                    setError('Unsupported file format.')
                    setForm({ media_type: null, file: null })
                  } else {
                    setError(null)
                    setForm({ media_type: type, file })
                  }
                }}
              />
              <div className="btn-group">
                <button onClick={handleUpload} disabled={!form.file}>Start Upload</button>
                <button className="ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}