const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api'
let currentVideoIndex = 0;
let videos = [];

async function loadVideos() {
    const container = document.getElementById('videosContainer');
    const token = localStorage.getItem('token');
    const location = JSON.parse(localStorage.getItem('userLocation') || '{"lat":4.4447,"lng":-75.2424}');
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/videos/feed?lat=${location.lat}&lng=${location.lng}`, { headers });
        videos = await response.json();
        renderVideos();
    } catch (error) {
        console.error('Error cargando videos:', error);
    }
}

function renderVideos() {
    const container = document.getElementById('videosContainer');
    container.innerHTML = '';
    videos.forEach((video, index) => {
        const videoEl = document.createElement('div');
        videoEl.className = 'video-item';
        videoEl.innerHTML = `
            <video src="${video.url}" loop playsinline preload="metadata"
                   poster="${video.thumbnail || ''}"
                   onclick="togglePlay(this)"></video>
            <div class="video-overlay">
                <h3>@${video.storeId?.name || 'Tienda'}</h3>
                <p>${video.caption || ''}</p>
                ${video.productId ? `
                    <p style="margin-top:8px;color:var(--primary);">
                        <i class="fas fa-tag"></i> ${video.productId.name} - $${video.productId.price?.toLocaleString()}
                    </p>` : ''}
            </div>
            <div class="video-actions">
                <button class="video-action-btn" onclick="likeVideo('${video._id}', this)">
                    <i class="fas fa-heart"></i>
                    <span>${video.likes || 0}</span>
                </button>
                <button class="video-action-btn" onclick="showComments('${video._id}')">
                    <i class="fas fa-comment"></i>
                    <span>${video.comments?.length || 0}</span>
                </button>
                <button class="video-action-btn" onclick="shareVideo('${video._id}')">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                </button>
                <button class="video-action-btn" onclick="goToStore('${video.storeId?._id}')">
                    <i class="fas fa-store"></i>
                    <span>Tienda</span>
                </button>
            </div>
        `;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const vid = entry.target.querySelector('video');
                if (entry.isIntersecting) { vid.play(); currentVideoIndex = index; }
                else { vid.pause(); }
            });
        }, { threshold: 0.6 });
        observer.observe(videoEl);
        container.appendChild(videoEl);
    });
}

function togglePlay(video) {
    if (video.paused) video.play(); else video.pause();
}

async function likeVideo(videoId, btn) {
    const token = localStorage.getItem('token');
    if (!token) { showToast('Inicia sesión para dar like'); return; }
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const span = btn.querySelector('span');
            span.textContent = parseInt(span.textContent) + 1;
            btn.style.color = 'var(--primary)';
        }
    } catch (error) { console.error('Error:', error); }
}

// ── Renderiza comentarios con respuestas ───────────────────────────────────────
function renderCommentList(comments) {
    if (!comments?.length) {
        return '<p style="color:#666;text-align:center;padding:24px;">No hay comentarios aún</p>';
    }
    return comments.map(c => {
        const userName  = c.userId?.displayName || 'Usuario';
        const userPhoto = c.userId?.photoURL    || 'https://via.placeholder.com/36';
        const dateStr   = c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CO', { day:'2-digit', month:'short' }) : '';

        const repliesHtml = (c.replies || []).map(r => {
            const rName  = r.userId?.displayName || 'Usuario';
            const rPhoto = r.userId?.photoURL    || 'https://via.placeholder.com/28';
            return `
                <div style="display:flex;gap:8px;margin-top:8px;padding-left:16px;border-left:2px solid #333;">
                    <img src="${rPhoto}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                    <div>
                        <span style="font-weight:bold;color:#ddd;font-size:13px;">${rName}</span>
                        <span style="color:#aaa;font-size:13px;margin-left:8px;">${r.text}</span>
                    </div>
                </div>`;
        }).join('');

        return `
            <div style="margin-bottom:18px;" id="comment-${c._id}">
                <div style="display:flex;gap:10px;align-items:flex-start;">
                    <img src="${userPhoto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-weight:bold;color:white;font-size:14px;">${userName}</span>
                            <span style="color:#555;font-size:11px;">${dateStr}</span>
                        </div>
                        <div style="color:#ccc;font-size:14px;margin-top:2px;">${c.text}</div>
                        <button onclick="toggleReplyInput('${c._id}')"
                            style="background:none;border:none;color:#888;font-size:12px;cursor:pointer;margin-top:4px;padding:0;">
                            Responder
                        </button>
                        <div id="replyBox-${c._id}" style="display:none;margin-top:8px;gap:8px;">
                            <div style="display:flex;gap:8px;">
                                <input type="text" id="replyInput-${c._id}"
                                    placeholder="Escribe una respuesta..."
                                    style="flex:1;padding:8px 12px;border-radius:16px;border:none;background:#333;color:white;font-size:13px;"
                                    onkeydown="if(event.key==='Enter') postReply('${c._id}')">
                                <button onclick="postReply('${c._id}')"
                                    style="background:var(--primary);color:white;border:none;padding:8px 14px;border-radius:16px;cursor:pointer;font-size:13px;">↑</button>
                            </div>
                        </div>
                        ${repliesHtml}
                    </div>
                </div>
            </div>`;
    }).join('');
}

let activeVideoId = null;

function showComments(videoId) {
    activeVideoId = videoId;
    const video = videos.find(v => v._id === videoId);
    if (!video) return;
    document.querySelector('.comments-modal')?.remove();

    const modal = document.createElement('div');
    modal.className = 'modal active comments-modal';
    modal.style.background = 'rgba(0,0,0,0.9)';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;max-height:75vh;display:flex;flex-direction:column;">
            <div style="padding:16px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">Comentarios <span style="color:#888;font-size:14px;font-weight:normal;">(${video.comments?.length || 0})</span></h3>
                <button onclick="this.closest('.comments-modal').remove()"
                    style="background:none;border:none;color:white;font-size:24px;cursor:pointer;">&times;</button>
            </div>
            <div id="commentsList" style="flex:1;overflow-y:auto;padding:16px;">
                ${renderCommentList(video.comments)}
            </div>
            <div style="padding:16px;border-top:1px solid #333;display:flex;gap:10px;align-items:center;">
                <input type="text" id="commentInput" placeholder="Agregar comentario..."
                    style="flex:1;padding:12px 16px;border-radius:20px;border:none;background:#333;color:white;"
                    onkeydown="if(event.key==='Enter') postComment('${videoId}')">
                <button onclick="postComment('${videoId}')"
                    style="background:var(--primary);color:white;border:none;padding:12px 20px;border-radius:20px;cursor:pointer;">
                    Enviar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function toggleReplyInput(commentId) {
    const box = document.getElementById(`replyBox-${commentId}`);
    if (!box) return;
    const visible = box.style.display === 'flex';
    box.style.display = visible ? 'none' : 'flex';
    if (!visible) document.getElementById(`replyInput-${commentId}`)?.focus();
}

async function postReply(commentId) {
    const token = localStorage.getItem('token');
    if (!token) { showToast('Inicia sesión para responder'); return; }
    const input = document.getElementById(`replyInput-${commentId}`);
    const text = input?.value.trim();
    if (!text || !activeVideoId) return;

    try {
        const response = await fetch(`${API_URL}/videos/${activeVideoId}/comment/${commentId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            const updatedComments = await response.json();
            const idx = videos.findIndex(v => v._id === activeVideoId);
            if (idx !== -1) videos[idx].comments = updatedComments;
            const commentsList = document.getElementById('commentsList');
            if (commentsList) commentsList.innerHTML = renderCommentList(updatedComments);
            input.value = '';
            showToast('Respuesta publicada');
        } else {
            showToast('Error al publicar respuesta');
        }
    } catch (error) { console.error('Error:', error); showToast('Error de conexión'); }
}

