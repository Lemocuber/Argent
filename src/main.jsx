import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/azeret-mono'
import App from './App.jsx'
import './styles.css'

document.addEventListener('contextmenu', event => event.preventDefault())
document.addEventListener('gesturestart', event => event.preventDefault())
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
