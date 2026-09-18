// Estado local del módulo de perfil de usuario
let pestanaPerfilActiva = 'mis-mazos';

function sanitizarHTMLPerfil(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function inicializarPerfil() {
  const navLinkPerfil = document.querySelector('.nav-link[data-target="vista-perfil"]');
  if (navLinkPerfil) {
    navLinkPerfil.addEventListener('click', () => {
      cargarPerfilUsuario();
    });
  }
}

async function cargarPerfilUsuario() {
  const contenedor = document.getElementById('perfil-contenido');
  if (!contenedor) return;

  const idUsuario = localStorage.getItem('id_usuario');
  const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Jugador';
  const correoUsuario = localStorage.getItem('correo_usuario') || '';
  const rolUsuario = localStorage.getItem('rol_usuario') || 'USER';

  if (!idUsuario) {
    contenedor.innerHTML = `
      <div class="perfil-card perfil-no-auth">
        <div class="perfil-avatar">🔒</div>
        <h3>No has iniciado sesión</h3>
        <p>Debes iniciar sesión o registrarte para ver tus mazos creados y tus mazos favoritos.</p>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button class="btn-primary" onclick="document.getElementById('btn-abrir-login').click()">Iniciar Sesión</button>
          <button class="btn-secondary nav-btn" data-target="vista-registro">Registrarse</button>
        </div>
      </div>
    `;

    const btnReg = contenedor.querySelector('[data-target="vista-registro"]');
    if (btnReg && typeof cambiarVista === 'function') {
      btnReg.onclick = () => cambiarVista('vista-registro');
    }
    return;
  }

  const inicial = (nombreUsuario.charAt(0) || 'U').toUpperCase();

  contenedor.innerHTML = `
    <div class="perfil-header-card">
      <div class="perfil-user-info">
        <div class="perfil-avatar">${inicial}</div>
        <div class="perfil-detalles">
          <h3>${sanitizarHTMLPerfil(nombreUsuario)}</h3>
          <p class="perfil-correo">${sanitizarHTMLPerfil(correoUsuario)}</p>
          <span class="badge-rol ${rolUsuario === 'ADMIN' ? 'badge-admin' : 'badge-user'}">
            ${rolUsuario === 'ADMIN' ? '👑 Administrador' : '⚔️ Jugador'}
          </span>
        </div>
      </div>
      <div class="perfil-acciones">
        <button id="btn-perfil-crear-mazo" class="btn-primary">➕ Construir Mazo</button>
        <button id="btn-perfil-cerrar-sesion" class="btn-secondary">Cerrar Sesión</button>
      </div>
    </div>

    <div class="perfil-tabs-container">
      <div class="perfil-tabs">
        <button id="tab-perfil-mis-mazos" class="tab-btn active">
          🗂️ Mis Mazos Creados (<span id="perfil-count-mazos">0</span>)
        </button>
        <button id="tab-perfil-favoritos" class="tab-btn">
          ⭐ Mazos Favoritos (<span id="perfil-count-favoritos">0</span>)
        </button>
      </div>
    </div>

    <div id="seccion-mis-mazos" class="perfil-seccion-tab">
      <div class="perfil-seccion-header">
        <h4>Mazos Construidos por Ti</h4>
        <p>Gestiona, visualiza o elimina tus estrategias personalizadas.</p>
      </div>
      <div id="grid-mis-mazos" class="mazos-grid">
        <p class="empty-deck-msg">Cargando tus mazos...</p>
      </div>
    </div>

    <div id="seccion-mis-favoritos" class="perfil-seccion-tab" style="display: none;">
      <div class="perfil-seccion-header">
        <h4>Tus Mazos Favoritos de la Comunidad</h4>
        <p>Acceso rápido a las estrategias que has guardado.</p>
      </div>
      <div id="grid-mis-favoritos" class="mazos-grid">
        <p class="empty-deck-msg">Cargando tus favoritos...</p>
      </div>
    </div>
  `;

  configurarEventosPerfilTabs(idUsuario);

  const btnLogout = document.getElementById('btn-perfil-cerrar-sesion');
  if (btnLogout && typeof cerrarSesion === 'function') {
    btnLogout.onclick = cerrarSesion;
  }

  await Promise.all([
    cargarMisMazosPerfil(idUsuario),
    cargarMisFavoritosPerfil(idUsuario)
  ]);
}

function configurarEventosPerfilTabs(idUsuario) {
  const tabMisMazos = document.getElementById('tab-perfil-mis-mazos');
  const tabFavoritos = document.getElementById('tab-perfil-favoritos');
  const secMisMazos = document.getElementById('seccion-mis-mazos');
  const secFavoritos = document.getElementById('seccion-mis-favoritos');
  const btnCrearMazo = document.getElementById('btn-perfil-crear-mazo');

  if (tabMisMazos && tabFavoritos && secMisMazos && secFavoritos) {
    tabMisMazos.onclick = () => {
      pestanaPerfilActiva = 'mis-mazos';
      tabMisMazos.classList.add('active');
      tabFavoritos.classList.remove('active');
      secMisMazos.style.display = 'block';
      secFavoritos.style.display = 'none';
      cargarMisMazosPerfil(idUsuario);
    };

    tabFavoritos.onclick = () => {
      pestanaPerfilActiva = 'favoritos';
      tabFavoritos.classList.add('active');
      tabMisMazos.classList.remove('active');
      secFavoritos.style.display = 'block';
      secMisMazos.style.display = 'none';
      cargarMisFavoritosPerfil(idUsuario);
    };
  }

  if (btnCrearMazo) {
    btnCrearMazo.onclick = () => {
      if (typeof cambiarVista === 'function') {
        cambiarVista('vista-mazos');
      }
      setTimeout(() => {
        if (typeof mostrarSubvistaMazos === 'function') {
          mostrarSubvistaMazos('constructor');
        }
      }, 50);
    };
  }
}

async function cargarMisMazosPerfil(idUsuario) {
  const contenedor = document.getElementById('grid-mis-mazos');
  const countBadge = document.getElementById('perfil-count-mazos');

  const res = await obtenerMisMazosAPI(idUsuario);
  const mazos = (res && res.exito && Array.isArray(res.datos)) ? res.datos : [];

  if (countBadge) countBadge.textContent = mazos.length;
  if (!contenedor) return;

  if (mazos.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-deck-perfil">
        <p>Aún no has creado ningún mazo.</p>
        <button class="btn-primary" onclick="document.getElementById('btn-perfil-crear-mazo').click()">➕ Construir mi Primer Mazo</button>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '';
  const fragmento = document.createDocumentFragment();

  mazos.forEach(mazo => {
    const card = document.createElement('div');
    card.classList.add('mazo-card');

    const fecha = mazo.fecha_creacion_mazo
      ? new Date(mazo.fecha_creacion_mazo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Reciente';

    const desc = sanitizarHTMLPerfil(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripción.');

    card.innerHTML = `
      <div class="mazo-card-header">
        <h4 class="mazo-card-titulo">${sanitizarHTMLPerfil(mazo.nombre_mazo)}</h4>
        <span class="badge-publico ${mazo.es_publico ? 'badge-publico-si' : 'badge-publico-no'}">
          ${mazo.es_publico ? '🌐 Público' : '🔒 Privado'}
        </span>
      </div>
      <p class="mazo-card-desc">${desc}</p>
      <div class="mazo-card-stats">
        <span class="mazo-stat-cartas">🂠 ${mazo.total_cartas || 50} cartas</span>
        <span class="mazo-stat-fecha">📅 ${fecha}</span>
      </div>
      <div class="mazo-card-footer">
        <button class="btn-primary btn-ver-mazo" data-id="${mazo.id_mazo}">Ver Cartas</button>
        <button class="btn-danger-small btn-eliminar-mi-mazo" data-id="${mazo.id_mazo}" data-nombre="${sanitizarHTMLPerfil(mazo.nombre_mazo)}">Eliminar</button>
      </div>
    `;

    const btnVer = card.querySelector('.btn-ver-mazo');
    if (btnVer) {
      btnVer.onclick = (e) => {
        e.stopPropagation();
        if (typeof abrirModalDetalleMazo === 'function') {
          abrirModalDetalleMazo(mazo.id_mazo);
        }
      };
    }

    const btnEliminar = card.querySelector('.btn-eliminar-mi-mazo');
    if (btnEliminar) {
      btnEliminar.onclick = async (e) => {
        e.stopPropagation();
        const nombreM = btnEliminar.getAttribute('data-nombre');
        if (confirm(`¿Estás seguro de que deseas eliminar tu mazo "${nombreM}"?`)) {
          const resDel = await eliminarMazoAPI(mazo.id_mazo, idUsuario);
          if (resDel && resDel.exito) {
            alert('Mazo eliminado con éxito.');
            cargarMisMazosPerfil(idUsuario);
            if (typeof cargarGaleriaMazos === 'function') cargarGaleriaMazos();
          } else {
            alert('Error al eliminar: ' + (resDel.mensaje || 'Intenta de nuevo.'));
          }
        }
      };
    }

    card.onclick = () => {
      if (typeof abrirModalDetalleMazo === 'function') {
        abrirModalDetalleMazo(mazo.id_mazo);
      }
    };

    fragmento.appendChild(card);
  });

  contenedor.appendChild(fragmento);
}

async function cargarMisFavoritosPerfil(idUsuario) {
  const contenedor = document.getElementById('grid-mis-favoritos');
  const countBadge = document.getElementById('perfil-count-favoritos');

  const res = await obtenerFavoritosUsuarioAPI(idUsuario);
  const favoritos = (res && res.exito && Array.isArray(res.datos)) ? res.datos : [];

  if (countBadge) countBadge.textContent = favoritos.length;
  if (!contenedor) return;

  if (favoritos.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-deck-perfil">
        <p>No tienes ningún mazo guardado en favoritos todavía.</p>
        <p style="font-size: 0.88rem; color: #888;">Explora la galería comunitaria y haz clic en la estrella ⭐ para guardar tus favoritos.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '';
  const fragmento = document.createDocumentFragment();

  favoritos.forEach(mazo => {
    const card = document.createElement('div');
    card.classList.add('mazo-card');

    const autor = sanitizarHTMLPerfil(mazo.nombre_usuario || 'Comunidad');
    const desc = sanitizarHTMLPerfil(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripción.');

    card.innerHTML = `
      <div class="mazo-card-header">
        <h4 class="mazo-card-titulo">${sanitizarHTMLPerfil(mazo.nombre_mazo)}</h4>
        <span class="mazo-autor">Por: ${autor}</span>
      </div>
      <p class="mazo-card-desc">${desc}</p>
      <div class="mazo-card-stats">
        <span class="mazo-stat-cartas">🂠 ${mazo.total_cartas || 50} cartas</span>
        <span class="mazo-fav-tag">⭐ En Favoritos</span>
      </div>
      <div class="mazo-card-footer">
        <button class="btn-primary btn-ver-fav" data-id="${mazo.id_mazo}">Ver Cartas</button>
        <button class="btn-secondary btn-quitar-fav" data-id="${mazo.id_mazo}">Quitar ⭐</button>
      </div>
    `;

    const btnVer = card.querySelector('.btn-ver-fav');
    if (btnVer) {
      btnVer.onclick = (e) => {
        e.stopPropagation();
        if (typeof abrirModalDetalleMazo === 'function') {
          abrirModalDetalleMazo(mazo.id_mazo);
        }
      };
    }

    const btnQuitar = card.querySelector('.btn-quitar-fav');
    if (btnQuitar) {
      btnQuitar.onclick = async (e) => {
        e.stopPropagation();
        const resQuitar = await quitarFavoritoAPI(idUsuario, mazo.id_mazo);
        if (resQuitar && resQuitar.exito) {
          cargarMisFavoritosPerfil(idUsuario);
          if (typeof cargarGaleriaMazos === 'function') cargarGaleriaMazos();
        }
      };
    }

    card.onclick = () => {
      if (typeof abrirModalDetalleMazo === 'function') {
        abrirModalDetalleMazo(mazo.id_mazo);
      }
    };

    fragmento.appendChild(card);
  });

  contenedor.appendChild(fragmento);
}
