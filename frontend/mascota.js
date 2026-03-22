/* ============================================================
   MASCOTA STOREMAPS — Axo el Ajolote
   Tutorial interactivo para cada página
   ============================================================ */

(function() {

  const page = location.pathname.split('/').pop() || 'index.html';

  const tutorials = {
    'index.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'Soy la mascota de Storemaps. ¡Voy a mostrarte cómo usar la app! Tócame cuando quieras ayuda.', icon: '🦎', highlight: null },
      { title: 'Barra de navegación', text: 'Aquí arriba puedes moverte entre las secciones: Mapa, Descubrir, Favoritos, Foro, Videos y Perfil.', icon: '🗺️', highlight: '.main-menu' },
      { title: 'Buscador', text: 'Escribe aquí el nombre de una tienda o producto para encontrarlo rápidamente en el mapa.', icon: '🔍', highlight: '.search-bar' },
      { title: 'El Mapa', text: 'Este mapa muestra todas las tiendas de Ibagué. Los pins de colores son cada negocio. ¡Toca uno para ver info!', icon: '📍', highlight: '#map' },
      { title: 'Mi ubicación', text: 'Toca "Mi ubicación" para centrar el mapa en donde estás y ver las tiendas más cercanas.', icon: '📡', highlight: '#btnMyLocationMap' },
      { title: 'Filtros del mapa', text: 'Usa estos botones para filtrar las tiendas por categoría: Calzado, Ropa, Comida, etc.', icon: '🎯', highlight: '.map-section .map-filter-btn' },
      { title: '¡Listo! 🎉', text: 'Ya conoces el Mapa. Explora las otras secciones o tócame si necesitas ayuda. ¡A comprar local!', icon: '🔥', highlight: null },
    ],
    'discover.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'Estás en Descubrir, donde encuentras todos los productos de las tiendas de Ibagué.', icon: '🦎', highlight: null },
      { title: 'Filtros por categoría', text: 'Toca cualquier categoría para ver solo esos productos.', icon: '🎯', highlight: '.filter-bar' },
      { title: 'Buscador', text: 'Escribe el nombre de un producto o tienda aquí para buscarlo directamente.', icon: '🔍', highlight: '#searchInput' },
      { title: 'Tarjetas de productos', text: 'Cada tarjeta muestra un producto. Toca la imagen para ver más detalles.', icon: '🛍️', highlight: '.pin-card' },
      { title: 'Botón de favorito ❤️', text: 'Toca el corazón en cualquier producto para guardarlo en Favoritos.', icon: '❤️', highlight: '.heart-btn' },
      { title: '¡Ya eres un experto! 🎉', text: 'Ahora sabes usar Descubrir. ¡Explora los productos y guarda tus favoritos!', icon: '🔥', highlight: null },
    ],
    'favorites.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'Aquí están todos los productos que guardaste con ❤️ en Descubrir.', icon: '🦎', highlight: null },
      { title: 'Tus favoritos', text: 'Cada tarjeta es un producto que marcaste como favorito.', icon: '❤️', highlight: '.fav-card' },
      { title: 'Quitar favorito', text: 'Toca la ✕ en la esquina de cualquier tarjeta para quitarlo de favoritos.', icon: '🗑️', highlight: '.remove-btn' },
      { title: '¡Listo! 🎉', text: 'Ve a Descubrir para agregar más productos a tus favoritos.', icon: '🔥', highlight: null },
    ],
    'videos.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'Estás en Videos, donde las tiendas muestran sus productos estilo TikTok.', icon: '🦎', highlight: null },
      { title: 'Desliza para navegar', text: 'Desliza hacia arriba o abajo para pasar al siguiente video.', icon: '👆', highlight: '.videos-scroll' },
      { title: 'Dar like ❤️', text: 'Toca el corazón para darle like al video.', icon: '❤️', highlight: '.action-btn' },
      { title: '¡Disfruta! 🎉', text: 'Mira videos de las tiendas locales de Ibagué y descubre sus mejores productos.', icon: '🔥', highlight: null },
    ],
    'profile.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'En Perfil puedes entrar como Usuario, Empresa o Super Admin según tu rol.', icon: '🦎', highlight: null },
      { title: 'Como Usuario', text: 'Inicia sesión con tu correo para ver tus favoritos y configuración personal.', icon: '👤', highlight: '.role-card.user' },
      { title: 'Como Empresa', text: 'Las tiendas ingresan aquí para agregar productos, videos y aparecer en el mapa.', icon: '🏪', highlight: '.role-card.empresa' },
      { title: 'Subir videos', text: 'En el panel empresa puedes subir videos con barra de progreso verde.', icon: '🎬', highlight: null },
      { title: 'Super Admin', text: 'El admin revisa y modera contenido del sistema.', icon: '🛡️', highlight: '.role-card.admin' },
      { title: '¡Listo! 🎉', text: 'Elige tu rol y empieza a usar Storemaps. ¡Tócame cuando necesites ayuda!', icon: '🔥', highlight: null },
    ],
    'forum.html': [
      { title: '¡Hola! Soy Axo 👋', text: 'Estás en el Foro, donde la comunidad comparte recomendaciones.', icon: '🦎', highlight: null },
      { title: 'Crear publicación', text: 'Escribe un título y tu pregunta o recomendación, luego toca "Publicar".', icon: '✏️', highlight: '.new-post' },
      { title: 'Ver publicaciones', text: 'Aquí aparecen todas las preguntas y recomendaciones de la comunidad.', icon: '💬', highlight: '#forumPosts' },
      { title: '¡Participa! 🎉', text: 'Comparte tus tiendas favoritas y ayuda a otros a descubrir el comercio local.', icon: '🔥', highlight: null },
    ],
  };

  const steps = tutorials[page] || tutorials['index.html'];
  let currentStep = 0;
  let isOpen = false;

  function clearHighlight() {
    document.querySelectorAll('.mascota-highlight').forEach(el => el.classList.remove('mascota-highlight'));
  }

  function highlightElement(selector) {
    clearHighlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('mascota-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showStep(idx) {
    const step = steps[idx];
    if (!step) return;
    document.getElementById('axo-step-icon').textContent = step.icon;
    document.getElementById('axo-step-title').textContent = step.title;
    document.getElementById('axo-step-text').textContent = step.text;
    document.querySelectorAll('.axo-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    const prevBtn = document.getElementById('axo-prev');
    const nextBtn = document.getElementById('axo-next');
    prevBtn.style.display = idx === 0 ? 'none' : 'flex';
    nextBtn.textContent = idx === steps.length - 1 ? '¡Listo! 🎉' : 'Siguiente →';
    highlightElement(step.highlight);
    // Cambiar expresión ojos
    const mouth = document.getElementById('axo-mouth');
    if (mouth) {
      if (idx === steps.length - 1) mouth.setAttribute('d','M88 148 Q100 158 112 148');
      else if (step.highlight) mouth.setAttribute('d','M90 146 Q100 154 110 146');
      else mouth.setAttribute('d','M91 147 Q100 155 109 147');
    }
  }

  function openTutorial() {
    isOpen = true; currentStep = 0;
    document.getElementById('axo-bubble').style.display = 'flex';
    document.getElementById('axo-mascot').classList.add('axo-open');
    showStep(0);
  }

  function closeTutorial() {
    isOpen = false;
    document.getElementById('axo-bubble').style.display = 'none';
    document.getElementById('axo-mascot').classList.remove('axo-open');
    clearHighlight();
  }

  function nextStep() {
    if (currentStep >= steps.length - 1) { closeTutorial(); return; }
    currentStep++; showStep(currentStep);
  }

  function prevStep() {
    if (currentStep <= 0) return;
    currentStep--; showStep(currentStep);
  }

  // ── CSS ──
  const style = document.createElement('style');
  style.textContent = `
    #axo-container {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
      font-family: 'Inter', sans-serif;
    }
    #axo-bubble {
      display: none; flex-direction: column; background: white;
      border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 2px #3b8ef8;
      width: 285px; overflow: hidden;
      animation: axoBubbleIn .3s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes axoBubbleIn {
      from { opacity:0; transform: scale(0.7) translateY(20px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }
    .axo-bubble-header {
      background: linear-gradient(135deg, #1d6ef5, #4fa8ff);
      padding: 14px 16px 10px; display: flex; align-items: center; justify-content: space-between;
    }
    .axo-step-icon { font-size: 22px; }
    .axo-step-title { font-size: 14px; font-weight: 700; color: white; flex: 1; margin-left: 8px; }
    .axo-close {
      background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%;
      width: 26px; height: 26px; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center; transition: .2s; flex-shrink: 0;
    }
    .axo-close:hover { background: rgba(255,255,255,0.4); }
    .axo-bubble-body { padding: 14px 16px; }
    #axo-step-text { font-size: 13px; color: #374151; line-height: 1.55; }
    .axo-dots { display:flex; gap:5px; justify-content:center; margin:10px 0 8px; }
    .axo-dot { width:7px; height:7px; border-radius:50%; background:#d1d5db; transition:.2s; cursor:pointer; }
    .axo-dot.active { background:#1d6ef5; transform:scale(1.3); }
    .axo-buttons { display:flex; gap:8px; padding:0 16px 14px; }
    #axo-prev {
      background:#f3f4f6; color:#374151; border:none; padding:8px 14px; border-radius:10px;
      font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:.2s;
    }
    #axo-prev:hover { background:#e5e7eb; }
    #axo-next {
      flex:1; background:linear-gradient(135deg,#1d6ef5,#4fa8ff); color:white; border:none;
      padding:8px 14px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; transition:.2s;
    }
    #axo-next:hover { opacity:.9; transform:scale(1.02); }
    #axo-mascot-wrap { position:relative; }
    #axo-mascot {
      width: 90px; height: 100px; cursor: pointer;
      filter: drop-shadow(0 6px 18px rgba(29,110,245,0.5));
      transition: transform .2s;
      animation: axoFloat 3s ease-in-out infinite;
      display: block;
    }
    #axo-mascot:hover { transform: scale(1.12); }
    #axo-mascot.axo-open { animation: axoBounce .4s ease; filter: drop-shadow(0 6px 22px rgba(29,110,245,0.85)); }
    @keyframes axoFloat {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes axoBounce {
      0%  { transform: scale(1); }
      35% { transform: scale(1.2) rotate(-5deg); }
      65% { transform: scale(0.95) rotate(3deg); }
      100%{ transform: scale(1); }
    }
    #axo-tooltip {
      position: absolute; bottom: 95px; right: 0;
      background: #1d6ef5; color: white; font-size: 12px; font-weight: 600;
      padding: 6px 12px; border-radius: 20px; white-space: nowrap; pointer-events: none;
      animation: axoTooltipPop 2.2s ease 1.2s forwards; opacity: 0;
      box-shadow: 0 4px 12px rgba(29,110,245,.4);
    }
    #axo-tooltip::after {
      content: ''; position: absolute; bottom: -6px; right: 22px;
      border: 6px solid transparent; border-top-color: #1d6ef5; border-bottom: none;
    }
    @keyframes axoTooltipPop {
      0%  { opacity:0; transform:translateY(6px); }
      15% { opacity:1; transform:translateY(0); }
      75% { opacity:1; }
      100%{ opacity:0; }
    }
    .mascota-highlight {
      outline: 3px solid #1d6ef5 !important; outline-offset: 4px !important;
      border-radius: 10px !important; box-shadow: 0 0 0 6px rgba(29,110,245,0.15) !important;
      transition: outline .3s, box-shadow .3s !important; position: relative; z-index: 100;
    }
    @media(max-width:480px) {
      #axo-container { bottom:16px; right:16px; }
      #axo-bubble { width:252px; }
      #axo-mascot { width:74px; height:82px; }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'axo-container';
  const dotsHTML = steps.map((_, i) => `<div class="axo-dot${i===0?' active':''}" onclick="axoGoTo(${i})"></div>`).join('');

  container.innerHTML = `
    <div id="axo-bubble">
      <div class="axo-bubble-header">
        <span class="axo-step-icon" id="axo-step-icon">🦎</span>
        <span class="axo-step-title" id="axo-step-title">¡Hola!</span>
        <button class="axo-close" onclick="axoClose()">✕</button>
      </div>
      <div class="axo-bubble-body">
        <p id="axo-step-text"></p>
        <div class="axo-dots">${dotsHTML}</div>
      </div>
      <div class="axo-buttons">
        <button id="axo-prev" onclick="axoPrev()">← Atrás</button>
        <button id="axo-next" onclick="axoNext()">Siguiente →</button>
      </div>
    </div>

    <div id="axo-mascot-wrap">
      <div id="axo-tooltip">¡Tócame para el tutorial! 👆</div>

      <svg id="axo-mascot" onclick="axoToggle()" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Gradientes cuerpo — azul claro a azul medio como la imagen -->
          <radialGradient id="gC" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stop-color="#7ed4ff"/>
            <stop offset="45%"  stop-color="#3a9ff0"/>
            <stop offset="100%" stop-color="#1560d4"/>
          </radialGradient>
          <!-- Gradiente más claro para zona central/barriga -->
          <radialGradient id="gB" cx="50%" cy="45%" r="52%">
            <stop offset="0%"   stop-color="#b8e8ff"/>
            <stop offset="100%" stop-color="#5ab8f8"/>
          </radialGradient>
          <!-- Gradiente oscuro para branquias/cola -->
          <radialGradient id="gD" cx="30%" cy="30%" r="70%">
            <stop offset="0%"   stop-color="#3a9ff0"/>
            <stop offset="100%" stop-color="#0a3aaa"/>
          </radialGradient>
          <!-- Gradiente cola -->
          <radialGradient id="gT" cx="20%" cy="20%" r="80%">
            <stop offset="0%"   stop-color="#4ab0f8"/>
            <stop offset="100%" stop-color="#0828a0"/>
          </radialGradient>
          <!-- Llama exterior -->
          <radialGradient id="gF1" cx="50%" cy="80%" r="65%">
            <stop offset="0%"   stop-color="#a0eeff"/>
            <stop offset="40%"  stop-color="#1890ff"/>
            <stop offset="100%" stop-color="#0040cc" stop-opacity="0"/>
          </radialGradient>
          <!-- Llama núcleo blanco -->
          <radialGradient id="gF2" cx="50%" cy="85%" r="55%">
            <stop offset="0%"   stop-color="#ffffff"/>
            <stop offset="35%"  stop-color="#c0f0ff"/>
            <stop offset="100%" stop-color="#40b8ff" stop-opacity="0"/>
          </radialGradient>
          <!-- Brillo superficie -->
          <radialGradient id="gS" cx="32%" cy="22%" r="50%">
            <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
          <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- ══ LLAMA AZUL ══ -->
        <!-- Partículas -->
        <circle cx="93"  cy="8"  r="2.5" fill="#80e8ff" opacity=".75"/>
        <circle cx="104" cy="4"  r="1.8" fill="#b0f4ff" opacity=".65"/>
        <circle cx="84"  cy="12" r="1.5" fill="#60d0ff" opacity=".55"/>
        <circle cx="110" cy="10" r="1.2" fill="#90eeff" opacity=".5"/>
        <!-- Llama exterior azul eléctrico -->
        <path d="M100 42
          C98 32 92 18 100 6
          C95 12 89 5 91 13
          C86 6 80 10 83 19
          C78 12 72 21 81 30
          C75 36 79 46 87 47
          C82 53 86 60 91 57
          C96 61 101 53 96 47
          C104 45 108 34 100 42Z"
          fill="url(#gF1)" filter="url(#fGlow)" opacity=".95"/>
        <!-- Llama media -->
        <path d="M97 40
          C96 31 91 21 97 13
          C93 18 89 13 90 19
          C87 14 83 18 87 25
          C83 30 86 39 91 40
          C88 45 90 51 94 49
          C98 51 100 45 97 40Z"
          fill="#50d0ff" opacity=".9"/>
        <!-- Núcleo blanco -->
        <path d="M95 38
          C94 31 91 25 95 19
          C93 23 90 20 91 25
          C89 21 86 24 89 30
          C87 34 89 40 93 41
          C91 44 93 49 95 47
          C97 49 99 44 97 41
          C100 38 96 32 95 38Z"
          fill="url(#gF2)" opacity=".92"/>
        <!-- Brillo centro llama -->
        <ellipse cx="94" cy="34" rx="4" ry="6" fill="white" opacity=".55" filter="url(#fSoft)"/>
        <!-- Halo base llama sobre cabeza -->
        <ellipse cx="95" cy="48" rx="13" ry="5" fill="#60d8ff" opacity=".18"/>

        <!-- ══ BRANQUIA IZQUIERDA (ala con deditos) ══ -->
        <!-- Ala principal izquierda -->
        <path d="M55 88 C44 76 22 68 10 55 C8 69 18 80 33 86 C20 89 10 98 13 110 C25 103 42 96 55 93Z"
              fill="url(#gD)" opacity=".92"/>
        <!-- Deditos branquia izquierda — bolitas oscuras -->
        <circle cx="11" cy="53" r="8.5" fill="#0a3aaa" opacity=".95"/>
        <circle cx="7"  cy="68" r="8"   fill="#0a3aaa" opacity=".95"/>
        <circle cx="9"  cy="83" r="7.5" fill="#0a3aaa" opacity=".95"/>
        <!-- Línea contorno ala -->
        <path d="M55 88 C44 77 24 69 11 55" fill="none" stroke="#082888" stroke-width="1.5" opacity=".4"/>
        <path d="M33 86 C20 90 10 99 13 110" fill="none" stroke="#082888" stroke-width="1.2" opacity=".3"/>

        <!-- ══ BRANQUIA DERECHA (ala con deditos) ══ -->
        <path d="M145 88 C156 76 178 68 190 55 C192 69 182 80 167 86 C180 89 190 98 187 110 C175 103 158 96 145 93Z"
              fill="url(#gD)" opacity=".92"/>
        <!-- Deditos branquia derecha -->
        <circle cx="189" cy="53" r="8.5" fill="#0a3aaa" opacity=".95"/>
        <circle cx="193" cy="68" r="8"   fill="#0a3aaa" opacity=".95"/>
        <circle cx="191" cy="83" r="7.5" fill="#0a3aaa" opacity=".95"/>
        <!-- Línea contorno ala -->
        <path d="M145 88 C156 77 176 69 189 55" fill="none" stroke="#082888" stroke-width="1.5" opacity=".4"/>
        <path d="M167 86 C180 90 190 99 187 110" fill="none" stroke="#082888" stroke-width="1.2" opacity=".3"/>

        <!-- ══ COLA curvada hacia adelante-izquierda ══ -->
        <path d="M90 195
          C78 205 62 212 52 222
          C40 234 38 246 50 248
          C62 244 76 234 85 222
          C90 214 93 204 95 197Z"
              fill="url(#gT)"/>
        <!-- Borde cola -->
        <path d="M90 195 C78 205 62 212 52 222 C40 234 38 246 50 248"
              fill="none" stroke="#082888" stroke-width="1.5" opacity=".35"/>

        <!-- ══ CUERPO — teardrop gordo ══ -->
        <!-- Sombra suave -->
        <ellipse cx="102" cy="162" rx="54" ry="52" fill="#082888" opacity=".12"/>
        <!-- Cuerpo principal -->
        <path d="M52 155 C52 120 75 100 100 100 C125 100 148 120 148 155 C148 185 130 205 100 208 C70 205 52 185 52 155Z"
              fill="url(#gC)"/>

        <!-- ══ CABEZA — círculo grande ══ -->
        <!-- Sombra cabeza -->
        <circle cx="102" cy="95" r="52" fill="#082888" opacity=".1"/>
        <!-- Cabeza -->
        <circle cx="100" cy="92" r="52" fill="url(#gC)"/>
        <!-- Brillo esférico cabeza -->
        <ellipse cx="82" cy="74" rx="24" ry="14" fill="url(#gS)" transform="rotate(-12 82 74)"/>

        <!-- ══ OJOS — negros simples y lindos como la imagen ══ -->
        <!-- Ojo izquierdo -->
        <circle cx="80" cy="92" r="12" fill="#0d1d5a"/>
        <circle cx="76" cy="88" r="4.5" fill="white" opacity=".85"/>
        <circle cx="82" cy="96" r="1.8" fill="white" opacity=".4"/>
        <!-- Ojo derecho -->
        <circle cx="120" cy="92" r="12" fill="#0d1d5a"/>
        <circle cx="116" cy="88" r="4.5" fill="white" opacity=".85"/>
        <circle cx="122" cy="96" r="1.8" fill="white" opacity=".4"/>

        <!-- ══ BOCA — línea curva sutil ══ -->
        <path id="axo-mouth" d="M91 147 Q100 155 109 147"
              stroke="#0d1d5a" stroke-width="2.8" fill="none" stroke-linecap="round"/>

        <!-- ══ PATITAS FRONTALES — pequeñas y juntas ══ -->
        <!-- Patita izquierda -->
        <ellipse cx="78" cy="178" rx="14" ry="10" transform="rotate(-20 78 178)" fill="url(#gC)"/>
        <circle cx="66" cy="170" r="6"   fill="url(#gB)"/>
        <circle cx="72" cy="165" r="5.5" fill="url(#gB)"/>
        <circle cx="79" cy="163" r="5"   fill="url(#gB)"/>
        <path d="M67 172 Q73 167 80 165" stroke="#082888" stroke-width="1.3" fill="none" opacity=".4" stroke-linecap="round"/>

        <!-- Patita derecha -->
        <ellipse cx="122" cy="178" rx="14" ry="10" transform="rotate(20 122 178)" fill="url(#gC)"/>
        <circle cx="134" cy="170" r="6"   fill="url(#gB)"/>
        <circle cx="128" cy="165" r="5.5" fill="url(#gB)"/>
        <circle cx="121" cy="163" r="5"   fill="url(#gB)"/>
        <path d="M133 172 Q127 167 120 165" stroke="#082888" stroke-width="1.3" fill="none" opacity=".4" stroke-linecap="round"/>

        <!-- ══ BARRIGA / DETALLE VIENTRE ══ -->
        <ellipse cx="100" cy="172" rx="28" ry="22" fill="url(#gB)" opacity=".38"/>
        <!-- Líneas barriga como la imagen -->
        <path d="M86 182 Q100 190 114 182" stroke="#1560d4" stroke-width="1.8" fill="none" opacity=".28" stroke-linecap="round"/>
        <path d="M89 172 Q100 179 111 172" stroke="#1560d4" stroke-width="1.5" fill="none" opacity=".2"  stroke-linecap="round"/>

        <!-- Brillo cuerpo -->
        <ellipse cx="83" cy="148" rx="16" ry="10" fill="white" opacity=".07"/>
      </svg>
    </div>
  `;

  document.body.appendChild(container);

  window.axoToggle = function() { isOpen ? closeTutorial() : openTutorial(); };
  window.axoClose  = closeTutorial;
  window.axoNext   = nextStep;
  window.axoPrev   = prevStep;
  window.axoGoTo   = function(idx) { currentStep = idx; showStep(idx); };

})();