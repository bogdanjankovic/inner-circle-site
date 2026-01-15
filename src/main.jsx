import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { TournamentProvider } from './context/TournamentContext'

import { HelmetProvider } from 'react-helmet-async'
import { AnalyticsProvider } from './context/AnalyticsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <TournamentProvider>
          <AnalyticsProvider>
            <App />
          </AnalyticsProvider>
        </TournamentProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
