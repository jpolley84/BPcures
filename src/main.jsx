import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './utils/analytics.js'
import { initManychatLanding } from './utils/manychat.js'

initAnalytics()
// ManyChat rebuild 2026-08-14: if this page was opened from a DM link carrying
// ?mcp=<contact id>, tell ManyChat she landed. That tag is what stops the 20h
// nudge from chasing someone who is already on the site. Fire-and-forget.
initManychatLanding()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
