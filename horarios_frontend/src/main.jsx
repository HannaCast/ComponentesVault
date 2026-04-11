import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.documentElement;

if (!rootElement.dataset.theme) {
  rootElement.dataset.theme = 'light';
}

if (!rootElement.dataset.accent) {
  rootElement.dataset.accent = 'blue';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
