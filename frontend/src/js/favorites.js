// src/js/favorites.js - CORREGIDO
const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';

// ... (todo igual hasta renderFavorites)

async function renderFavorites(favoriteIds) {
    const container = document.getElementById('favoritesContainer');
    
    try {
        // ✅ CORREGIDO: Usar GET con query params, no POST
        const idsParam = favoriteIds.slice(0, 50).join(',');
        const response = await fetch(`${API_URL}/products/batch?ids=${idsParam}`, {
            method: 'GET',  // ← Cambiado a GET
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Error cargando productos');
        
        const data = await response.json();
        const products = data.products || [];
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            showEmptyState();
            return;
        }
        
        // ... resto igual
        
    } catch (error) {
        // ... igual
    }
}

// ... resto del archivo igual