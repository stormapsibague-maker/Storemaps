/* ============================================================
   STOREMAPS — API Client compartido v2
   ============================================================ */
const API_URL = window.API_URL || 'https://storemaps-api.onrender.com/api';
// ✅ FIX: Usar las mismas keys que auth.js para no duplicar sesiones
const TOKEN_KEY = 'token';
const USER_KEY  = 'userData';

function getToken()  { return localStorage.getItem(TOKEN_KEY); }
function getUser()   { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
function saveAuth(token, user) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function isLoggedIn(){ return !!getToken(); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error de servidor');
  return data;
}

const Auth = {
  async loginUser(email, password) {
    const data = await apiFetch('/auth/login/user', { method:'POST', body: JSON.stringify({email,password}) });
    saveAuth(data.token, {...data.user, type:'user'});
    return data;
  },
  async registerUser(email, password, displayName) {
    const data = await apiFetch('/auth/register/user', { method:'POST', body: JSON.stringify({email,password,displayName}) });
    saveAuth(data.token, {...data.user, type:'user'});
    return data;
  },
  async loginGoogle(googleId, email, displayName, photoURL) {
    // Intenta login, si no existe registra
    try {
      const data = await apiFetch('/auth/login/user', { method:'POST', body: JSON.stringify({email, googleId}) });
      saveAuth(data.token, {...data.user, type:'user'});
      return data;
    } catch(e) {
      const data = await apiFetch('/auth/register/user', { method:'POST', body: JSON.stringify({email, googleId, displayName, photoURL}) });
      saveAuth(data.token, {...data.user, type:'user'});
      return data;
    }
  },
  async loginCompany(email, password) {
    const data = await apiFetch('/auth/login/company', { method:'POST', body: JSON.stringify({email,password}) });
    saveAuth(data.token, {...data.company, type: data.userType || 'company'});
    return data;
  },
  async registerCompany(email, password, companyName, nit, legalRep, phone, address) {
    const data = await apiFetch('/auth/register/company', { method:'POST', body: JSON.stringify({email,password,companyName,nit,legalRep,phone,address}) });
    saveAuth(data.token, {...data.company, type:'company'});
    return data;
  },
  logout() { clearAuth(); }
};

const Forum = {
  async getPosts()              { return await apiFetch('/forum/posts'); },
  async createPost(title, content, category='general') {
    return await apiFetch('/forum/posts', { method:'POST', body: JSON.stringify({type:'question',title,content,category}) });
  },
  async likePost(id)            { return await apiFetch(`/forum/posts/${id}/like`, {method:'POST'}); },
  async commentPost(id, text)   { return await apiFetch(`/forum/posts/${id}/comment`, {method:'POST', body:JSON.stringify({text})}); },
  async deletePost(id)          { return await apiFetch(`/forum/posts/${id}`, {method:'DELETE'}); }
};

const Products = {
  async getAll(filters={}) {
    const params = new URLSearchParams(filters).toString();
    return await apiFetch('/products' + (params ? '?'+params : ''));
  },
  async getById(id)             { return await apiFetch(`/products/${id}`); },
  async delete(id)              { return await apiFetch(`/products/${id}`, {method:'DELETE'}); },
  async create(formData) {
    const res = await fetch(API_URL+'/products', {
      method:'POST', headers:{'Authorization':`Bearer ${getToken()}`}, body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message||'Error');
    return data;
  }
};

const Videos = {
  async getFeed()               { return await apiFetch('/videos/feed'); },
  async likeVideo(id)           { return await apiFetch(`/videos/${id}/like`, {method:'POST'}); },
  async commentVideo(id, text)  { return await apiFetch(`/videos/${id}/comment`, {method:'POST', body:JSON.stringify({text})}); }
};

const AdminAPI = {
  async getStats() {
    const [users, companies, products, videos] = await Promise.all([
      apiFetch('/auth/users/count'),
      apiFetch('/auth/companies/count'),
      apiFetch('/products/admin/count'),
      apiFetch('/videos/admin/count')
    ]);
    return { users, companies, products, videos };
  },
  async getUsers()              { return await apiFetch('/auth/users'); },
  async blockUser(id, blocked)  { return await apiFetch(`/auth/users/${id}/block`, {method:'PUT', body:JSON.stringify({blocked})}); },
  async deleteUser(id)          { return await apiFetch(`/auth/users/${id}`, {method:'DELETE'}); },
  async blockCompany(id, blocked){ return await apiFetch(`/auth/companies/${id}/block`, {method:'PUT', body:JSON.stringify({blocked})}); },
  async deleteCompany(id)       { return await apiFetch(`/auth/companies/${id}`, {method:'DELETE'}); },
  async getFlaggedProducts()    { return await apiFetch('/products/admin/flagged'); },
  async getFlaggedVideos()      { return await apiFetch('/videos/admin/flagged'); },
  async getFlaggedPosts()       { return await apiFetch('/forum/posts'); },
  async deleteProduct(id)       { return await apiFetch(`/products/admin/${id}`, {method:'DELETE'}); },
  async deleteVideo(id)         { return await apiFetch(`/videos/admin/${id}`, {method:'DELETE'}); },
  async deletePost(id)          { return await apiFetch(`/forum/posts/${id}`, {method:'DELETE'}); }
};

const Favorites = {
  KEY: 'storemaps_favorites',
  get()      { try { return JSON.parse(localStorage.getItem(this.KEY))||[]; } catch(e){ return []; } },
  save(favs) { localStorage.setItem(this.KEY, JSON.stringify(favs)); },
  has(id)    { return this.get().some(f=>(f.id||f._id)==id); },
  toggle(product) {
    let favs = this.get();
    const pid = product.id||product._id;
    if (this.has(pid)) { favs = favs.filter(f=>(f.id||f._id)!=pid); this.save(favs); return false; }
    else               { favs.push(product); this.save(favs); return true; }
  }
};

function showToast(msg) {
  let t = document.getElementById('appToast');
  if (!t) { t = document.createElement('div'); t.id='appToast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(0);background:#111827;color:white;padding:12px 24px;border-radius:30px;font-size:14px;font-weight:600;z-index:9998;transition:.3s;opacity:1;white-space:nowrap;pointer-events:none;';
  clearTimeout(t._t);
  t._t = setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(80px)'; }, 2800);
}

function timeAgo(d) {
  const s = (Date.now()-new Date(d))/1000;
  if (s<60) return 'hace un momento';
  if (s<3600) return `hace ${Math.floor(s/60)} min`;
  if (s<86400) return `hace ${Math.floor(s/3600)}h`;
  return `hace ${Math.floor(s/86400)} días`;
}

window.API_URL=API_URL; window.Auth=Auth; window.Forum=Forum;
window.Products=Products; window.Videos=Videos; window.AdminAPI=AdminAPI;
window.Favorites=Favorites; window.getToken=getToken; window.getUser=getUser;
window.isLoggedIn=isLoggedIn; window.showToast=showToast; window.timeAgo=timeAgo;
