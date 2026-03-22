// src/js/forum.js - CORREGIDO
const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';

// ... (todo igual hasta submitPost)

async function submitPost(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    
    const type = document.querySelector('input[name="postType"]:checked')?.value;
    const title = document.getElementById('postTitle')?.value.trim();
    const content = document.getElementById('postContent')?.value.trim();
    const price = document.getElementById('postPrice')?.value;
    const originalPrice = document.getElementById('postOriginalPrice')?.value;
    const useLocation = document.getElementById('useCurrentLocation')?.checked;
    
    if (!title || !content) {
        showToast('Completa los campos obligatorios');
        return;
    }
    
    const postData = {
        type,
        title,
        content,
        price: price ? parseFloat(price) : undefined,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        location: useLocation ? userLocation : undefined,
        images: [] // ← Por ahora vacío, endpoint /upload/image no existe
    };
    
    // ✅ ELIMINADO: El código de subida de imágenes porque el endpoint no existe
    // Si quieres imágenes, debes implementar subida a Cloudinary primero
    
    try {
        showToast('Publicando...', 0);
        
        const response = await fetch(`${API_URL}/forum/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        
        hideToast();
        
        if (response.ok) {
            closeCreateModal();
            showToast('¡Publicado exitosamente! 🎉');
            loadPosts();
        } else {
            const err = await response.json();
            showToast(err.message || 'Error al publicar');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

// ... resto igual