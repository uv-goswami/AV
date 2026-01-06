import React from 'react'
import '../styles/theme.css'   // shared panel + utility styles
import '../styles/base.css'    // global resets + typography

/**
 * JsonBlock Component
 * * Provides a clean, formatted display for structured data or code snippets.
 * Essential for the 'AiVault' platform to show users exactly what data 
 * is being fed to AI agents (like JSON-LD schema).
 */
export default function JsonBlock({ title, data }) {
  /**
   * Data Sanitization Logic:
   * Handles both pre-stringified data and raw JS objects.
   * The 'JSON.stringify(data, null, 2)' ensures the output is "pretty-printed"
   * with 2-space indentation for maximum readability.
   */
  const formatted =
    typeof data === 'string'
      ? data
      : JSON.stringify(data, null, 2)

  return (
    <section className="json-block panel">
      {/* Dynamic Header: Only renders the title section if the prop is provided */}
      {title && <h3 className="json-title">{title}</h3>}
      
      {/* The <pre> tag is critical here as it preserves whitespace and 
          formatting, which is necessary for displaying code-like structures correctly.
      */}
      <pre className="code json-content">
        {formatted}
      </pre>
    </section>
  )
}