const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';
const GOOGLE_CLIENT_ID = window.CONFIG?.GOOGLE_CLIENT_ID || '513136442281-k5gkpcs0anmi980ff00rb7cmsvj95aka.apps.googleusercontent.com';

let currentUser = null;
let userType = null;
let currentLoginType = 'user';
let currentRegisterType = 'user';

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkRedirectParams();
    setTimeout(loadProfile, 100);
});

function checkRedirectParams() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    const action = params.get('action');
    
    if (redirect && action) {
        sessionStorage.setItem('postLoginRedirect', JSON.stringify({ redirect, action }));
    }
    
    const tab = params.get('tab');
    const type = params.get('type');
    if (tab === 'register' && type === 'company') {
        setTimeout(() => {
            switchTab('register');
            setRegisterType('company');
        }, 200);
    }
}

// ==========================================
// GOOGLE SIGN-IN
// ==========================================

function initializeGoogle() {
    if (!window.google || !google.accounts) {
        setTimeout(initializeGoogle, 300);
        return;
    }
    
    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin'
        });
        
        renderGoogleButtons();
        console.log('✅ Google Sign-In listo');
    } catch (error) {
        console.error('Error Google:', error);
    }
}

function renderGoogleButtons() {
    const signInDiv = document.getElementById('googleSignInDiv');
    const signUpDiv = document.getElementById('googleSignUpDiv');
    
    const config = {
        theme: 'outline',
        size: 'large',
        width: '100%',
        shape: 'pill',
        locale: 'es',
        logo_alignment: 'center',
        text: 'continue_with'
    };
    
    if (signInDiv) {
        google.accounts.id.renderButton(signInDiv, { ...config, text: 'signin_with' });
    }
    
    if (signUpDiv) {
        google.accounts.id.renderButton(signUpDiv, { ...config, text: 'signup_with' });
    }
}

function handleGoogleResponse(response) {
    try {
        const payload = parseJwt(response.credential);
        
        const userData = {
            email: payload.email,
            displayName: payload.name,
            googleId: payload.sub,
            photoURL: payload.picture,
            password: null
        };
        
        // ✅ FIX: register/user ahora maneja upsert (login si ya existe, crear si no)
        googleAuthAPI(userData);
    } catch (error) {
        console.error('Error Google:', error);
        showToast('Error con Google Sign In');
    }
}

