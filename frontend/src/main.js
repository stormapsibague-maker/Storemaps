// ==========================================
// Storemaps Frontend - Entry Point
// ==========================================

// Importar estilos globales (Vite los procesará)
import './styles.css'

// Configuración global de la API
const isProduction = import.meta.env.PROD
const isDevelopment = import.meta.env.DEV

// URL del API según el entorno
window.API_URL = isProduction 
  ? (import.meta.env.VITE_API_URL || 'https://storemaps-api.onrender.com/api')
  : 'http://localhost:5000/api'

// Guardar también en localStorage para los scripts no-módulo si es necesario
localStorage.setItem('API_URL', window.API_URL)

console.log('🚀 Storemaps initialized')
console.log('📍 Environment:', isProduction ? 'production' : 'development')
console.log('🔗 API URL:', window.API_URL)

// Inicializar utilidades globales
window.showToast = function(message, duration = 3000) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  document.body.appendChild(toast)
  
  requestAnimationFrame(() => toast.classList.add('show'))
  
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, duration)
  }
  
  return toast
}

window.hideToast = function() {
  const toast = document.querySelector('.toast')
  if (toast) {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }
}