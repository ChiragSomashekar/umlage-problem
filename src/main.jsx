import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Promo from './Promo.jsx'

// ?promo → the auto-playing LinkedIn stage (540×675 → record at 2x = 1080×1350)
const isPromo = new URLSearchParams(window.location.search).has('promo')

createRoot(document.getElementById('root')).render(
  <StrictMode>{isPromo ? <Promo /> : <App />}</StrictMode>,
)
