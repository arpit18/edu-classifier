import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PDFEducationalClassifier from './pdf/PDFEducationalClassifier.tsx'

export function Shell() {
  return (
    <div>
      <nav style={{ padding: '0 16px', borderBottom: '1px solid #e5e7eb', marginBottom: 12, position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink
            to="/text"
            end
            style={({ isActive }) => ({
              padding: '12px 16px',
              borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
              color: isActive ? '#111827' : '#374151',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              background: isActive ? '#f9fafb' : 'transparent',
              whiteSpace: 'nowrap',
            })}
          >
            Zero-Shot Classifier
          </NavLink>
          <NavLink
            to="/pdf"
            style={({ isActive }) => ({
              padding: '12px 16px',
              borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
              color: isActive ? '#111827' : '#374151',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              background: isActive ? '#f9fafb' : 'transparent',
              whiteSpace: 'nowrap',
            })}
          >
            Heuristics based Classifier
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/text" replace />} />
        <Route path="/text" element={<App />} />
        <Route path="/pdf" element={
          <div className="app-shell" style={{ maxWidth: 1200, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <header className="app-header">
        <h1>Educational PDF Classifier</h1>
        <p>
          Fast on-device classification using rule-based signals, document
          structure, and metadata.
        </p>
      </header>
      <PDFEducationalClassifier />
    </div>
  } />
        <Route path="*" element={<Navigate to="/text" replace />} />
      </Routes>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Shell />
    </HashRouter>
  </StrictMode>,
)
