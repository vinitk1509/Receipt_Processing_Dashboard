import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Root element #root not found. Check that index.html contains <div id="root"></div>.'
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
)
