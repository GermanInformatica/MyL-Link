/**
 * M?dulo de Mi Perfil (Mis Mazos Creados y Mazos Favoritos).
 */

let pestanaPerfilActiva = 'mis-mazos'; // 'mis-mazos' | 'favoritos'

function sanitizarHTMLPerfil(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inicializa la vista de Mi Perfil y sus eventos.
 */
function inicializarPerfil() {
  cargarVistaPerfil();
}

/**
 * Renderiza la interfaz de Mi Perfil seg?n el estado de la sesi?n.
 */
async function cargarVistaPerfil() {
  const contenedor = document.getElementById('perfil-contenido');
  if (!contenedor) return;

  const idUsuario = localStorage.getItem('id_usuario');
  const nombreUsuario = localStorage.getItem('nombre_usuario');
  const correoUsuario = localStorage.getItem('correo_usuario');
  const rolUsuario = localStorage.getItem('rol_usuario');

  // Si no ha iniciado sesi?n, mostrar banner de invitaci?n
  if (!idUsuario) {
    contenedor.innerHTML = `
      <div class="perfil-guest-card">
        <div class="perfil-guest-icon">??</div>
        <h3>Inicia Sesi?n para ver tu Perfil</h3>
        <p>Accede a tu cuenta para consultar tus mazos construidos, gestionar tus favoritos y compartir tus estrategias con la comunidad.</p>
        <div class="perfil-guest-buttons">
          <button id="btn-perfil-login" class="btn-primary btn-large">Iniciar Sesi?n</button>
          <button class="btn-secondary btn-large nav-btn" data-target="vista-registro">Crear una Cuenta</button>
        </div>
      </div>
    `;

    const btnPerfilLogin = document.getElementById('btn-perfil-login');
    if (btnPerfilLogin) {
      btnPerfilLogin.onclick = (e) => {
        e.preventDefault();
        if (typeof abrirModalLogin === 'function') abrirModalLogin();
      };
    }
    return;
  }

  // Renderizar la estructura del perfil conectado
  contenedor.innerHTML = `
    <div class="perfil-usuario-card">
      <div class="perfil-avatar">
        <span>${(nombreUsuario || 'U').charAt(0).toUpperCase()}</span>
      </div>
      <div class="perfil-datos">
        <div class="perfil-nombre-rol">
          <h2>${sanitizarHTMLPerfil(nombreUsuario)}</h2>
          <span class="badge-rol badge-rol-${(rolUsuario || 'USER').toLowerCase()}">${rolUsuario || 'USER'}</span>
        </div>
        <p class="perfil-correo">?? ${sanitizarHTMLPerfil(correoUsuario)}</p>
      </div>
      <div class="perfil-resumen-stats">
        <div class="perfil-stat-item">
          <span id="perfil-count-mazos" class="perfil-stat-num">...</span>
          <span class="perfil-stat-lbl">Mazos Creados</span>
        </div>
        <div class="perfil-stat-item">
          <span id="perfil-count-favoritos" class="perfil-stat-num">...</span>
          <span class="perfil-stat-lbl">Favoritos</span>
        </div>
      </div>
    </div>

    <!-- PESTA?AS DEL PERFIL -->
    <div class="perfil-nav-tabs">
      <button id="tab-perfil-mis-mazos" class="tab-perfil-btn ${pestanaPerfilActiva === 'mis-mazos' ? 'active' : ''}">
        ??? Mis Mazos Creados
      </button>
      <button id="tab-perfil-favoritos" class="tab-perfil-btn ${pestanaPerfilActiva === 'favoritos' ? 'active' : ''}">
        ? Mazos Favoritos
      </button>
    </div>

    <!-- CONTENEDOR DE SUB-VISTA: MIS MAZOS CREADOS -->
    <div id="seccion-mis-mazos" class="perfil-subseccion" style="display: ${pestanaPerfilActiva === 'mis-mazos' ? 'block' : 'none'};">
      <div class="perfil-subseccion-header">
        <div>
          <h3>Mis Mazos Creados</h3>
          <p>Tus mazos construidos para formato Espada Sagrada.</p>
        </div>
        <button id="btn-perfil-crear-mazo" class="btn-primary">+ Crear Nuevo Mazo</button>
      </div>
      <div id="grid-mis-mazos" class="mazos-grid">
        <p class="empty-deck-msg">Cargando tus mazos...</p>
      </div>
    </div>

    <!-- CONTENEDOR DE SUB-VISTA: MAZOS FAVORITOS -->
    <div id="seccion-mis-favoritos" class="perfil-subseccion" style="display: ${pestanaPerfilActiva === 'favoritos' ? 'block' : 'none'};">
      <div class="perfil-subseccion-header">
        <div>
          <h3>Mazos Favoritos</h3>
          <p>Mazos de la comunidad que has guardado como favoritos.</p>
        </div>
        <button class="btn-secondary nav-btn" data-target="vista-mazos">Explorar Galer?a</button>
      </div>
      <div id="grid-mis-favoritos" class="mazos-grid">
        <p class="empty-deck-msg">Cargando tus favoritos...</p>
      </div>
    </div>
  `;

  // Configurar botones de pesta?as
  configurarEventosPerfilTabs(idUsuario);

  // Cargar datos de ambas pesta?as y contadores
  await Promise.all([
    cargarMisMazosPerfil(idUsuario),
    cargarMisFavoritosPerfil(idUsuario)
  ]);
}

/**
 * Configura los eventos de cambio de pesta?as en el perfil.
 */
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
      // Navegar a la vista de mazos y abrir el constructor
      const navMazos = document.querySelector('.nav-link[data-target="vista-mazos"]');
      if (navMazos) navMazos.click();

      setTimeout(() => {
        const btnIrCrear = document.getElementById('btn-ir-crear-mazo');
        if (btnIrCrear) btnIrCrear.click();
      }, 50);
    };
  }
}

