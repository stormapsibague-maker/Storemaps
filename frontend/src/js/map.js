const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';

let map = null;
let markers = [];
let userLocation = null;
let storesCache = [];
let mapInitialized = false;

// Verificar si Leaflet está disponible
function checkLeaflet() {
    return typeof L !== 'undefined' && L.map && L.tileLayer;
}

// Mostrar error de Leaflet
function showLeafletError() {
    const container = document.getElementById('map');
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                border-radius: 16px; 
                padding: 40px; 
                text-align: center;
                border: 2px dashed #d1d5db;
            ">
                <i class="fas fa-map-marked-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                <h3 style="color: #374151; margin-bottom: 8px; font-size: 18px;">Error al cargar el mapa</h3>
                <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">
                    No se pudo cargar la librería de mapas. Verifica tu conexión a internet.
                </p>
                <button onclick="location.reload()" class="btn btn-primary" style="padding: 10px 20px;">
                    <i class="fas fa-redo"></i> Recargar página
                </button>
            </div>
        `;
    }
}

// Inicializar mapa con reintentos
function initMapWithRetry(attempts = 0) {
    if (checkLeaflet()) {
        initMap();
        return;
    }
    
    if (attempts < 10) {
        console.log(`⏳ Esperando Leaflet... intento ${attempts + 1}/10`);
        setTimeout(() => initMapWithRetry(attempts + 1), 500);
    } else {
        console.error('❌ Leaflet no se cargó después de 10 intentos');
        showLeafletError();
    }
}

function initMap() {
    console.log('🗺️ Inicializando mapa...');
    
    if (!checkLeaflet()) {
        showLeafletError();
        return;
    }
    
    if (mapInitialized) {
        console.log('Mapa ya inicializado');
        return;
    }

    // Default: El Jordán, Ibagué
    const defaultLoc = [4.4447, -75.2424];
    
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Contenedor #map no encontrado');
            return;
        }

        // Limpiar contenido previo
        mapContainer.innerHTML = '';
        
        map = L.map('map', {
            center: defaultLoc,
            zoom: 15,
            zoomControl: false
        });
        
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        
        // Tile layer con múltiples proveedores de fallback
        const tileLayers = [
            {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors'
            },
            {
                url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                attribution: '©OpenStreetMap, ©CartoDB'
            }
        ];
        
        // Intentar cargar el primer tile layer
        L.tileLayer(tileLayers[0].url, {
            attribution: tileLayers[0].attribution,
            maxZoom: 19,
            crossOrigin: true
        }).addTo(map);
        
        mapInitialized = true;
        
        // Cargar ubicación y tiendas
        loadUserLocation();
        
    } catch (error) {
        console.error('Error mapa:', error);
        showLeafletError();
    }
}

function loadUserLocation() {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
        try {
            userLocation = JSON.parse(saved);
            if (map) {
                map.setView([userLocation.lat, userLocation.lng], 16);
            }
            loadStores();
            return;
        } catch (e) {
            console.log('Error parseando ubicación guardada');
        }
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                localStorage.setItem('userLocation', JSON.stringify(userLocation));
                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 16);
                }
                loadStores();
            },
            (error) => {
                console.log('Geolocalización falló:', error.message);
                userLocation = { lat: 4.4447, lng: -75.2424 };
                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 15);
                }
                loadStores();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        userLocation = { lat: 4.4447, lng: -75.2424 };
        if (map) {
            map.setView([userLocation.lat, userLocation.lng], 15);
        }
        loadStores();
    }
}

async function loadStores(retryCount = 0) {
    if (!userLocation) return;
    
    try {
        const response = await fetch(
            `${API_URL}/stores?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=15000`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const stores = await response.json();
        storesCache = stores;
        renderStores(stores);
        
    } catch (error) {
        console.error('Error cargando tiendas:', error);
        
        // Reintentar hasta 3 veces
        if (retryCount < 3) {
            console.log(`Reintentando cargar tiendas... (${retryCount + 1}/3)`);
            setTimeout(() => loadStores(retryCount + 1), 2000);
        } else {
            showToast('Error cargando tiendas. Intenta recargar la página.');
        }
    }
}

function renderStores(stores) {
    if (!map) return;
    
    // Limpiar marcadores anteriores
    markers.forEach(m => {
        try {
            map.removeLayer(m);
        } catch (e) {}
    });
    markers = [];
    
    if (stores.length === 0) {
        showToast('No hay tiendas cercanas');
        return;
    }
    
    stores.forEach(store => {
        const lat = store.lat || store.location?.coordinates?.[1];
        const lng = store.lng || store.location?.coordinates?.[0];
        
        if (!lat || !lng) return;
        
        const isVerified = store.companyId?.verificationLevel === 'verified';
        const color = isVerified ? '#0066FF' : '#9CA3AF';
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: ${color}; 
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50% 50% 50% 0; 
                    transform: rotate(-45deg); 
                    border: 3px solid white; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                ">
                    <i class="fas fa-store" style="color: white; font-size: 14px; transform: rotate(45deg);"></i>
                </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36]
            })
        }).addTo(map);
        
        const popupContent = `
            <div style="min-width: 280px; font-family: Inter, sans-serif;">
                <img src="${store.images?.[0] || 'https://via.placeholder.com/300x150?text=Sin+Imagen'}" 
                     style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">${store.name}</h3>
                <div style="color: #FFB300; font-size: 14px; margin-bottom: 8px;">
                    ${'★'.repeat(Math.floor(store.rating || 0))}
                    <span style="color: #6b7280;">(${store.reviewsCount || 0})</span>
                </div>
                <button onclick="openStoreModal('${store._id}')" 
                        style="width: 100%; background: #0066FF; color: white; border: none; 
                               padding: 12px; border-radius: 24px; font-weight: 600; cursor: pointer;">
                    Ver tienda
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 320 });
        markers.push(marker);
    });
}

