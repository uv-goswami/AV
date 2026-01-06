import React, { useState } from 'react'
import '../styles/collapsible.css'

/**
 * A reusable UI wrapper component that toggles visibility of its children.
 * Demonstrates a clean pattern for managing UI state (open/closed) 
 * and utilizing React's composition (props.children).
 */
export default function CollapsibleSection({ title, children }) {
  // State to track whether the content area is expanded or collapsed
  const [open, setOpen] = useState(false)

  return (
    <div className="collapsible-section">
      {/* The header acts as the control trigger. 
          onClick toggles the boolean 'open' state. 
      */}
      <button className="collapsible-header" onClick={() => setOpen(!open)}>
        {title}
        {/* Dynamic visual indicator changing based on component state */}
        <span className="toggle-icon">{open ? '−' : '+'}</span>
      </button>

      {/* Conditional Rendering: 
          The content area is only mounted/rendered when 'open' is true.
          This is an efficient way to handle complex nested UI components.
      */}
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  )
}