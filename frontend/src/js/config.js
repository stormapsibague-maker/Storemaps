// ==========================================
// Storemaps - Configuración Global
// ==========================================

const CONFIG = {
    // API URL: Usa variable de entorno de Vite o detecta automáticamente
    API_URL: (() => {
        // 1. Primero intenta usar la variable de entorno de Vite (producción)
        // Vite expone variables que empiezan con VITE_ como import.meta.env
        try {
            if (import.meta.env && import.meta.env.VITE_API_URL) {
                console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
                return import.meta.env.VITE_API_URL;
            }
        } catch (e) {
            // import.meta.env no está disponible (script tradicional)
        }
        
        // 2. Segundo: usa window.env si existe (algunos hosts lo inyectan)
        if (window.env && window.env.API_URL) {
            console.log('🔧 Usando window.env.API_URL:', window.env.API_URL);
            return window.env.API_URL;
        }
        
        // 3. Detectar por hostname (desarrollo local vs producción)
        const hostname = window.location.hostname;
        const isLocal = (
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')
        );
        
        if (isLocal) {
            console.log('🏠 Desarrollo local detectado');
            return 'http://localhost:5000/api'; // Backend local
        }
        
        // 4. Fallback para producción (Render)
        console.log('🌐 Producción detectada, usando Render');
        return 'https://storemaps-api.onrender.com/api';
    })(),
    
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: '513136442281-k5gkpcs0anmi980ff00rb7cmsvj95aka.apps.googleusercontent.com',
    
    // Configuración de la app
    APP_NAME: 'Storemaps',
    DEFAULT_LOCATION: { 
        lat: 4.4447,  // Ibagué, Colombia
        lng: -75.2424 
    },
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    
    // Debug
    DEBUG: (() => {
        try {
            return import.meta.env?.DEV || false;
        } catch (e) {
            return false;
        }
    })()
};

// Exponer globalmente para todos los scripts
window.CONFIG = CONFIG;
window.API_URL = CONFIG.API_URL;

// Log para debugging
console.log('✅ Configuración cargada:', {
    API_URL: CONFIG.API_URL,
    ENTORNO: window.location.hostname,
    DEBUG: CONFIG.DEBUG
});

// Helper para verificar conexión
CONFIG.checkConnection = async function() {
    try {
        const response = await fetch(`${this.API_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend conectado:', data);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ No se puede conectar al backend:', error);
        return false;
    }
};

// Verificar conexión automáticamente (opcional)
// setTimeout(() => CONFIG.checkConnection(), 1000);