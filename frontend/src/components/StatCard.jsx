import React from 'react'
import '../styles/theme.css'   // shared panel + grid styles
import '../styles/base.css'    // global resets + typography

/**
 * StatCard Component
 * * A specialized UI component designed for the Dashboard overview.
 * It provides a high-level summary of a specific metric (e.g., Visibility Score, 
 * total services, or media count), helping users quickly assess business health.
 */
export default function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card panel">
      <div className="stat-content">
        {/* Optional Icon Rendering:
            Enhances visual scannability by adding context-specific imagery 
            (e.g., a shield for security or a chart for visibility).
        */}
        {icon && <div className="stat-icon">{icon}</div>}
        
        <div className="stat-text">
          {/* Label for the metric - kept brief for clean UI hierarchy */}
          <h4 className="stat-title">{title}</h4>
          
          {/* The actual data point. Styled for high contrast and readability. */}
          <div className="stat-value">{value}</div>
        </div>
      </div>
    </div>
  )
}