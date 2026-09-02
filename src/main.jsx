import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Promo from './Promo.jsx'
import Flow from './Flow.jsx'
import Ridge from './Ridge.jsx'
import Reel from './Reel.jsx'

// ?promo → the auto-playing pyramid film stage (record at 2x)
// ?flow  → "There is no pot" film prototype
// ?ridge → 150 years as one line each: the drawing that draws itself
// ?reel  → the ridge as a 9:16 teaching film (Instagram)
const params = new URLSearchParams(window.location.search)
const isPromo = params.has('promo')
const isFlow = params.has('flow')
const isRidge = params.has('ridge')
const isReel = params.has('reel')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isReel ? <Reel /> : isRidge ? <Ridge /> : isFlow ? <Flow /> : isPromo ? <Promo /> : <App />}
  </StrictMode>,
)
