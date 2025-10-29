import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/consolidated.css'
import './styles/component-fixes.css'
import './styles/design-improvements.css'
import './styles/rma-dashboard-fixes.css'
import './styles/navigation-fixes.css'
import './styles/login-page-fixes.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 