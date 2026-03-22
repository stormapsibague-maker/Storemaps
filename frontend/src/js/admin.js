// src/js/admin.js - PANEL DE EMPRESA COMPLETO
const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';

let storeData = null;
let currentProducts = [];
let currentVideos = [];

// Verificar autenticación de empresa
async function checkAuth() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    // Solo empresas, NO superadmin
    if (!token || (userType !== 'company' && userType !== 'superadmin')) {
        window.location.href = 'profile.html';
        return;
    }
    
    // Si es superadmin, redirigir a su panel
    if (userType === 'superadmin') {
        window.location.href = 'superadmin.html';
        return;
    }
    
    await loadMyStore();
    await loadDashboard();
    await loadProducts();
    await loadVideos();
    await loadMyForumPosts();
}

function showSection(section) {
    // Ocultar todas las secciones
    ['dashboard', 'products', 'videos', 'forum', 'store', 'stats'].forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.style.display = 'none';
    });
    
    // Mostrar sección seleccionada
    const selected = document.getElementById(section + 'Section');
    if (selected) selected.style.display = 'block';
    
    // Actualizar menú activo
    document.querySelectorAll('.admin-menu a').forEach(a => a.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('a').classList.add('active');
    }
}

// Cargar MI tienda
async function loadMyStore() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/stores/my/store`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 404) {
            // No tiene tienda, mostrar formulario de creación
            showCreateStoreModal();
            return;
        }
        
        if (!response.ok) throw new Error('Error cargando tienda');
        
        storeData = await response.json();
        
        // Llenar formulario de tienda
        document.getElementById('storeName').value = storeData.name || '';
        document.getElementById('storeDesc').value = storeData.description || '';
        document.getElementById('storeAddress').value = storeData.location?.address || '';
        document.getElementById('storePhone').value = storeData.phone || '';
        document.getElementById('storeOpen').value = storeData.schedule?.open || '09:00';
        document.getElementById('storeClose').value = storeData.schedule?.close || '20:00';
        
        // Mostrar imagen actual de la tienda
        const imgPreview = document.getElementById('storeCurrentImg');
        if (imgPreview) {
            if (storeData.images && storeData.images.length > 0) {
                imgPreview.src = storeData.images[0];
                imgPreview.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error cargando tu tienda');
    }
}

async function loadDashboard() {
    if (!storeData) return;
    
    document.getElementById('statProducts').textContent = storeData.productsCount || 0;
    document.getElementById('statRating').textContent = (storeData.rating || 0).toFixed(1);
    document.getElementById('statViews').textContent = storeData.stats?.totalViews || 0;
    document.getElementById('statFavorites').textContent = storeData.stats?.totalFavorites || 0;
}

async function loadProducts() {
    const token = localStorage.getItem('token');
    
    try {
        // ✅ FIX: usar endpoint autenticado /my-products en lugar del público
        const response = await fetch(`${API_URL}/products/my-products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error cargando productos');
        
        const data = await response.json();
        currentProducts = data.products || [];
        
        const container = document.getElementById('productsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <h3>No tienes productos aún</h3>
                    <p>Agrega tu primer producto para empezar a vender</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="showAddProduct()">
                        <i class="fas fa-plus"></i> Agregar producto
                    </button>
                </div>
            `;
            return;
        }
        
        currentProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div style="position: relative;">
                    <img src="${product.images?.[0] || 'https://via.placeholder.com/300?text=Sin+Imagen'}" 
                         alt="${product.name}"
                         style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px 12px 0 0;"
                         onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
                    <span style="position: absolute; top: 8px; left: 8px; background: ${product.isActive ? 'var(--success)' : 'var(--danger)'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                        ${product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="product-info" style="padding: 16px;">
                    <div class="product-title" style="font-weight: 600; margin-bottom: 8px;">${product.name}</div>
                    <div class="product-price" style="color: var(--primary); font-size: 20px; font-weight: 700; margin-bottom: 8px;">
                        $${product.price?.toLocaleString() || 0}
                    </div>
                    <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 12px;">
                        <i class="fas fa-eye"></i> ${product.views || 0} vistas · 
                        <i class="fas fa-heart"></i> ${product.favorites || 0} favs
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" style="flex: 1; padding: 8px; font-size: 12px;" onclick="deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        
        // Llenar select de videos
        const videoSelect = document.getElementById('videoProduct');
        if (videoSelect) {
            videoSelect.innerHTML = '<option value="">Sin producto relacionado</option>';
            currentProducts.forEach(p => {
                videoSelect.innerHTML += `<option value="${p._id}">${p.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error cargando productos');
    }
}

