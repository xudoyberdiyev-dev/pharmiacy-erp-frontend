import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import SleepBanner from './sleep/SleepBanner.jsx'
import { SLEEP_MODE } from './sleep/config.js'

const root = createRoot(document.getElementById('root'))

if (SLEEP_MODE) {
  // Uyqu rejimi (sleep/config.js): faqat butun ekranni qoplovchi banner.
  // App ATAYLAB dinamik import qilinadi va bu yerda UMUMAN yuklanmaydi —
  // aks holda lib/socket.js import paytidayoq backendga ulanardi. Har qanday
  // manzil (/login, /admin/... va h.k.) shu bannerni ko'rsatadi.
  root.render(
    <StrictMode>
      <SleepBanner />
    </StrictMode>,
  )
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  })
}