/**
 * Carga y renderiza los mazos creados por el usuario en su perfil.
 */
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
        <p>A?n no has creado ning?n mazo.</p>
        <button class="btn-primary" onclick="document.getElementById('btn-perfil-crear-mazo').click()">+ Construir mi Primer Mazo</button>
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

    const desc = sanitizarHTMLPerfil(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripci?n.');

    card.innerHTML = `
      <div class="mazo-card-header">
        <h4 class="mazo-card-titulo">${sanitizarHTMLPerfil(mazo.nombre_mazo)}</h4>
        <span class="badge-publico ${mazo.es_publico ? 'badge-publico-si' : 'badge-publico-no'}">
          ${mazo.es_publico ? '?? P?blico' : '?? Privado'}
        </span>
      </div>
      <p class="mazo-card-desc">${desc}</p>
      <div class="mazo-card-stats">
        <span class="mazo-stat-cartas">?? ${mazo.total_cartas || 50} cartas</span>
        <span class="mazo-stat-fecha">?? ${fecha}</span>
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
        if (confirm(`?Est?s seguro de que deseas eliminar tu mazo "${nombreM}"?`)) {
          const resDel = await eliminarMazoAPI(mazo.id_mazo, idUsuario);
          if (resDel && resDel.exito) {
            alert('Mazo eliminado con ?xito.');
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

/**
 * Carga y renderiza los mazos favoritos del usuario en su perfil.
 */
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
        <p>No tienes ning?n mazo guardado en favoritos todav?a.</p>
        <p style="font-size: 0.88rem; color: #888;">Explora la galer?a comunitaria y haz clic en la estrella ? para guardar tus favoritos.</p>
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
    const desc = sanitizarHTMLPerfil(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripci?n.');

    card.innerHTML = `
      <div class="mazo-card-header">
        <h4 class="mazo-card-titulo">${sanitizarHTMLPerfil(mazo.nombre_mazo)}</h4>
        <span class="mazo-autor">Por: ${autor}</span>
      </div>
      <p class="mazo-card-desc">${desc}</p>
      <div class="mazo-card-stats">
        <span class="mazo-stat-cartas">?? ${mazo.total_cartas || 50} cartas</span>
        <span class="mazo-fav-tag">? En Favoritos</span>
      </div>
      <div class="mazo-card-footer">
        <button class="btn-primary btn-ver-fav" data-id="${mazo.id_mazo}">Ver Cartas</button>
        <button class="btn-secondary btn-quitar-fav" data-id="${mazo.id_mazo}">Quitar ?</button>
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
