import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.documentElement;

if (!rootElement.getAttribute('data-theme')) {
  rootElement.setAttribute('data-theme', 'light');
}

if (!rootElement.getAttribute('data-accent')) {
  rootElement.setAttribute('data-accent', 'blue');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