async function googleAuthAPI(userData) {
    try {
        showToast('Iniciando con Google...', 0);
        
        const response = await fetch(`${API_URL}/auth/register/user`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        hideToast();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', 'user');
            if (data.user) localStorage.setItem('userData', JSON.stringify(data.user));
            
            await syncFavoritesToCloud();
            
            const redirect = sessionStorage.getItem('postLoginRedirect');
            if (redirect) {
                const { redirect: page, action } = JSON.parse(redirect);
                sessionStorage.removeItem('postLoginRedirect');
                window.location.href = `${page}.html?action=${action}`;
                return;
            }
            
            showToast('¡Bienvenido! 🎉');
            setTimeout(() => window.location.href = 'index.html', 800);
        } else {
            showToast(data.message || 'Error al iniciar sesión con Google');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// ==========================================
// UI Y TABS
// ==========================================

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    
    if (!loginForm) return;
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm?.classList.remove('active');
        tabLogin?.classList.add('active');
        tabRegister?.classList.remove('active');
        setTimeout(initializeGoogle, 100);
    } else {
        loginForm.classList.remove('active');
        registerForm?.classList.add('active');
        tabLogin?.classList.remove('active');
        tabRegister?.classList.add('active');
        setTimeout(initializeGoogle, 100);
    }
}

function setLoginType(type) {
    currentLoginType = type;
    const input = document.getElementById('loginType');
    if (input) input.value = type;
    
    updateToggleButtons('login', type);
    toggleFields('userLoginFields', 'companyLoginFields', type === 'user');
}

function setRegisterType(type) {
    currentRegisterType = type;
    const input = document.getElementById('registerType');
    if (input) input.value = type;
    
    updateToggleButtons('register', type);
    toggleFields('userRegisterFields', 'companyRegisterFields', type === 'user');
}

function updateToggleButtons(prefix, activeType) {
    const btnUser = document.getElementById(`${prefix}TypeUser`);
    const btnCompany = document.getElementById(`${prefix}TypeCompany`);
    
    const active = { background: 'var(--primary)', color: 'white' };
    const inactive = { background: '', color: '' };
    
    if (btnUser) Object.assign(btnUser.style, activeType === 'user' ? active : inactive);
    if (btnCompany) Object.assign(btnCompany.style, activeType === 'company' ? active : inactive);
}

function toggleFields(userId, companyId, showUser) {
    const userFields = document.getElementById(userId);
    const companyFields = document.getElementById(companyId);
    
    if (userFields) userFields.style.display = showUser ? 'block' : 'none';
    if (companyFields) companyFields.style.display = showUser ? 'none' : 'block';
}

// ==========================================
// LOGIN (con handleLoginSuccess incluido) ✅
// ==========================================

async function login() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const type = currentLoginType;
    
    if (!email || !password) {
        showToast('Completa todos los campos');
        return;
    }
    
    const endpoint = type === 'user' ? 'login/user' : 'login/company';
    
    try {
        showToast('Iniciando sesión...', 0);
        
        const response = await fetch(`${API_URL}/auth/${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        hideToast();
        
        if (response.ok) {
            // ✅ HANDLE LOGIN SUCCESS INLINED (no función separada)
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', type === 'user' ? 'user' : (data.userType || 'company'));
            
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            if (data.company) {
                localStorage.setItem('userData', JSON.stringify(data.company));
            }
            
            // Sincronizar favoritos
            await syncFavoritesToCloud();
            
            // Redirección post-login
            const redirect = sessionStorage.getItem('postLoginRedirect');
            if (redirect) {
                const { redirect: page, action } = JSON.parse(redirect);
                sessionStorage.removeItem('postLoginRedirect');
                window.location.href = `${page}.html?action=${action}`;
                return;
            }
            
            showToast('¡Bienvenido! 🎉');
            setTimeout(() => {
                window.location.href = type === 'user' ? 'index.html' : 'admin.html';
            }, 800);
        } else {
            showToast(data.message || 'Credenciales incorrectas');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión. Verifica tu internet.');
    }
}

// ==========================================
// REGISTRO
// ==========================================

async function register() {
    const type = currentRegisterType;
    
    if (type === 'user') {
        await registerUserForm();
    } else {
        await registerCompanyForm();
    }
}

async function registerUserForm() {
    const data = {
        email: getValue('regEmail'),
        password: getValue('regPassword'),
        displayName: getValue('regName')
    };
    
    if (!validateUserRegistration(data)) return;
    await registerUserAPI(data);
}

async function registerCompanyForm() {
    const data = {
        email: getValue('compEmail'),
        password: getValue('compPassword'),
        companyName: getValue('compName'),
        nit: getValue('compNit'),
        legalRep: getValue('compLegal'),
        phone: getValue('compPhone'),
        address: getValue('compAddress')
    };
    
    if (!validateCompanyRegistration(data)) return;
    await registerCompanyAPI(data);
}

function getValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

function validateUserRegistration(data) {
    const required = ['email', 'password', 'displayName'];
    const missing = required.filter(f => !data[f]);
    
    if (missing.length > 0) {
        showToast(`Faltan: ${missing.join(', ')}`);
        return false;
    }
    
    if (data.password.length < 6) {
        showToast('Contraseña: mínimo 6 caracteres');
        return false;
    }
    
    return true;
}

function validateCompanyRegistration(data) {
    const required = ['email', 'password', 'companyName', 'legalRep', 'phone', 'address'];
    const missing = required.filter(f => !data[f]);
    
    if (missing.length > 0) {
        showToast(`Obligatorios: ${missing.join(', ')}`);
        return false;
    }
    
    if (data.password.length < 6) {
        showToast('Contraseña: mínimo 6 caracteres');
        return false;
    }
    
    return true;
}

async function registerUserAPI(userData) {
    try {
        showToast('Creando cuenta...', 0);
        
        const response = await fetch(`${API_URL}/auth/register/user`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        hideToast();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', 'user');
            if (data.user) localStorage.setItem('userData', JSON.stringify(data.user));
            showToast('¡Cuenta creada! 🎉');
            setTimeout(() => window.location.href = 'index.html', 800);
        } else {
            showToast(data.message || 'Error al registrarse');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

async function registerCompanyAPI(companyData) {
    try {
        showToast('Registrando tienda...', 0);
        
        const response = await fetch(`${API_URL}/auth/register/company`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        
        const data = await response.json();
        hideToast();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', 'company');
            if (data.company) localStorage.setItem('userData', JSON.stringify(data.company));
            showToast('¡Tienda registrada! 🚀');
            setTimeout(() => window.location.href = 'admin.html', 800);
        } else {
            showToast(data.message || 'Error al registrar');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

// ==========================================
// PERFIL Y SESIÓN
// ==========================================

async function loadProfile() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showAuthSection();
        setTimeout(() => {
            switchTab('login');
            setLoginType('user');
            setRegisterType('user');
            initializeGoogle();
        }, 100);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            userType = data.type;
            
            localStorage.setItem('userType', userType);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
            await loadFavoritesFromCloud();
            
            showProfileSection();
            updateProfileUI();
        } else {
            throw new Error('Token inválido');
        }
    } catch (error) {
        handleProfileError();
    }
}

function handleProfileError() {
    const cached = localStorage.getItem('userData');
    if (cached) {
        currentUser = JSON.parse(cached);
        userType = localStorage.getItem('userType');
        showProfileSection();
        updateProfileUI();
        showToast('Modo offline - datos guardados');
    } else {
        logout();
    }
}

function showAuthSection() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    
    if (authSection) authSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'none';
}

function showProfileSection() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    
    if (authSection) authSection.style.display = 'none';
    if (profileSection) profileSection.style.display = 'block';
}

function updateProfileUI() {
    if (!currentUser) return;
    
    const displayName = currentUser.displayName || currentUser.companyName || 'Usuario';
    const email = currentUser.email || '';
    const photo = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=120&background=0066FF&color=fff`;
    
    const elements = {
        image: document.getElementById('profileImage'),
        name: document.getElementById('profileName'),
        email: document.getElementById('profileEmail'),
        adminLink: document.getElementById('companyAdminLink')
    };
    
    if (elements.image) elements.image.src = photo;
    if (elements.name) elements.name.textContent = displayName;
    if (elements.email) elements.email.textContent = email;
    if (elements.adminLink) {
        elements.adminLink.style.display = userType === 'company' ? 'block' : 'none';
    }
}

// ==========================================
// EDITAR PERFIL
// ==========================================

function editProfile() {
    if (!currentUser) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editProfileModal';
    
    const isCompany = userType === 'company';
    const photo = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.companyName)}&size=100&background=0066FF&color=fff`;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0;">Editar Perfil</h2>
                <button onclick="closeEditModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <form id="editProfileForm" onsubmit="saveProfile(event)">
                <div style="text-align: center; margin-bottom: 24px;">
                    <img id="editProfilePreview" src="${photo}" 
                         style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 12px;">
                    <div>
                        <label style="display: inline-block; padding: 8px 16px; background: var(--primary); color: white; border-radius: 20px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-camera"></i> Cambiar foto
                            <input type="file" id="profilePhotoInput" accept="image/*" style="display: none;" onchange="previewPhoto(this)">
                        </label>
                    </div>
                </div>
                
                ${isCompany ? `
                    <div class="form-group">
                        <label class="form-label">Nombre de la tienda *</label>
                        <input type="text" id="editCompanyName" class="form-input" value="${currentUser.companyName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono *</label>
                        <input type="tel" id="editPhone" class="form-input" value="${currentUser.phone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dirección *</label>
                        <input type="text" id="editAddress" class="form-input" value="${currentUser.address || ''}" required>
                    </div>
                ` : `
                    <div class="form-group">
                        <label class="form-label">Nombre completo *</label>
                        <input type="text" id="editDisplayName" class="form-input" value="${currentUser.displayName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="tel" id="editPhone" class="form-input" value="${currentUser.phone || ''}">
                    </div>
                `}
                
                <div class="form-group">
                    <label class="form-label">Correo electrónico</label>
                    <input type="email" class="form-input" value="${currentUser.email}" disabled style="background: #f3f4f6;">
                    <small style="color: var(--gray-500);">El email no se puede cambiar</small>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeEditModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Guardar cambios
                    </button>
                </div>
            </form>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid var(--gray-200);">
            
            <h3 style="font-size: 16px; margin-bottom: 16px; color: var(--danger);">Zona peligrosa</h3>
            <button type="button" class="btn btn-danger" style="width: 100%; margin-bottom: 12px;" onclick="changePassword()">
                <i class="fas fa-lock"></i> Cambiar contraseña
            </button>
            <button type="button" class="btn btn-danger" style="width: 100%; background: #7f1d1d;" onclick="deleteAccount()">
                <i class="fas fa-trash"></i> Eliminar cuenta
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editProfilePreview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.remove();
}

async function saveProfile(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const isCompany = userType === 'company';
    
    const updates = {
        phone: document.getElementById('editPhone')?.value
    };
    
    if (isCompany) {
        updates.companyName = document.getElementById('editCompanyName')?.value;
        updates.address = document.getElementById('editAddress')?.value;
    } else {
        updates.displayName = document.getElementById('editDisplayName')?.value;
    }
    
    const photoInput = document.getElementById('profilePhotoInput');
    if (photoInput?.files?.[0]) {
        try {
            const formData = new FormData();
            formData.append('image', photoInput.files[0]);
            
            const uploadRes = await fetch(`${API_URL}/upload/profile-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (uploadRes.ok) {
                const { url } = await uploadRes.json();
                updates.photoURL = url;
            }
        } catch (e) {
            console.log('Error subiendo foto:', e);
        }
    }
    
    try {
        showToast('Guardando...', 0);
        
        const endpoint = isCompany ? 'auth/company/profile' : 'auth/user/profile';
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        
        hideToast();
        
        if (response.ok) {
            Object.assign(currentUser, updates);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            closeEditModal();
            updateProfileUI();
            showToast('Perfil actualizado ✅');
        } else {
            showToast('Error al guardar');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

function changePassword() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3 style="margin-bottom: 20px;">Cambiar contraseña</h3>
            <div class="form-group">
                <label class="form-label">Contraseña actual</label>
                <input type="password" id="currentPassword" class="form-input" placeholder="••••••">
            </div>
            <div class="form-group">
                <label class="form-label">Nueva contraseña (mínimo 6 caracteres)</label>
                <input type="password" id="newPassword" class="form-input" placeholder="••••••">
            </div>
            <div class="form-group">
                <label class="form-label">Confirmar nueva contraseña</label>
                <input type="password" id="confirmPassword" class="form-input" placeholder="••••••">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="flex: 1;">Cancelar</button>
                <button onclick="submitPasswordChange()" class="btn btn-primary" style="flex: 1;">Cambiar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitPasswordChange() {
    const current = document.getElementById('currentPassword')?.value;
    const newPass = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    
    if (!current || !newPass || !confirm) {
        showToast('Completa todos los campos');
        return;
    }
    
    if (newPass.length < 6) {
        showToast('Mínimo 6 caracteres');
        return;
    }
    
    if (newPass !== confirm) {
        showToast('Las contraseñas no coinciden');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        showToast('Cambiando...', 0);
        
        const response = await fetch(`${API_URL}/auth/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                currentPassword: current,
                password: newPass 
            })
        });
        
        hideToast();
        
        if (response.ok) {
            document.querySelector('.modal')?.remove();
            showToast('Contraseña actualizada 🔒');
        } else {
            const err = await response.json();
            showToast(err.message || 'Error al cambiar contraseña');
        }
    } catch (error) {
        hideToast();
        showToast('Error de conexión');
    }
}

function deleteAccount() {
    if (!confirm('¿ELIMINAR TU CUENTA PERMANENTEMENTE?\\n\\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    const confirmText = prompt('Escribe "ELIMINAR" para confirmar:');
    if (confirmText !== 'ELIMINAR') {
        showToast('Cancelado');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => {
        logout();
        showToast('Cuenta eliminada');
    }).catch(() => {
        showToast('Error al eliminar cuenta');
    });
}

// ==========================================
// FAVORITOS
// ==========================================

async function syncFavoritesToCloud() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const localFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (localFavs.length === 0) return;
    
    try {
        await fetch(`${API_URL}/auth/favorites/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productIds: localFavs })
        });
    } catch (e) {
        console.log('Error sincronizando:', e);
    }
}