async function postComment(videoId) {
    const token = localStorage.getItem('token');
    if (!token) { showToast('Inicia sesión para comentar'); return; }
    const input = document.getElementById('commentInput');
    const text = input?.value.trim();
    if (!text) return;

    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            const updatedComments = await response.json();
            const idx = videos.findIndex(v => v._id === videoId);
            if (idx !== -1) videos[idx].comments = updatedComments;
            const commentsList = document.getElementById('commentsList');
            if (commentsList) commentsList.innerHTML = renderCommentList(updatedComments);
            input.value = '';
            // Actualizar contador en botón
            const countSpan = document.querySelectorAll('.video-item')[idx]
                ?.querySelectorAll('.video-action-btn span')[1];
            if (countSpan) countSpan.textContent = updatedComments.length;
            showToast('Comentario publicado');
        } else {
            showToast('Error al publicar comentario');
        }
    } catch (error) { console.error('Error:', error); showToast('Error de conexión'); }
}

function shareVideo(videoId) {
    if (navigator.share) {
        navigator.share({ title: 'Mira este video en Storemaps', url: window.location.href + '?video=' + videoId });
    } else {
        navigator.clipboard.writeText(window.location.href + '?video=' + videoId);
        showToast('Enlace copiado');
    }
}

function goToStore(storeId) {
    if (storeId) window.location.href = `index.html?store=${storeId}`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.bottom = '120px';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

document.addEventListener('keydown', (e) => {
    const container = document.getElementById('videosContainer');
    if (e.key === 'ArrowDown') {
        currentVideoIndex = Math.min(currentVideoIndex + 1, videos.length - 1);
        container.children[currentVideoIndex]?.scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
        currentVideoIndex = Math.max(currentVideoIndex - 1, 0);
        container.children[currentVideoIndex]?.scrollIntoView({ behavior: 'smooth' });
    }
});

document.addEventListener('DOMContentLoaded', loadVideos);
