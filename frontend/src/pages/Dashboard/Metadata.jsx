import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import '../../styles/dashboard.css'
// ✅ Centralized API client for AI operations and session caching
import { 
  API_BASE, 
  getFromCache, 
  listAiMetadata, 
  generateAiMetadata 
} from '../../api/client'

/**
 * AI Metadata Management Component
 * * Handles the lifecycle of AI-generated business insights.
 * This component interfaces with the Gemini API backend to extract 
 * keywords, entities, and intent labels from business data.
 */
export default function Metadata() {
  const { id } = useParams()
  
  /**
   * Performance Strategy: Instant Hydration
   * Initializes the state using the memory cache. This ensures the user 
   * sees their previously analyzed AI data without waiting for a network round-trip.
   */
  const [metadata, setMetadata] = useState(() => {
    // Exact URL mapping to ensure cache-hit consistency with the client helper
    const cached = getFromCache(`/ai-metadata/?business_id=${id}&limit=20&offset=0`)
    return Array.isArray(cached) ? cached : []
  })

  /**
   * Revalidation Hook: Syncing with AI Backend
   * Background fetch ensures the dashboard reflects the most recent analysis 
   * performed by the AI agents.
   */
  useEffect(() => {
    loadMetadata()
  }, [id])

  async function loadMetadata() {
    try {
      // Populates the global cache and updates local state
      const data = await listAiMetadata(id, 20, 0)
      setMetadata(data)
    } catch (err) {
      console.error("Metadata retrieval failed:", err)
    }
  }

  /**
   * handleGenerate
   * Triggers the AI pipeline to analyze the business profile.
   * Demonstrates handling of high-compute background tasks from the UI.
   */
  async function handleGenerate() {
    try {
      // The generate helper is configured to invalidate stale caches automatically
      await generateAiMetadata(id)
      loadMetadata() // Re-fetch to display the fresh AI output
    } catch (err) {
      console.error("AI Generation failed:", err)
    }
  }

  /**
   * handleDelete
   * Implements an Optimistic Update pattern.
   * We modify the UI state immediately to reflect the deletion, providing 
   * a snappy user experience while the backend process completes.
   */
  async function handleDelete(metaId) {
    try {
      const res = await fetch(`${API_BASE}/ai-metadata/${metaId}`, { method: 'DELETE' })
      
      if (res.ok) {
        // UI filtering ensures the local view doesn't wait for a full reload
        setMetadata(prev => prev.filter(m => m.ai_metadata_id !== metaId))
      }
    } catch (err) {
      console.error("Deletion failed:", err)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        <h2 className="page-title">AI Metadata & Insights</h2>
        
        {/* Trigger for the AI analysis engine */}
        <button onClick={handleGenerate}>Run AI Analysis</button>

        <div className="metadata-results">
          {metadata.length === 0 ? (
            <p className="placeholder-text">No insights generated. Click the button above to analyze your business profile with AI.</p>
          ) : (
            metadata.map(m => (
              <div key={m.ai_metadata_id} className="panel metadata-card">
                <div className="data-group">
                  <strong>Extracted Insights:</strong>
                  <p>{m.extracted_insights}</p>
                </div>
                
                <div className="data-group">
                  <strong>Detected Entities:</strong>
                  <p className="tag-list">{m.detected_entities}</p>
                </div>
                
                <div className="data-group">
                  <strong>Keywords:</strong>
                  <p className="tag-list">{m.keywords}</p>
                </div>
                
                <div className="data-group">
                  <strong>Intent Labels:</strong>
                  <p className="tag-list">{m.intent_labels}</p>
                </div>

                <button className="ghost delete-btn" onClick={() => handleDelete(m.ai_metadata_id)}>
                  Delete Snapshot
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}