async function loadFavoritesFromCloud() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const cloudFavs = await response.json();
            const favIds = cloudFavs.map(f => f._id.toString());
            const merged = [...new Set([...favIds])];
            localStorage.setItem('favorites', JSON.stringify(merged));
        }
    } catch (e) {
        console.log('Error cargando favoritos:', e);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function logout() {
    localStorage.clear();
    currentUser = null;
    userType = null;
    showToast('Sesión cerrada 👋');
    setTimeout(() => window.location.href = 'profile.html', 500);
}

function updateLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocalización no soportada');
        return;
    }
    
    showToast('Obteniendo ubicación...', 0);
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            localStorage.setItem('userLocation', JSON.stringify(location));
            hideToast();
            showToast('¡Ubicación actualizada! 📍');
        },
        (error) => {
            hideToast();
            const msgs = { 1: 'Permiso denegado', 2: 'No disponible', 3: 'Timeout' };
            showToast(msgs[error.code] || 'Error de ubicación');
        }
    );
}

let toastTimeout, currentToast;

function showToast(message, duration = 3000) {
    hideToast();
    
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
        max-width: 90%;
        text-align: center;
        pointer-events: none;
    `;
    
    document.body.appendChild(toast);
    currentToast = toast;
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    if (duration > 0) {
        toastTimeout = setTimeout(() => hideToast(), duration);
    }
}

function hideToast() {
    if (toastTimeout) clearTimeout(toastTimeout);
    if (currentToast?.parentNode) {
        currentToast.style.opacity = '0';
        setTimeout(() => {
            if (currentToast?.parentNode) currentToast.remove();
            currentToast = null;
        }, 300);
    }
}

// ==========================================
// EXPONER FUNCIONES GLOBALES ✅
// ==========================================

window.switchTab = switchTab;
window.setLoginType = setLoginType;
window.setRegisterType = setRegisterType;
window.login = login;
window.register = register;
window.logout = logout;
window.updateLocation = updateLocation;
window.editProfile = editProfile;
window.closeEditModal = closeEditModal;
window.saveProfile = saveProfile;
window.previewPhoto = previewPhoto;
window.changePassword = changePassword;
window.submitPasswordChange = submitPasswordChange;
window.deleteAccount = deleteAccount;
window.googleAuthAPI = googleAuthAPI;