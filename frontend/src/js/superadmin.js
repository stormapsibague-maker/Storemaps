// src/js/superadmin.js - CORREGIDO
const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';

// ... (todo igual hasta loadDashboard)

async function loadDashboard() {
    const token = localStorage.getItem('token');
    
    try {
        showToast('Cargando estadísticas...', 0);
        
        // ✅ CORREGIDO: Endpoints correctos según tu backend
        const [storesRes, productsRes, usersRes, reportsRes] = await Promise.all([
            fetch(`${API_URL}/stores/admin/all`, {  // ← /stores/admin/all
                headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => null),
            
            fetch(`${API_URL}/products/admin/count`, {  // ← /products/admin/count
                headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => null),
            
            fetch(`${API_URL}/auth/users`, { 
                headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => null),
            
            fetch(`${API_URL}/reports/pending/count`, { 
                headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => null)
        ]);

        // ... resto igual
        
    } catch (error) {
        // ... igual
    }
}

// ... (en loadStores)

async function loadStores() {
    const token = localStorage.getItem('token');
    
    try {
        showToast('Cargando tiendas...', 0);
        
        // ✅ CORREGIDO: Endpoint correcto
        const response = await fetch(`${API_URL}/stores/admin/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // ... resto igual
        
    } catch (error) {
        // ... igual
    }
}

// ... (en loadFlaggedProducts)

async function loadFlaggedProducts() {
    const token = localStorage.getItem('token');
    
    try {
        showToast('Cargando productos...', 0);
        
        // ✅ CORREGIDO: Endpoint correcto
        const response = await fetch(`${API_URL}/products/admin/flagged`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // ... resto igual
        
    } catch (error) {
        // ... igual
    }
}

// ... (en loadFlaggedVideos)

async function loadFlaggedVideos() {
    const token = localStorage.getItem('token');
    
    try {
        showToast('Cargando videos...', 0);
        
        // ✅ CORREGIDO: Endpoint correcto
        const response = await fetch(`${API_URL}/videos/admin/flagged`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // ... resto igual
        
    } catch (error) {
        // ... igual
    }
}

// ... resto del archivo igual
// ==========================================
// VIDEOS: TABS
// ==========================================
function showVideoTab(tab) {
  document.getElementById('videoTabVideos').style.display = tab === 'videos' ? 'block' : 'none';
  document.getElementById('videoTabComments').style.display = tab === 'comments' ? 'block' : 'none';
  document.getElementById('tabVideosBtn').className = tab === 'videos' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('tabCommentsBtn').className = tab === 'comments' ? 'btn btn-primary' : 'btn btn-secondary';
  if (tab === 'comments') loadAllVideoComments();
}

// ==========================================
// COMENTARIOS DE VIDEOS
// ==========================================
let allCommentsData = [];

async function loadAllVideoComments() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('allCommentsList');
  container.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Cargando comentarios...</p>';

  try {
    // Traer todos los videos primero
    const res = await fetch(`${API_URL}/videos/feed?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error cargando videos');
    const data = await res.json();
    const videos = data.videos || data || [];

    // Aplanar todos los comentarios con referencia al video
    allCommentsData = [];
    videos.forEach(v => {
      (v.comments || []).forEach(c => {
        allCommentsData.push({
          videoId: v._id,
          videoTitle: v.title || 'Sin título',
          videoThumb: v.thumbnailUrl || v.videoUrl,
          commentId: c._id,
          text: c.text,
          userId: c.userId,
          createdAt: c.createdAt
        });
      });
    });

    renderComments(allCommentsData);
  } catch(e) {
    container.innerHTML = `<p style="color:#ef4444;text-align:center;padding:40px;">Error: ${e.message}</p>`;
  }
}

function renderComments(comments) {
  const container = document.getElementById('allCommentsList');
  if (!comments.length) {
    container.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:40px;">No hay comentarios.</p>';
    return;
  }

  container.innerHTML = comments.map(c => `
    <div id="comment-row-${c.commentId}" style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex;gap:14px;align-items:flex-start;">
      <i class="fas fa-comment" style="color:#16a34a;margin-top:4px;font-size:18px;flex-shrink:0;"></i>
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">
          Video: <b style="color:#374151;">${c.videoTitle}</b>
          ${c.createdAt ? ' · ' + new Date(c.createdAt).toLocaleDateString('es-CO') : ''}
        </div>
        <div id="comment-text-${c.commentId}" style="font-size:14px;color:#374151;word-break:break-word;">${c.text}</div>
        <input id="comment-edit-${c.commentId}" type="text" value="${c.text.replace(/"/g,'&quot;')}"
          style="display:none;width:100%;padding:8px 10px;border:1.5px solid #16a34a;border-radius:8px;font-size:14px;margin-top:6px;outline:none;">
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button onclick="startEditComment('${c.videoId}','${c.commentId}')" 
          id="btn-edit-${c.commentId}"
          style="padding:6px 12px;background:#f0fdf4;color:#16a34a;border:1.5px solid #16a34a;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          <i class="fas fa-pen"></i>
        </button>
        <button onclick="saveEditComment('${c.videoId}','${c.commentId}')"
          id="btn-save-${c.commentId}"
          style="display:none;padding:6px 12px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          <i class="fas fa-check"></i> Guardar
        </button>
        <button onclick="deleteVideoComment('${c.videoId}','${c.commentId}')"
          style="padding:6px 12px;background:#fee2e2;color:#ef4444;border:1.5px solid #ef4444;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function filterComments(query) {
  const q = query.toLowerCase();
  const filtered = allCommentsData.filter(c =>
    c.text.toLowerCase().includes(q) ||
    c.videoTitle.toLowerCase().includes(q)
  );
  renderComments(filtered);
}

function startEditComment(videoId, commentId) {
  document.getElementById(`comment-text-${commentId}`).style.display = 'none';
  document.getElementById(`comment-edit-${commentId}`).style.display = 'block';
  document.getElementById(`btn-edit-${commentId}`).style.display = 'none';
  document.getElementById(`btn-save-${commentId}`).style.display = 'inline-flex';
  document.getElementById(`comment-edit-${commentId}`).focus();
}

async function saveEditComment(videoId, commentId) {
  const token = localStorage.getItem('token');
  const newText = document.getElementById(`comment-edit-${commentId}`).value.trim();
  if (!newText) return;

  try {
    const res = await fetch(`${API_URL}/videos/${videoId}/comment/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: newText })
    });
    if (!res.ok) throw new Error('Error al guardar');

    // Actualizar en cache
    const c = allCommentsData.find(x => x.commentId === commentId);
    if (c) c.text = newText;

    document.getElementById(`comment-text-${commentId}`).textContent = newText;
    document.getElementById(`comment-text-${commentId}`).style.display = 'block';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'none';
    document.getElementById(`btn-edit-${commentId}`).style.display = 'inline-flex';
    document.getElementById(`btn-save-${commentId}`).style.display = 'none';
    showToast('Comentario actualizado ✅', 2000);
  } catch(e) {
    showToast('Error al guardar: ' + e.message, 3000);
  }
}

async function deleteVideoComment(videoId, commentId) {
  if (!confirm('¿Eliminar este comentario?')) return;
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/videos/${videoId}/comment/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al eliminar');

    // Quitar del DOM y cache
    document.getElementById(`comment-row-${commentId}`)?.remove();
    allCommentsData = allCommentsData.filter(c => c.commentId !== commentId);
    showToast('Comentario eliminado 🗑️', 2000);
  } catch(e) {
    showToast('Error: ' + e.message, 3000);
  }
}
// ==========================================
// EXPONER FUNCIONES GLOBALES
// ==========================================
window.showVideoTab = showVideoTab;
window.loadAllVideoComments = loadAllVideoComments;
window.filterComments = filterComments;
window.startEditComment = startEditComment;
window.saveEditComment = saveEditComment;
window.deleteVideoComment = deleteVideoComment;
window.renderComments = renderComments;
