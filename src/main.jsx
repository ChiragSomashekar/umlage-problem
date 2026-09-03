import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Promo from './Promo.jsx'
import Flow from './Flow.jsx'
import Ridge from './Ridge.jsx'
import Reel from './Reel.jsx'

// ?promo  auto-playing pyramid film (record at 2x)
// ?flow   "there is no pot" film prototype
// ?ridge  ridgeline poster, one line per year
// ?reel   the ridge as a 9:16 film for instagram
// ?steps  same film, advanced one scene per click
const params = new URLSearchParams(window.location.search)
const isPromo = params.has('promo')
const isFlow = params.has('flow')
const isRidge = params.has('ridge')
const isReel = params.has('reel')
const isSteps = params.has('steps') // reel in manual mode

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSteps ? <Reel manual /> : isReel ? <Reel /> : isRidge ? <Ridge /> : isFlow ? <Flow /> : isPromo ? <Promo /> : <App />}
  </StrictMode>,
)
