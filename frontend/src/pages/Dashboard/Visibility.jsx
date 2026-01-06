import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from '../../components/SidebarNav'
import '../../styles/dashboard.css'
import { API_BASE } from '../../api/client'

/**
 * Visibility Audit Component
 * * The core analytical engine of the platform. It triggers and displays 
 * AI-driven audits that evaluate how a business is perceived by both 
 * search engine bots (LLMs/Crawlers) and human users.
 */
export default function Visibility() {
  const { id } = useParams()
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [running, setRunning] = useState(false)

  // Lifecycle: Load historical audit data on mount
  useEffect(() => {
    loadResults()
    loadSuggestions()
  }, [id])

  /**
   * runCheck
   * Orchestrates the POST request to trigger a fresh AI visibility scan.
   * Manages local loading states to prevent redundant execution.
   */
  async function runCheck() {
    setRunning(true)
    try {
      const res = await fetch(`${API_BASE}/visibility/run?business_id=${id}`, {
        method: 'POST'
      })
      const data = await res.json()
      // Optimistically add the new result to the top of the history list
      setResults(prev => [data, ...prev])
    } catch (err) {
      console.error("Audit execution failed:", err)
    } finally {
      setRunning(false)
    }
  }

  async function loadResults() {
    try {
      const res = await fetch(`${API_BASE}/visibility/result?business_id=${id}&limit=20&offset=0`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error("Result retrieval failed:", err)
    }
  }

  async function loadSuggestions() {
    try {
      const res = await fetch(`${API_BASE}/visibility/suggestion?business_id=${id}&limit=20&offset=0`)
      const data = await res.json()
      setSuggestions(data)
    } catch (err) {
      console.error("Suggestions retrieval failed:", err)
    }
  }

  /**
   * parseAnalysis
   * A transformation utility that decodes the structured string payload 
   * from the AI backend into distinct UI sections (Bots, Humans, Actions).
   */
  const parseAnalysis = (text) => {
    if (!text) return { bots: null, humans: null, actions: null }
    
    let bots = "No specific data"
    let humans = "No specific data"
    let actions = text

    // Split logic based on the backend's double-pipe delimiter strategy
    const parts = text.split('||')
    
    parts.forEach(part => {
        part = part.trim()
        if (part.startsWith('[BOTS]:')) bots = part.replace('[BOTS]:', '').trim()
        else if (part.startsWith('[HUMANS]:')) humans = part.replace('[HUMANS]:', '').trim()
        else if (part.startsWith('ACTIONS:')) actions = part.replace('ACTIONS:', '').trim()
    })

    return { bots, humans, actions }
  }

  /**
   * formatList
   * Normalizes semicolon-separated strings into iterable arrays for 
   * clean bullet-point rendering in the UI.
   */
  const formatList = (str) => {
    if (!str) return []
    return str.split(';').map(item => item.trim()).filter(item => item.length > 0)
  }

  /**
   * getScoreColor
   * Returns a semantic hex code based on the visibility score, 
   * reinforcing the data's health status through color theory.
   */
  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745' // Optimal (Green)
    if (score >= 50) return '#ffc107' // Warning (Yellow)
    return '#dc3545' // Critical (Red)
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <SidebarNav />
      </div>
      <div className="dashboard-content">
        
        {/* Audit Dashboard Header */}
        <div className="dashboard-header-flex">
            <div>
              <h2 className="page-title">Visibility Audit</h2>
              <p className="muted">
                Detailed analysis of your digital footprint for AI Agents and Customers.
              </p>
            </div>
            <button onClick={runCheck} disabled={running} className="audit-trigger-btn">
              {running ? 'Analyzing Data...' : 'Run New Audit'}
            </button>
        </div>

        <h3 className="section-divider">Audit History</h3>
        
        {results.length === 0 ? (
          <div className="panel empty-state">
            No visibility checks run yet. Click 'Run New Audit' to analyze your profile.
          </div>
        ) : (
          results.map(r => {
            const { bots, humans, actions } = parseAnalysis(r.recommendations)
            const issuesList = formatList(r.issues_found)
            const actionsList = formatList(actions)
            const scoreColor = getScoreColor(r.visibility_score)

            return (
              <div key={r.result_id} className="panel audit-card">
                
                {/* 1. Score Summary: Immediate visual feedback */}
                <div className="audit-card-header">
                    <div className="score-badge-container">
                        <div className="score-badge" style={{ background: scoreColor }}>
                            {r.visibility_score}
                        </div>
                        <div>
                            <div className="score-label">Visibility Score</div>
                            <div className="muted-small">
                                Audit Date: {new Date(r.completed_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Critical Alert Box: Highlights friction points found by the AI */}
                {issuesList.length > 0 && (
                    <div className="alert-panel-critical">
                        <h4 className="alert-title">Critical Issues Detected</h4>
                        <ul className="alert-list">
                            {issuesList.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Perspectives Grid: Comparing Bot vs. Human accessibility */}
                <div className="perspective-grid">
                    <div className="perspective-column">
                        <h4 className="perspective-title">Bot Perspective</h4>
                        <p className="perspective-text">{bots}</p>
                    </div>
                    <div className="perspective-column">
                        <h4 className="perspective-title">Human Perspective</h4>
                        <p className="perspective-text">{humans}</p>
                    </div>
                </div>

                {/* 4. Action Plan: Roadmap for visibility improvement */}
                <div className="action-plan-container">
                    <h4 className="action-title">Recommended Action Plan</h4>
                    {actionsList.length > 0 ? (
                        <ul className="action-list">
                            {actionsList.map((action, idx) => (
                                <li key={idx}>{action}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="muted">Current profile meets high visibility standards.</p>
                    )}
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}