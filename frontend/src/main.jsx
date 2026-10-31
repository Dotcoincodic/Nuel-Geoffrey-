import React from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { ThemeProvider } from './theme'
import { StoreProvider } from './store'
import './index.css'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <App />
      </StoreProvider>
    </MotionConfig>
  </ThemeProvider>
)