async function loadVideos() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/videos/my-videos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        currentVideos = await response.json();
        
        const container = document.getElementById('videosList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (currentVideos.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                    <i class="fas fa-video-slash" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <h3>No tienes videos aún</h3>
                    <p>Sube videos cortos para promocionar tus productos</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="showAddVideo()">
                        <i class="fas fa-plus"></i> Subir video
                    </button>
                </div>
            `;
            return;
        }
        
        currentVideos.forEach(video => {
            const div = document.createElement('div');
            div.style.cssText = 'background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);';
            div.innerHTML = `
                <video src="${video.url}" style="width: 100%; height: 200px; object-fit: cover;" controls poster="${video.thumbnail || ''}"></video>
                <div style="padding: 16px;">
                    <p style="font-weight: 600; margin-bottom: 8px;">${video.caption || 'Sin descripción'}</p>
                    ${video.productId ? `<p style="font-size: 13px; color: var(--primary); margin-bottom: 8px;"><i class="fas fa-tag"></i> ${video.productId.name}</p>` : ''}
                    <div style="display: flex; gap: 16px; color: var(--gray-500); font-size: 13px;">
                        <span><i class="fas fa-heart"></i> ${video.likes || 0}</span>
                        <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                        <span><i class="fas fa-comment"></i> ${video.comments?.length || 0}</span>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// FORO DE OFERTAS
async function loadMyForumPosts() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/forum/posts/my-posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const posts = await response.json();
        
        const container = document.getElementById('myForumPosts');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No tienes publicaciones en el foro</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="showAddForumPost()">
                        Crear primera publicación
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(p => `
            <div class="forum-post" data-type="${p.type}" style="background: var(--gray-50); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <div class="forum-post-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="badge ${p.type === 'offer' ? 'badge-offer' : 'badge-request'}">
                                ${p.type === 'offer' ? 'OFERTA' : 'SOLICITUD'}
                            </span>
                            ${p.isHighlighted ? '<span style="background: linear-gradient(135deg, #ffd700, #ffaa00); color: #5d4037; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;"><i class="fas fa-star"></i> Destacado</span>' : ''}
                        </div>
                        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${p.title}</h4>
                        <p style="font-size: 12px; color: var(--gray-500);">
                            <i class="fas fa-clock"></i> ${new Date(p.createdAt).toLocaleString()}
                            ${p.price ? `· <i class="fas fa-tag"></i> $${p.price.toLocaleString()}` : ''}
                        </p>
                    </div>
                    <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" onclick="deleteForumPost('${p._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p style="color: var(--gray-700); line-height: 1.6; margin-bottom: 12px;">${p.content}</p>
                ${p.images?.length ? `
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        ${p.images.map(img => `<img src="${img}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">`).join('')}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 16px; font-size: 13px; color: var(--gray-500);">
                    <span><i class="fas fa-heart"></i> ${p.likes?.length || 0} likes</span>
                    <span><i class="fas fa-comment"></i> ${p.comments?.length || 0} comentarios</span>
                    ${p.expiresAt ? `<span style="color: var(--warning);"><i class="fas fa-hourglass-half"></i> Expira: ${new Date(p.expiresAt).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando posts del foro:', error);
    }
}

// MODALES Y FORMULARIOS
function showCreateStoreModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'createStoreModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-bottom: 8px;">Crear tu tienda</h2>
            <p style="color: var(--gray-500); margin-bottom: 20px; font-size:14px;">Completa la información de tu negocio para aparecer en el mapa</p>
            
            <form onsubmit="createStore(event)">
                <!-- FOTO DEL NEGOCIO -->
                <div class="form-group">
                    <label class="form-label" style="font-weight:700;">📷 Foto del negocio</label>
                    <div id="newStoreImgPreview" style="
                        width:100%;height:180px;background:#f3f4f6;border-radius:12px;
                        display:flex;flex-direction:column;align-items:center;justify-content:center;
                        cursor:pointer;border:2px dashed #d1d5db;overflow:hidden;position:relative;
                        transition:.2s;margin-bottom:8px;" onclick="document.getElementById('newStoreImages').click()">
                        <i class="fas fa-camera" style="font-size:36px;color:#9ca3af;margin-bottom:8px;"></i>
                        <span style="font-size:13px;color:#6b7280;">Toca para subir foto de tu negocio</span>
                        <span style="font-size:11px;color:#9ca3af;margin-top:4px;">Aparecerá en el mapa y en el perfil</span>
                    </div>
                    <input type="file" id="newStoreImages" style="display:none;" accept="image/*" multiple onchange="previewStoreImages('newStoreImages','newStoreImgPreview')">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nombre de la tienda *</label>
                    <input type="text" id="newStoreName" class="form-input" placeholder="Ej: Boutique Valentina" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea id="newStoreDesc" class="form-input" rows="2" placeholder="Cuéntanos qué vendes..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Dirección completa *</label>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <input type="text" id="newStoreAddress" class="form-input" placeholder="Ej: Calle 10 # 5-23, El Jordán, Ibagué" required style="flex:1;">
                        <button type="button" onclick="useLocationForStore()" title="Usar mi ubicación actual"
                            style="background:#3b82f6;color:white;border:none;padding:10px 12px;border-radius:10px;cursor:pointer;white-space:nowrap;font-size:13px;display:flex;align-items:center;gap:5px;">
                            <i class="fas fa-crosshairs"></i> <span style="display:none;" class="loc-btn-text">Mi ubicación</span>
                        </button>
                    </div>
                    <p style="font-size:11px;color:#9ca3af;margin-top:4px;"><i class="fas fa-info-circle"></i> Puedes usar tu ubicación actual para colocar el pin exacto en el mapa</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Teléfono *</label>
                    <input type="tel" id="newStorePhone" class="form-input" placeholder="Ej: 3001234567" required>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Hora apertura</label>
                        <input type="time" id="newStoreOpen" class="form-input" value="09:00">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hora cierre</label>
                        <input type="time" id="newStoreClose" class="form-input" value="20:00">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Categoría</label>
                    <select id="newStoreCategory" class="form-input">
                        <option value="mixto">Ropa y Calzado</option>
                        <option value="ropa">Solo Ropa</option>
                        <option value="calzado">Solo Calzado</option>
                        <option value="comida">Comida</option>
                        <option value="tecnologia">Tecnología</option>
                        <option value="belleza">Belleza</option>
                        <option value="deporte">Deporte</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">
                    <i class="fas fa-store"></i> Crear mi tienda
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Previsualizar imágenes de tienda
function previewStoreImages(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.style.border = 'none';
        preview.innerHTML = `
            <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
            <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:white;
                        border-radius:20px;padding:4px 12px;font-size:11px;cursor:pointer;"
                 onclick="event.stopPropagation();document.getElementById('${inputId}').click()">
                <i class="fas fa-camera"></i> Cambiar foto
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// Usar ubicación actual para la tienda nueva
let _newStoreCoords = null;
function useLocationForStore() {
    if (!navigator.geolocation) {
        showToast('Tu navegador no soporta geolocalización');
        return;
    }
    showToast('Obteniendo ubicación...', 0);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            _newStoreCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            hideToast();
            showToast('✅ Ubicación capturada. El pin del mapa usará tu posición actual.');
        },
        (err) => {
            hideToast();
            showToast('No se pudo obtener la ubicación. Usa la dirección manual.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function createStore(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    // Usar coordenadas GPS capturadas, o por defecto Ibagué
    const coords = _newStoreCoords
        ? [_newStoreCoords.lng, _newStoreCoords.lat]
        : [-75.2424, 4.4447];
    
    const storeData = {
        name: document.getElementById('newStoreName').value,
        description: document.getElementById('newStoreDesc').value,
        location: {
            address: document.getElementById('newStoreAddress').value,
            coordinates: coords,
            type: 'Point'
        },
        phone: document.getElementById('newStorePhone').value,
        schedule: {
            open: document.getElementById('newStoreOpen').value,
            close: document.getElementById('newStoreClose').value
        },
        category: document.getElementById('newStoreCategory').value
    };
    
    formData.append('data', JSON.stringify(storeData));
    
    const images = document.getElementById('newStoreImages').files;
    for (let i = 0; i < Math.min(images.length, 5); i++) {
        formData.append('images', images[i]);
    }
    
    try {
        showToast('Creando tienda...', 0);
        
        const response = await fetch(`${API_URL}/stores`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (response.ok) {
            showToast('¡Tienda creada exitosamente! 🎉');
            document.getElementById('createStoreModal')?.remove();
            await loadMyStore();
            await loadDashboard();
        } else {
            const err = await response.json();
            showToast(err.message || 'Error al crear tienda');
        }
    } catch (error) {
        showToast('Error de conexión');
    }
}

function showAddProduct() {
    document.getElementById('addProductModal')?.classList.add('active');
}

function showAddVideo() {
    document.getElementById('addVideoModal')?.classList.add('active');
}

function showAddForumPost() {
    document.getElementById('addForumModal')?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

async function addProduct() {
    if (!storeData) {
        showToast('Primero debes registrar tu tienda en el mapa');
        showSection('store');
        return;
    }
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    const productData = {
        name: document.getElementById('prodName')?.value,
        description: document.getElementById('prodDesc')?.value,
        price: parseFloat(document.getElementById('prodPrice')?.value),
        stock: parseInt(document.getElementById('prodStock')?.value) || 0,
        category: document.getElementById('prodCategory')?.value,
        targetAudience: document.getElementById('prodAudience')?.value,
        sizes: document.getElementById('prodSizes')?.value.split(',').map(s => s.trim()).filter(s => s),
        colors: document.getElementById('prodColors')?.value.split(',').map(c => c.trim()).filter(c => c)
    };
    
    if (!productData.name || !productData.price || !productData.category) {
        showToast('Completa los campos obligatorios');
        return;
    }
    
    formData.append('data', JSON.stringify(productData));
    
    const images = document.getElementById('prodImages')?.files;
    if (images) {
        for (let i = 0; i < Math.min(images.length, 5); i++) {
            formData.append('images', images[i]);
        }
    }
    
    try {
        showToast('Guardando producto...', 0);
        
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        hideToast();
        
        if (response.ok) {
            closeModal('addProductModal');
            await loadProducts();
            showToast('Producto agregado exitosamente');
            // Limpiar formulario
            document.getElementById('prodName').value = '';
            document.getElementById('prodDesc').value = '';
            document.getElementById('prodPrice').value = '';
        } else {
            const err = await response.json();
            showToast(err.message || 'Error al agregar producto');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

async function addVideo() {
    if (!storeData) {
        showToast('Primero debes registrar tu tienda en el mapa');
        showSection('store');
        return;
    }
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    const videoFile = document.getElementById('videoFile')?.files[0];
    const caption = document.getElementById('videoCaption')?.value;
    const productId = document.getElementById('videoProduct')?.value;
    
    if (!videoFile) {
        showToast('Selecciona un video');
        return;
    }
    
    formData.append('video', videoFile);
    formData.append('caption', caption || '');
    if (productId) formData.append('productId', productId);
    
    try {
        showToast('Subiendo video...', 0);
        
        const response = await fetch(`${API_URL}/videos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        hideToast();
        
        if (response.ok) {
            closeModal('addVideoModal');
            await loadVideos();
            showToast('Video subido exitosamente');
            document.getElementById('videoFile').value = '';
            document.getElementById('videoCaption').value = '';
        } else {
            const err = await response.json();
            showToast(err.message || 'Error al subir video');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

async function saveStore() {
    if (!storeData) return;
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    const updates = {
        name: document.getElementById('storeName')?.value,
        description: document.getElementById('storeDesc')?.value,
        location: {
            address: document.getElementById('storeAddress')?.value,
            coordinates: _editStoreCoords
                ? [_editStoreCoords.lng, _editStoreCoords.lat]
                : storeData.location?.coordinates
        },
        phone: document.getElementById('storePhone')?.value,
        schedule: {
            open: document.getElementById('storeOpen')?.value,
            close: document.getElementById('storeClose')?.value
        }
    };
    
    formData.append('data', JSON.stringify(updates));
    
    const images = document.getElementById('storeImages')?.files;
    if (images?.length > 0) {
        for (let i = 0; i < Math.min(images.length, 5); i++) {
            formData.append('images', images[i]);
        }
    }
    
    try {
        showToast('Guardando...', 0);
        
        const response = await fetch(`${API_URL}/stores/${storeData._id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        hideToast();
        
        if (response.ok) {
            showToast('Tienda actualizada exitosamente');
            await loadMyStore();
        } else {
            showToast('Error al guardar');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Producto eliminado');
            await loadProducts();
        } else {
            showToast('Error al eliminar');
        }
    } catch (error) {
        showToast('Error de conexión');
    }
}

async function addForumPost() {
    const token = localStorage.getItem('token');
    
    const data = {
        type: document.getElementById('forumType')?.value,
        title: document.getElementById('forumTitle')?.value,
        content: document.getElementById('forumContent')?.value,
        price: document.getElementById('forumPrice')?.value || null,
        originalPrice: document.getElementById('forumOriginalPrice')?.value || null
    };
    
    if (!data.title || !data.content) {
        showToast('Completa los campos obligatorios');
        return;
    }
    
    try {
        showToast('Publicando...', 0);
        
        const response = await fetch(`${API_URL}/forum/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        hideToast();
        
        if (response.ok) {
            showToast('Publicación creada exitosamente');
            closeModal('addForumModal');
            await loadMyForumPosts();
        } else {
            showToast('Error al crear publicación');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

async function deleteForumPost(postId) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/forum/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        showToast('Publicación eliminada');
        loadMyForumPosts();
    } catch (error) {
        showToast('Error al eliminar');
    }
}

function toggleForumFields() {
    const type = document.getElementById('forumType')?.value;
    const offerFields = document.getElementById('offerFields');
    if (offerFields) {
        offerFields.style.display = type === 'offer' ? 'block' : 'none';
    }
}

function filterForum(type) {
    const posts = document.querySelectorAll('#myForumPosts .forum-post');
    posts.forEach(post => {
        post.style.display = (type === 'all' || post.dataset.type === type) ? 'block' : 'none';
    });
    
    document.querySelectorAll('.toggle-group .btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '';
    });
    if (event.target) {
        event.target.classList.add('active');
        event.target.style.background = 'var(--primary)';
        event.target.style.color = 'white';
    }
}

function showToast(message, duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #0A1628;
        color: white;
        padding: 16px 28px;
        border-radius: 50px;
        font-weight: 500;
        font-size: 14px;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    if (duration > 0) {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function hideToast() {
    const toast = document.querySelector('.toast');
    if (toast) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }
}

// Exponer funciones globales
window.showSection = showSection;
window.showCreateStoreModal = showCreateStoreModal;
window.createStore = createStore;
window.showAddProduct = showAddProduct;
window.showAddVideo = showAddVideo;
window.showAddForumPost = showAddForumPost;
window.closeModal = closeModal;
window.addProduct = addProduct;
window.addVideo = addVideo;
window.saveStore = saveStore;
window.deleteProduct = deleteProduct;
window.addForumPost = addForumPost;
window.deleteForumPost = deleteForumPost;
window.toggleForumFields = toggleForumFields;
window.filterForum = filterForum;
window.previewStoreImages = previewStoreImages;
window.useLocationForStore = useLocationForStore;
window.previewStoreImagesEdit = previewStoreImagesEdit;
window.useLocationForStoreEdit = useLocationForStoreEdit;

// Preview image on edit store form
function previewStoreImagesEdit(input) {
    const file = input.files[0];
    if (!file) return;
    const previewWrap = document.getElementById('storeImgPreviewNew');
    const previewImg = document.getElementById('storeImgPreviewNewImg');
    const noImg = document.getElementById('storeNoImg');
    const currentImg = document.getElementById('storeCurrentImg');
    if (!previewWrap || !previewImg) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewWrap.style.display = 'block';
        if (noImg) noImg.style.display = 'none';
        if (currentImg) currentImg.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Use GPS location for store edit
let _editStoreCoords = null;
function useLocationForStoreEdit() {
    if (!navigator.geolocation) {
        showToast('Tu navegador no soporta geolocalización');
        return;
    }
    showToast('Obteniendo ubicación...', 0);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            _editStoreCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            hideToast();
            showToast('✅ Ubicación capturada. Se actualizará el pin en el mapa al guardar.');
        },
        () => {
            hideToast();
            showToast('No se pudo obtener la ubicación. Verifica los permisos.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

document.addEventListener('DOMContentLoaded', checkAuth);