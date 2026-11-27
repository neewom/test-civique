// Entry of 404.html (the page Netlify answers with the code 404): the stylesheet of the app and one
// page view, /adresse-inconnue, like the app counts an unknown address (same rules: production domain only)
import './index.css'
import { UNKNOWN_PATH, trackPageView } from './lib/analytics'

trackPageView(UNKNOWN_PATH)