async function openStoreModal(storeId) {
    console.log('Abriendo tienda:', storeId);
    // Implementación del modal...
    showToast('Cargando tienda...');
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #0A1628;
        color: white;
        padding: 16px 28px;
        border-radius: 50px;
        font-weight: 500;
        z-index: 10000;
        font-size: 14px;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Usar ubicación actual en el mapa principal
function useMyLocationMap() {
  const btn = document.getElementById('btnMyLocationMap');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...'; }

  const applyLocation = (lat, lng) => {
    userLocation = { lat, lng };
    localStorage.setItem('userLocation', JSON.stringify(userLocation));
    const locLabel = document.querySelector('#userLocation span');
    if (locLabel) locLabel.textContent = 'Mi ubicación actual';
    if (map) {
      map.setView([lat, lng], 16);
      if (window._userLocMarker) map.removeLayer(window._userLocMarker);
      window._userLocMarker = L.circleMarker([lat, lng], {
        radius: 10, fillColor: '#3b82f6', color: 'white', weight: 3, fillOpacity: 0.95
      }).addTo(map).bindPopup('<b>📍 Estás aquí</b>').openPopup();
    }
    loadStores();
    showToast('✅ Mapa centrado en tu ubicación');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-crosshairs"></i> Mi ubicación'; }
  };

  const fallbackToIP = () => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        if (d && d.latitude) {
          applyLocation(parseFloat(d.latitude), parseFloat(d.longitude));
          showToast('📍 Ubicación aproximada por IP');
        } else {
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-crosshairs"></i> Mi ubicación'; }
        }
      }).catch(() => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-crosshairs"></i> Mi ubicación'; }
      });
  };

  if (!navigator.geolocation) { fallbackToIP(); return; }

  navigator.geolocation.getCurrentPosition(
    pos => applyLocation(pos.coords.latitude, pos.coords.longitude),
    () => fallbackToIP(),
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
  );
}


window.openStoreModal = openStoreModal;
window.useMyLocationMap = useMyLocationMap;