import React from 'react'
import '../styles/base.css'   // global utility styles
import '../styles/theme.css'  // shared theme styles

/**
 * FormSection Component
 * * A semantic wrapper used to group related form inputs. This layout pattern
 * separates documentation (title/description) from the input controls,
 * which significantly improves the User Experience in complex data-entry flows.
 */
export default function FormSection({ title, description, children }) {
  return (
    <section className="form-section">
      {/* Contextual Header: 
          Provides the user with a clear heading for the grouped inputs.
          The optional description helps guide users through specific data requirements.
      */}
      <div className="form-header">
        <h3 className="form-title">{title}</h3>
        {description && <p className="form-desc">{description}</p>}
      </div>

      {/* Body Container:
          Renders the actual form controls (inputs, selects, etc.) passed via 'children'.
          Separating the header and body allows for flexible CSS grid/flexbox layouts.
      */}
      <div className="form-body">
        {children}
      </div>
    </section>
  )
}