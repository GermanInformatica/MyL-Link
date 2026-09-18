// Estado global del módulo de mazos y constructor
let todasLasCartasMazos = [];
let mazoActual = [];
let subvistaMazosActiva = 'galeria';
let setFavoritosUsuario = new Set();
let mazoDetalleActivoId = null;

function sanitizarHTML(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function inicializarMazos(cartas) {
  todasLasCartasMazos = Array.isArray(cartas) ? cartas : [];
  renderizarCatalogoDeckbuilder(todasLasCartasMazos);
  configurarFiltrosDeckbuilder();
  configurarAccionesMazo();
  configurarNavegacionSubvistasMazos();
  configurarModalDetalleMazo();
  actualizarVistaMazo();
  await actualizarSetFavoritosUsuario();
  cargarGaleriaMazos();
}

async function actualizarSetFavoritosUsuario() {
  const idUsuario = localStorage.getItem('id_usuario');
  if (!idUsuario) {
    setFavoritosUsuario.clear();
    return;
  }
  try {
    const ids = await obtenerIdsFavoritosAPI(idUsuario);
    setFavoritosUsuario = new Set(ids.map(Number));
  } catch (error) {
    console.error('Error al obtener IDs de favoritos:', error);
    setFavoritosUsuario.clear();
  }
}

function mostrarSubvistaMazos(subvista) {
  subvistaMazosActiva = subvista;
  const galeria = document.getElementById('subvista-galeria-mazos');
  const misMazos = document.getElementById('subvista-mis-mazos');
  const favoritos = document.getElementById('subvista-mazos-favoritos');
  const constructor = document.getElementById('subvista-constructor-mazo');

  const btnGaleria = document.getElementById('btn-subnav-galeria');
  const btnMisMazos = document.getElementById('btn-subnav-mis-mazos');
  const btnFavoritos = document.getElementById('btn-subnav-favoritos');
  const btnCrear = document.getElementById('btn-subnav-crear');

  if (galeria) galeria.style.display = 'none';
  if (misMazos) misMazos.style.display = 'none';
  if (favoritos) favoritos.style.display = 'none';
  if (constructor) constructor.style.display = 'none';

  [btnGaleria, btnMisMazos, btnFavoritos, btnCrear].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  const idUsuario = localStorage.getItem('id_usuario');

  switch (subvista) {
    case 'galeria':
      if (galeria) galeria.style.display = 'block';
      if (btnGaleria) btnGaleria.classList.add('active');
      cargarGaleriaMazos();
      break;
    case 'mis-mazos':
      if (misMazos) misMazos.style.display = 'block';
      if (btnMisMazos) btnMisMazos.classList.add('active');
      cargarMisMazosSeccion(idUsuario);
      break;
    case 'favoritos':
      if (favoritos) favoritos.style.display = 'block';
      if (btnFavoritos) btnFavoritos.classList.add('active');
      cargarMazosFavoritosSeccion(idUsuario);
      break;
    case 'constructor':
      if (constructor) constructor.style.display = 'block';
      if (btnCrear) btnCrear.classList.add('active');
      break;
    default:
      if (galeria) galeria.style.display = 'block';
      if (btnGaleria) btnGaleria.classList.add('active');
      cargarGaleriaMazos();
      break;
  }
}

function configurarNavegacionSubvistasMazos() {
  const btnGaleria = document.getElementById('btn-subnav-galeria');
  const btnMisMazos = document.getElementById('btn-subnav-mis-mazos');
  const btnFavoritos = document.getElementById('btn-subnav-favoritos');
  const btnCrear = document.getElementById('btn-subnav-crear');
  const btnVolver = document.getElementById('btn-volver-galeria');

  if (btnGaleria) btnGaleria.onclick = () => mostrarSubvistaMazos('galeria');
  if (btnMisMazos) btnMisMazos.onclick = () => mostrarSubvistaMazos('mis-mazos');
  if (btnFavoritos) btnFavoritos.onclick = () => mostrarSubvistaMazos('favoritos');

  if (btnCrear) {
    btnCrear.onclick = () => {
      const idUsuario = localStorage.getItem('id_usuario');
      if (!idUsuario) {
        alert('Debes iniciar sesión para construir y guardar tus propios mazos.');
        const btnLogin = document.getElementById('btn-abrir-login');
        if (btnLogin) btnLogin.click();
        return;
      }
      mostrarSubvistaMazos('constructor');
    };
  }

  if (btnVolver) btnVolver.onclick = () => mostrarSubvistaMazos('galeria');
}

async function cargarGaleriaMazos() {
  const contenedor = document.getElementById('grid-mazos-comunidad');
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="empty-deck-msg">Cargando mazos de la comunidad...</p>';
  try {
    await actualizarSetFavoritosUsuario();
    const mazos = await obtenerMazosAPI();
    renderizarGaleriaMazos(mazos);
  } catch (error) {
    console.error('Error al cargar la galería de mazos:', error);
    contenedor.innerHTML = '<p class="empty-deck-msg">Error de conexión al cargar la galería de mazos.</p>';
  }
}

function renderizarGaleriaMazos(mazos) {
  const contenedor = document.getElementById('grid-mazos-comunidad');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (!mazos || mazos.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">No hay mazos públicos disponibles aún. ¡Sé el primero en crear uno!</p>';
    return;
  }
  const fragmento = document.createDocumentFragment();
  const idUsuarioActual = Number(localStorage.getItem('id_usuario')) || null;

  mazos.forEach(mazo => {
    const card = document.createElement('div');
    card.classList.add('mazo-card');
    const fechaCreacion = mazo.fecha_creacion || mazo.fecha_creacion_mazo
      ? new Date(mazo.fecha_creacion || mazo.fecha_creacion_mazo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'Reciente';

    const nombreMazo = sanitizarHTML(mazo.nombre_mazo);
    const nombreUsuario = sanitizarHTML(mazo.nombre_usuario || 'Comunidad');
    const descripcion = sanitizarHTML(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripción.');
    const totalCartas = mazo.total_cartas || 50;
    const esFavorito = setFavoritosUsuario.has(Number(mazo.id_mazo));
    const esPropio = idUsuarioActual && Number(mazo.id_usuario) === idUsuarioActual;

    card.innerHTML = `
      <div class="mazo-card-header">
        <div class="mazo-card-header-top">
          <h3 class="mazo-card-titulo">${nombreMazo}</h3>
          <button class="btn-fav-card ${esFavorito ? 'fav-activo' : ''}" 
                  data-id="${mazo.id_mazo}" 
                  title="${esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}" 
                  aria-label="Favorito">
            ${esFavorito ? '⭐' : '☆'}
          </button>
        </div>
        <div class="mazo-card-meta">
          <span class="mazo-autor">Por: ${nombreUsuario} ${esPropio ? '<span class="badge-tu-mazo">(Tú)</span>' : ''}</span>
          <span class="badge-cartas-total">${totalCartas} cartas</span>
        </div>
      </div>
      <div class="mazo-card-body">
        <p class="mazo-card-desc">${descripcion}</p>
        <div class="mazo-card-footer">
          <small class="mazo-fecha">📅 ${fechaCreacion}</small>
          <button class="btn-primary btn-ver-mazo-detalle" data-id="${mazo.id_mazo}">Ver Mazo &rarr;</button>
        </div>
      </div>
    `;

    const btnFav = card.querySelector('.btn-fav-card');
    if (btnFav) {
      btnFav.onclick = async (e) => {
        e.stopPropagation();
        await manejarToggleFavorito(mazo.id_mazo, btnFav);
      };
    }

    const btnVer = card.querySelector('.btn-ver-mazo-detalle');
    if (btnVer) {
      btnVer.onclick = (e) => {
        e.stopPropagation();
        abrirModalDetalleMazo(mazo.id_mazo);
      };
    }

    card.onclick = () => abrirModalDetalleMazo(mazo.id_mazo);
    fragmento.appendChild(card);
  });
  contenedor.appendChild(fragmento);
}

async function cargarMisMazosSeccion(idUsuario) {
  const contenedor = document.getElementById('grid-mis-mazos-seccion');
  if (!contenedor) return;

  if (!idUsuario) {
    contenedor.innerHTML = `
      <div class="deck-auth-banner">
        <div class="deck-auth-icon">🔒</div>
        <h3>Inicia Sesión para Ver Tus Mazos</h3>
        <p>Debes estar registrado e iniciar sesión para ver y gestionar los mazos que has creado.</p>
        <div style="margin-top: 15px;">
          <button class="btn-primary" onclick="document.getElementById('btn-abrir-login').click()">Iniciar Sesión</button>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '<p class="empty-deck-msg">Cargando tus mazos creados...</p>';

  try {
    const res = await obtenerMisMazosAPI(idUsuario);
    const mazos = (res && res.exito && Array.isArray(res.datos)) ? res.datos : [];

    if (mazos.length === 0) {
      contenedor.innerHTML = `
        <div class="deck-empty-banner">
          <div class="deck-empty-icon">🗂️</div>
          <h3>Aún no has creado ningún mazo</h3>
          <p>Usa nuestro constructor interactivo para armar tu mazo reglamentario de 50 cartas.</p>
          <div style="margin-top: 15px;">
            <button class="btn-primary" onclick="mostrarSubvistaMazos('constructor')">➕ Construir Mi Primer Mazo</button>
          </div>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    mazos.forEach(mazo => {
      const card = document.createElement('div');
      card.classList.add('mazo-card');
      const fecha = mazo.fecha_creacion_mazo || mazo.fecha_creacion
        ? new Date(mazo.fecha_creacion_mazo || mazo.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Reciente';

      const desc = sanitizarHTML(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripción.');
      const esPublico = mazo.es_publico === 1 || mazo.es_publico === true;

      card.innerHTML = `
        <div class="mazo-card-header">
          <div class="mazo-card-header-top">
            <h3 class="mazo-card-titulo">${sanitizarHTML(mazo.nombre_mazo)}</h3>
            <span class="badge-publico ${esPublico ? 'badge-publico-si' : 'badge-publico-no'}">
              ${esPublico ? '🌐 Público' : '🔒 Privado'}
            </span>
          </div>
          <div class="mazo-card-meta">
            <span class="badge-cartas-total">${mazo.total_cartas || 50} cartas</span>
            <span class="mazo-fecha">📅 ${fecha}</span>
          </div>
        </div>
        <div class="mazo-card-body">
          <p class="mazo-card-desc">${desc}</p>
          <div class="mazo-card-footer">
            <button class="btn-primary btn-ver-mi-mazo" data-id="${mazo.id_mazo}">Ver Cartas</button>
            <button class="btn-danger-small btn-eliminar-mi-mazo-seccion" data-id="${mazo.id_mazo}" data-nombre="${sanitizarHTML(mazo.nombre_mazo)}">Eliminar</button>
          </div>
        </div>
      `;

      const btnVer = card.querySelector('.btn-ver-mi-mazo');
      if (btnVer) {
        btnVer.onclick = (e) => {
          e.stopPropagation();
          abrirModalDetalleMazo(mazo.id_mazo);
        };
      }

      const btnEliminar = card.querySelector('.btn-eliminar-mi-mazo-seccion');
      if (btnEliminar) {
        btnEliminar.onclick = async (e) => {
          e.stopPropagation();
          const nombreM = btnEliminar.getAttribute('data-nombre');
          if (confirm(`¿Estás seguro de que deseas eliminar permanentemente tu mazo "${nombreM}"?`)) {
            const resDel = await eliminarMazoAPI(mazo.id_mazo, idUsuario);
            if (resDel && resDel.exito) {
              alert(`¡Mazo "${nombreM}" eliminado con éxito!`);
              cargarMisMazosSeccion(idUsuario);
              if (typeof cargarPerfilUsuario === 'function') cargarPerfilUsuario();
            } else {
              alert('Error al eliminar: ' + (resDel.mensaje || 'Intenta de nuevo.'));
            }
          }
        };
      }

      card.onclick = () => abrirModalDetalleMazo(mazo.id_mazo);
      fragmento.appendChild(card);
    });

    contenedor.appendChild(fragmento);
  } catch (error) {
    console.error('Error al cargar mis mazos:', error);
    contenedor.innerHTML = '<p class="empty-deck-msg">Error de conexión al cargar tus mazos.</p>';
  }
}

async function cargarMazosFavoritosSeccion(idUsuario) {
  const contenedor = document.getElementById('grid-mazos-favoritos-seccion');
  if (!contenedor) return;

  if (!idUsuario) {
    contenedor.innerHTML = `
      <div class="deck-auth-banner">
        <div class="deck-auth-icon">⭐</div>
        <h3>Inicia Sesión para Ver Tus Favoritos</h3>
        <p>Guarda y organiza tus mazos preferidos de toda la comunidad iniciando sesión en tu cuenta.</p>
        <div style="margin-top: 15px;">
          <button class="btn-primary" onclick="document.getElementById('btn-abrir-login').click()">Iniciar Sesión</button>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = '<p class="empty-deck-msg">Cargando tus mazos favoritos...</p>';

  try {
    const res = await obtenerFavoritosUsuarioAPI(idUsuario);
    const favoritos = (res && res.exito && Array.isArray(res.datos)) ? res.datos : [];
    setFavoritosUsuario = new Set(favoritos.map(f => Number(f.id_mazo)));

    if (favoritos.length === 0) {
      contenedor.innerHTML = `
        <div class="deck-empty-banner">
          <div class="deck-empty-icon">⭐</div>
          <h3>No tienes mazos guardados en favoritos</h3>
          <p>Explora la Galería de la Comunidad y haz clic en la estrella ⭐ de cualquier mazo para guardarlo aquí.</p>
          <div style="margin-top: 15px;">
            <button class="btn-secondary" onclick="mostrarSubvistaMazos('galeria')">🌐 Explorar Galería Comunidad</button>
          </div>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    favoritos.forEach(mazo => {
      const card = document.createElement('div');
      card.classList.add('mazo-card');

      const autor = sanitizarHTML(mazo.nombre_usuario || 'Comunidad');
      const desc = sanitizarHTML(mazo.descripcion || mazo.descripcion_mazo || 'Sin descripción.');
      const totalCartas = mazo.total_cartas || 50;

      card.innerHTML = `
        <div class="mazo-card-header">
          <div class="mazo-card-header-top">
            <h3 class="mazo-card-titulo">${sanitizarHTML(mazo.nombre_mazo)}</h3>
            <span class="mazo-fav-tag">⭐ En Favoritos</span>
          </div>
          <div class="mazo-card-meta">
            <span class="mazo-autor">Por: ${autor}</span>
            <span class="badge-cartas-total">${totalCartas} cartas</span>
          </div>
        </div>
        <div class="mazo-card-body">
          <p class="mazo-card-desc">${desc}</p>
          <div class="mazo-card-footer">
            <button class="btn-primary btn-ver-fav-seccion" data-id="${mazo.id_mazo}">Ver Cartas</button>
            <button class="btn-secondary btn-quitar-fav-seccion" data-id="${mazo.id_mazo}">Quitar ⭐</button>
          </div>
        </div>
      `;

      const btnVer = card.querySelector('.btn-ver-fav-seccion');
      if (btnVer) {
        btnVer.onclick = (e) => {
          e.stopPropagation();
          abrirModalDetalleMazo(mazo.id_mazo);
        };
      }

      const btnQuitar = card.querySelector('.btn-quitar-fav-seccion');
      if (btnQuitar) {
        btnQuitar.onclick = async (e) => {
          e.stopPropagation();
          await manejarToggleFavorito(mazo.id_mazo);
          cargarMazosFavoritosSeccion(idUsuario);
        };
      }

      card.onclick = () => abrirModalDetalleMazo(mazo.id_mazo);
      fragmento.appendChild(card);
    });

    contenedor.appendChild(fragmento);
  } catch (error) {
    console.error('Error al cargar favoritos:', error);
    contenedor.innerHTML = '<p class="empty-deck-msg">Error de conexión al cargar tus favoritos.</p>';
  }
}

async function manejarToggleFavorito(idMazo, elementoBoton = null) {
  const idUsuario = localStorage.getItem('id_usuario');
  if (!idUsuario) {
    alert('Debes iniciar sesión para guardar mazos en tus favoritos.');
    const btnLogin = document.getElementById('btn-abrir-login');
    if (btnLogin) btnLogin.click();
    return;
  }

  const idMazoNum = Number(idMazo);
  const estaFavorito = setFavoritosUsuario.has(idMazoNum);

  if (estaFavorito) {
    setFavoritosUsuario.delete(idMazoNum);
    if (elementoBoton) {
      elementoBoton.textContent = '☆';
      elementoBoton.classList.remove('fav-activo');
      elementoBoton.title = 'Agregar a favoritos';
    }
  } else {
    setFavoritosUsuario.add(idMazoNum);
    if (elementoBoton) {
      elementoBoton.textContent = '⭐';
      elementoBoton.classList.add('fav-activo');
      elementoBoton.title = 'Quitar de favoritos';
    }
  }

  actualizarBotonFavoritoModal(idMazoNum);

  try {
    const res = await alternarFavoritoAPI(idUsuario, idMazoNum);
    if (res && res.exito) {
      if (res.esFavorito) {
        setFavoritosUsuario.add(idMazoNum);
      } else {
        setFavoritosUsuario.delete(idMazoNum);
      }
      actualizarBotonFavoritoModal(idMazoNum);
    } else {
      if (estaFavorito) setFavoritosUsuario.add(idMazoNum);
      else setFavoritosUsuario.delete(idMazoNum);
      alert('Error: ' + (res.mensaje || 'No se pudo guardar favorito.'));
      if (subvistaMazosActiva === 'galeria') cargarGaleriaMazos();
    }
  } catch (error) {
    console.error('Error al alternar favorito:', error);
    if (estaFavorito) setFavoritosUsuario.add(idMazoNum);
    else setFavoritosUsuario.delete(idMazoNum);
  }
}

function actualizarBotonFavoritoModal(idMazo) {
  const btnModalFav = document.getElementById('btn-modal-toggle-fav');
  if (!btnModalFav || mazoDetalleActivoId !== Number(idMazo)) return;

  const esFav = setFavoritosUsuario.has(Number(idMazo));
  if (esFav) {
    btnModalFav.innerHTML = '⭐ En Favoritos';
    btnModalFav.classList.add('active');
  } else {
    btnModalFav.innerHTML = '☆ Guardar Favorito';
    btnModalFav.classList.remove('active');
  }
}

function configurarFiltrosDeckbuilder() {
  const inputNombre = document.getElementById('deck-filtro-nombre');
  const selectTipo = document.getElementById('deck-filtro-tipo');
  const selectRaza = document.getElementById('deck-filtro-raza');
  const selectCoste = document.getElementById('deck-filtro-coste');
  const selectFuerza = document.getElementById('deck-filtro-fuerza');
  const btnLimpiar = document.getElementById('deck-btn-limpiar-filtros');

  if (!inputNombre) return;

  const aplicarFiltrosDeck = () => {
    const textoNombre = inputNombre.value.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const tipoSeleccionado = selectTipo ? selectTipo.value : '';
    const razaSeleccionada = selectRaza ? selectRaza.value : '';
    const costeSeleccionado = selectCoste ? selectCoste.value : '';
    const fuerzaSeleccionada = selectFuerza ? selectFuerza.value : '';

    const filtradas = todasLasCartasMazos.filter(carta => {
      const nombreNorm = (carta.nombre_carta || '').toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const coincideNombre = nombreNorm.includes(textoNombre);
      const coincideTipo = tipoSeleccionado === '' || carta.tipo === tipoSeleccionado;
      const coincideRaza = razaSeleccionada === '' || carta.raza === razaSeleccionada;
      const coincideCoste = costeSeleccionado === '' || (carta.coste !== null && String(carta.coste) === costeSeleccionado);
      const coincideFuerza = fuerzaSeleccionada === '' || (carta.fuerza !== null && String(carta.fuerza) === fuerzaSeleccionada);
      return coincideNombre && coincideTipo && coincideRaza && coincideCoste && coincideFuerza;
    });

    renderizarCatalogoDeckbuilder(filtradas);
  };

  inputNombre.oninput = aplicarFiltrosDeck;
  if (selectTipo) selectTipo.onchange = aplicarFiltrosDeck;
  if (selectRaza) selectRaza.onchange = aplicarFiltrosDeck;
  if (selectCoste) selectCoste.onchange = aplicarFiltrosDeck;
  if (selectFuerza) selectFuerza.onchange = aplicarFiltrosDeck;

  if (btnLimpiar) {
    btnLimpiar.onclick = () => {
      inputNombre.value = '';
      if (selectTipo) selectTipo.value = '';
      if (selectRaza) selectRaza.value = '';
      if (selectCoste) selectCoste.value = '';
      if (selectFuerza) selectFuerza.value = '';
      renderizarCatalogoDeckbuilder(todasLasCartasMazos);
    };
  }
}

function renderizarCatalogoDeckbuilder(cartas) {
  const contenedor = document.getElementById('deck-catalogo-lista');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (!cartas || cartas.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">No se encontraron cartas.</p>';
    return;
  }

  const fragmento = document.createDocumentFragment();
  const baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

  cartas.forEach(carta => {
    const card = document.createElement('div');
    card.classList.add('carta-deck-mini');
    const costeStr = carta.coste !== null && carta.coste !== undefined ? `Coste: ${carta.coste}` : '';
    const fuerzaStr = carta.fuerza !== null && carta.fuerza !== undefined ? ` | F: ${carta.fuerza}` : '';
    const imgUrl = carta.imagen_url ? `${baseUrl}${carta.imagen_url}` : 'placeholder.png';

    card.innerHTML = `
      <img src="${imgUrl}" alt="${sanitizarHTML(carta.nombre_carta)}" loading="lazy">
      <div class="carta-deck-mini-info">
        <h4>${sanitizarHTML(carta.nombre_carta)}</h4>
        <small>${sanitizarHTML(carta.tipo)} ${costeStr}${fuerzaStr}</small>
      </div>
    `;

    card.addEventListener('click', () => agregarCartaAlMazo(carta));
    fragmento.appendChild(card);
  });
  contenedor.appendChild(fragmento);
}

function agregarCartaAlMazo(carta) {
  const totalCartas = mazoActual.reduce((acc, item) => acc + item.cantidad, 0);
  if (totalCartas >= 50) {
    alert('Has alcanzado el límite máximo de 50 cartas reglamentarias para este mazo.');
    return;
  }

  const existente = mazoActual.find(item => item.id_carta === carta.id_carta);
  if (existente) {
    if (existente.cantidad >= 3) {
      alert(`No puedes agregar más de 3 copias de "${carta.nombre_carta}".`);
      return;
    }
    existente.cantidad += 1;
  } else {
    mazoActual.push({
      id_carta: carta.id_carta,
      nombre_carta: carta.nombre_carta,
      tipo: carta.tipo,
      raza: carta.raza,
      coste: carta.coste,
      fuerza: carta.fuerza,
      imagen_url: carta.imagen_url,
      cantidad: 1
    });
  }
  actualizarVistaMazo();
}

function cambiarCantidadMazo(idCarta, delta) {
  const idx = mazoActual.findIndex(item => item.id_carta === idCarta);
  if (idx === -1) return;

  const totalCartas = mazoActual.reduce((acc, item) => acc + item.cantidad, 0);
  if (delta > 0 && totalCartas >= 50) {
    alert('El mazo ya tiene 50 cartas reglamentarias.');
    return;
  }
  if (delta > 0 && mazoActual[idx].cantidad >= 3) {
    alert('Máximo 3 copias permitidas por carta.');
    return;
  }

  mazoActual[idx].cantidad += delta;
  if (mazoActual[idx].cantidad <= 0) {
    mazoActual.splice(idx, 1);
  }
  actualizarVistaMazo();
}

function actualizarVistaMazo() {
  const contenedor = document.getElementById('lista-cartas-mazo');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (mazoActual.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">Tu mazo está vacío. Haz clic en las cartas del catálogo para agregarlas.</p>';
  }

  let totalCartas = 0;
  let aliados = 0;
  let talismanes = 0;
  let oros = 0;
  let otros = 0;

  const fragmento = document.createDocumentFragment();

  mazoActual.forEach(item => {
    totalCartas += item.cantidad;
    if (item.tipo === 'Aliado') aliados += item.cantidad;
    else if (item.tipo === 'Talismán') talismanes += item.cantidad;
    else if (item.tipo === 'Oro') oros += item.cantidad;
    else otros += item.cantidad;

    const div = document.createElement('div');
    div.classList.add('mazo-item-fila');

    div.innerHTML = `
      <div class="mazo-item-nombre">
        <span>${sanitizarHTML(item.nombre_carta)}</span>
        <small>${sanitizarHTML(item.tipo)}</small>
      </div>
      <div class="mazo-item-controles">
        <button type="button" class="btn-cant" data-delta="-1">-</button>
        <span class="cant-badge">${item.cantidad}</span>
        <button type="button" class="btn-cant" data-delta="1">+</button>
      </div>
    `;

    const btnRestar = div.querySelector('[data-delta="-1"]');
    const btnSumar = div.querySelector('[data-delta="1"]');
    btnRestar.addEventListener('click', () => cambiarCantidadMazo(item.id_carta, -1));
    btnSumar.addEventListener('click', () => cambiarCantidadMazo(item.id_carta, 1));
    fragmento.appendChild(div);
  });

  contenedor.appendChild(fragmento);

  const elTotal = document.getElementById('total-cartas-mazo');
  const elAliados = document.getElementById('cant-aliados');
  const elTalismanes = document.getElementById('cant-talismanes');
  const elOros = document.getElementById('cant-oros');
  const elOtros = document.getElementById('cant-otros');

  if (elTotal) elTotal.textContent = totalCartas;
  if (elAliados) elAliados.textContent = aliados;
  if (elTalismanes) elTalismanes.textContent = talismanes;
  if (elOros) elOros.textContent = oros;
  if (elOtros) elOtros.textContent = otros;
}

function configurarAccionesMazo() {
  const btnVaciar = document.getElementById('btn-vaciar-mazo');
  const btnGuardar = document.getElementById('btn-guardar-mazo');
  const inputNombreMazo = document.getElementById('nombre-mazo');
  const inputDescripcion = document.getElementById('descripcion-mazo');
  const chkPublico = document.getElementById('chk-es-publico');

  if (btnVaciar) {
    btnVaciar.onclick = () => {
      if (mazoActual.length === 0) return;
      if (confirm('¿Deseas vaciar todas las cartas de este mazo?')) {
        mazoActual = [];
        actualizarVistaMazo();
      }
    };
  }

  if (btnGuardar) {
    btnGuardar.onclick = async () => {
      const totalCartas = mazoActual.reduce((acc, i) => acc + i.cantidad, 0);
      if (totalCartas !== 50) {
        alert(`Tu mazo debe tener exactamente 50 cartas reglamentarias para poder guardarse.\nActualmente tienes ${totalCartas} cartas.`);
        return;
      }

      const nombreIngresado = inputNombreMazo ? inputNombreMazo.value.trim() : '';
      if (!nombreIngresado) {
        alert('Por favor, ingresa un nombre para tu mazo.');
        if (inputNombreMazo) inputNombreMazo.focus();
        return;
      }

      const idUsuarioSession = localStorage.getItem('id_usuario');
      if (!idUsuarioSession) {
        alert('Debes iniciar sesión para guardar un mazo.');
        const btnLogin = document.getElementById('btn-abrir-login');
        if (btnLogin) btnLogin.click();
        return;
      }

      const datosMazo = {
        nombre_mazo: nombreIngresado,
        descripcion: inputDescripcion ? inputDescripcion.value.trim() : '',
        es_publico: chkPublico ? (chkPublico.checked ? 1 : 0) : 1,
        id_usuario: Number(idUsuarioSession),
        cartas: mazoActual.map(item => ({
          id_carta: item.id_carta,
          cantidad: item.cantidad
        }))
      };

      try {
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        const resultado = await guardarMazoAPI(datosMazo);

        if (resultado && resultado.exito) {
          alert(`¡Mazo "${datosMazo.nombre_mazo}" guardado exitosamente!`);
          mazoActual = [];
          if (inputNombreMazo) inputNombreMazo.value = 'Mi Nuevo Mazo';
          if (inputDescripcion) inputDescripcion.value = '';
          actualizarVistaMazo();
          mostrarSubvistaMazos('mis-mazos');
        } else {
          alert('Error al guardar: ' + (resultado.mensaje || 'Respuesta no válida del servidor.'));
        }
      } catch (error) {
        console.error('Error al conectar con la API:', error);
        alert('No se pudo establecer conexión con el servidor.');
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Mazo';
      }
    };
  }
}

async function abrirModalDetalleMazo(idMazo) {
  const modal = document.getElementById('modal-detalle-mazo');
  const modalNombre = document.getElementById('modal-mazo-nombre');
  const modalAutor = document.getElementById('modal-mazo-autor');
  const modalDesc = document.getElementById('modal-mazo-descripcion');
  const modalResumen = document.getElementById('modal-mazo-resumen');
  const gridCartas = document.getElementById('modal-mazo-grid-cartas');
  const btnModalFav = document.getElementById('btn-modal-toggle-fav');

  if (!modal) return;
  mazoDetalleActivoId = Number(idMazo);
  modal.classList.add('active');
  if (gridCartas) gridCartas.innerHTML = '<p class="empty-deck-msg">Cargando cartas del mazo...</p>';

  actualizarBotonFavoritoModal(idMazo);

  if (btnModalFav) {
    btnModalFav.onclick = async () => {
      await manejarToggleFavorito(mazoDetalleActivoId);
    };
  }

  const res = await obtenerMazoPorIdAPI(idMazo);

  if (res && res.cartas && Array.isArray(res.cartas)) {
    if (modalNombre) modalNombre.textContent = res.nombre_mazo;
    if (modalAutor) modalAutor.textContent = `Por: ${res.nombre_usuario || 'Comunidad'}`;
    if (modalDesc) modalDesc.textContent = res.descripcion_mazo || res.descripcion || 'Sin descripción.';

    const aliados = res.cartas.filter(c => c.tipo === 'Aliado').reduce((acc, c) => acc + Number(c.cantidad), 0);
    const talismanes = res.cartas.filter(c => c.tipo === 'Talismán').reduce((acc, c) => acc + Number(c.cantidad), 0);
    const oros = res.cartas.filter(c => c.tipo === 'Oro').reduce((acc, c) => acc + Number(c.cantidad), 0);
    const otros = res.cartas.filter(c => !['Aliado', 'Talismán', 'Oro'].includes(c.tipo)).reduce((acc, c) => acc + Number(c.cantidad), 0);

    if (modalResumen) {
      modalResumen.innerHTML = `
        <span>Aliados: <strong>${aliados}</strong></span>
        <span>Talismanes: <strong>${talismanes}</strong></span>
        <span>Oros: <strong>${oros}</strong></span>
        <span>Otros: <strong>${otros}</strong></span>
      `;
    }

    if (gridCartas) {
      gridCartas.innerHTML = '';
      const fragmento = document.createDocumentFragment();
      const baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

      res.cartas.forEach(carta => {
        const item = document.createElement('div');
        item.classList.add('carta-deck-detalle-item');
        const imgUrl = carta.imagen_url ? `${baseUrl}${carta.imagen_url}` : 'placeholder.png';
        const raza = carta.raza ? ` - ${sanitizarHTML(carta.raza)}` : '';

        item.innerHTML = `
          <div class="carta-deck-detalle-img-wrapper">
            <img src="${imgUrl}" alt="${sanitizarHTML(carta.nombre_carta)}" loading="lazy">
            <span class="badge-copias">x${carta.cantidad}</span>
          </div>
          <h4>${sanitizarHTML(carta.nombre_carta)}</h4>
          <p><small>${sanitizarHTML(carta.tipo)}${raza}</small></p>
        `;

        item.onclick = () => {
          if (typeof abrirModalCarta === 'function') {
            abrirModalCarta(carta);
          }
        };

        fragmento.appendChild(item);
      });

      gridCartas.appendChild(fragmento);
    }
  } else {
    if (gridCartas) gridCartas.innerHTML = '<p class="empty-deck-msg">No se pudieron cargar las cartas de este mazo.</p>';
  }
}

function configurarModalDetalleMazo() {
  const modal = document.getElementById('modal-detalle-mazo');
  const btnCerrar = document.getElementById('btn-cerrar-modal-mazo');

  if (btnCerrar && modal) {
    btnCerrar.onclick = () => {
      modal.classList.remove('active');
      mazoDetalleActivoId = null;
    };
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        mazoDetalleActivoId = null;
      }
    });
  }
}
