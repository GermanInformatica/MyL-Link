// Estado local del módulo de mazos y constructor
let todasLasCartasMazos = [];
let mazoActual = [];

/**
 * Sanitiza cadenas de texto para prevenir vulnerabilidades XSS en la inyección de HTML.
 */
function sanitizarHTML(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inicializa la sección del constructor de mazos, gestión de vistas y galería pública.
 */
function inicializarMazos(cartas) {
  todasLasCartasMazos = Array.isArray(cartas) ? cartas : [];
  renderizarCatalogoDeckbuilder(todasLasCartasMazos);
  configurarFiltrosDeckbuilder();
  configurarAccionesMazo();
  configurarNavegacionSubvistasMazos();
  actualizarVistaMazo();
  cargarGaleriaMazos();
  configurarModalDetalleMazo();
}

/**
 * Consulta la API REST para obtener los mazos públicos y los renderiza en la galería.
 */
async function cargarGaleriaMazos() {
  const contenedor = document.getElementById('grid-mazos-comunidad') || document.getElementById('galeria-mazos-lista') || document.getElementById('contenedor-mazos-galeria');
  if (!contenedor) return;

  try {
    const urlApi = typeof API_URL !== 'undefined' ? `${API_URL}/api/mazos` : '/api/mazos';
    const respuesta = await fetch(urlApi);
    
    if (!respuesta.ok) throw new Error(`Error HTTP status: ${respuesta.status}`);

    const resultado = await respuesta.json();

    if (resultado.exito) {
      renderizarGaleriaMazos(resultado.datos);
    } else {
      contenedor.innerHTML = `<p class="empty-deck-msg">${sanitizarHTML(resultado.mensaje || 'No se pudieron cargar los mazos públicos.')}</p>`;
    }
  } catch (error) {
    console.error('Error al cargar la galería de mazos:', error);
    contenedor.innerHTML = '<p class="empty-deck-msg">Error de conexión al cargar la galería de mazos.</p>';
  }
}

/**
 * Renderiza los elementos HTML de cada mazo público en el contenedor de la galería.
 */
function renderizarGaleriaMazos(mazos) {
  const contenedor = document.getElementById('grid-mazos-comunidad') || document.getElementById('galeria-mazos-lista') || document.getElementById('contenedor-mazos-galeria');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  if (!mazos || mazos.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">No hay mazos públicos disponibles aún.</p>';
    return;
  }

  const fragmento = document.createDocumentFragment();

  mazos.forEach(mazo => {
    const card = document.createElement('div');
    card.classList.add('mazo-card');

    const fechaCreacion = mazo.fecha_creacion 
      ? new Date(mazo.fecha_creacion).toLocaleDateString() 
      : '';

    const nombreMazo = sanitizarHTML(mazo.nombre_mazo);
    const nombreUsuario = sanitizarHTML(mazo.nombre_usuario || 'Anónimo');
    const descripcion = sanitizarHTML(mazo.descripcion || 'Sin descripción.');

    card.innerHTML = `
      <div class="mazo-card-header">
        <h3>${nombreMazo}</h3>
        <span class="mazo-autor">Por: ${nombreUsuario}</span>
      </div>
      <div class="mazo-card-body">
        <p>${descripcion}</p>
        <div class="mazo-card-footer">
          <small>${fechaCreacion}</small>
          <button class="btn-primary btn-ver-mazo-detalle" data-id="${mazo.id_mazo}">Ver Mazo &rarr;</button>
        </div>
      </div>
    `;

    const btnVerMazo = card.querySelector('.btn-ver-mazo-detalle');
    if (btnVerMazo) {
      btnVerMazo.onclick = (e) => {
        e.stopPropagation();
        abrirModalDetalleMazo(mazo.id_mazo);
      };
    }
    card.onclick = () => abrirModalDetalleMazo(mazo.id_mazo);

    fragmento.appendChild(card);
  });

  contenedor.appendChild(fragmento);
}

/**
 * Maneja la alternancia entre la Galería de Mazos y el Constructor de Mazos.
 */
function configurarNavegacionSubvistasMazos() {
  const galeria = document.getElementById('subvista-galeria-mazos');
  const constructor = document.getElementById('subvista-constructor-mazo');
  const btnCrear = document.getElementById('btn-ir-crear-mazo');
  const btnVolver = document.getElementById('btn-volver-galeria');

  if (btnCrear && galeria && constructor) {
    btnCrear.onclick = () => {
      const idUsuario = localStorage.getItem('id_usuario');
      if (!idUsuario) {
        alert('Debes iniciar sesión para crear y guardar tus propios mazos.');
        return;
      }
      galeria.style.display = 'none';
      constructor.style.display = 'block';
    };
  }

  if (btnVolver && galeria && constructor) {
    btnVolver.onclick = () => {
      constructor.style.display = 'none';
      galeria.style.display = 'block';
      cargarGaleriaMazos();
    };
  }
}

/**
 * Configura los eventos de filtrado en el panel izquierdo del deckbuilder.
 */
function configurarFiltrosDeckbuilder() {
  const inputNombre = document.getElementById('deck-filtro-nombre');
  const selectTipo = document.getElementById('deck-filtro-tipo');
  const selectRaza = document.getElementById('deck-filtro-raza');
  const selectCoste = document.getElementById('deck-filtro-coste');
  const selectFuerza = document.getElementById('deck-filtro-fuerza');
  const btnLimpiar = document.getElementById('deck-btn-limpiar-filtros');

  if (!inputNombre) return;

  const aplicarFiltrosDeck = () => {
    const textoNombre = inputNombre.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const tipoSeleccionado = selectTipo ? selectTipo.value : '';
    const razaSeleccionada = selectRaza ? selectRaza.value : '';
    const costeSeleccionado = selectCoste ? selectCoste.value : '';
    const fuerzaSeleccionada = selectFuerza ? selectFuerza.value : '';

    const filtradas = todasLasCartasMazos.filter(carta => {
      const nombreNorm = (carta.nombre_carta || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

/**
 * Renderiza el catálogo de cartas en el panel izquierdo usando DocumentFragment.
 */
function renderizarCatalogoDeckbuilder(cartas) {
  const contenedor = document.getElementById('deck-catalogo-lista');
  if (!contenedor) return;
  
  contenedor.innerHTML = '';

  if (!cartas || cartas.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">No hay cartas que coincidan.</p>';
    return;
  }

  const fragmento = document.createDocumentFragment();
  const baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

  cartas.forEach(carta => {
    const card = document.createElement('div');
    card.classList.add('carta-card');

    const nombre = sanitizarHTML(carta.nombre_carta);
    const tipo = sanitizarHTML(carta.tipo);
    const raza = carta.raza ? ` - ${sanitizarHTML(carta.raza)}` : '';
    const imgUrl = carta.imagen_url ? `${baseUrl}${carta.imagen_url}` : 'placeholder.png';

    card.innerHTML = `
      <img src="${imgUrl}" alt="${nombre}" loading="lazy">
      <h3>${nombre}</h3>
      <p><small>${tipo}${raza}</small></p>
    `;

    card.addEventListener('click', () => agregarCartaAlMazo(carta));
    fragmento.appendChild(card);
  });

  contenedor.appendChild(fragmento);
}

/**
 * Añade una carta al mazo validando topes (máx 3 copias y 50 cartas total).
 */
function agregarCartaAlMazo(carta) {
  const totalCartas = mazoActual.reduce((acc, item) => acc + item.cantidad, 0);

  if (totalCartas >= 50) {
    alert('Has alcanzado el límite máximo de 50 cartas para tu mazo.');
    return;
  }

  const existe = mazoActual.find(item => item.id_carta === carta.id_carta);

  if (existe) {
    if (existe.cantidad < 3) {
      existe.cantidad++;
    } else {
      alert('Solo puedes incluir hasta 3 copias de la misma carta en el mazo.');
      return;
    }
  } else {
    mazoActual.push({ ...carta, cantidad: 1 });
  }

  actualizarVistaMazo();
}

/**
 * Modifica la cantidad de copias de una carta (+1 / -1).
 */
function cambiarCantidadMazo(id_carta, delta) {
  const item = mazoActual.find(i => i.id_carta === id_carta);
  if (!item) return;

  const totalCartas = mazoActual.reduce((acc, i) => acc + i.cantidad, 0);

  if (delta > 0 && totalCartas >= 50) {
    alert('Has alcanzado el límite máximo de 50 cartas para tu mazo.');
    return;
  }

  if (delta > 0 && item.cantidad >= 3) {
    alert('Solo puedes incluir hasta 3 copias de la misma carta en el mazo.');
    return;
  }

  item.cantidad += delta;

  if (item.cantidad <= 0) {
    mazoActual = mazoActual.filter(i => i.id_carta !== id_carta);
  }

  actualizarVistaMazo();
}

/**
 * Actualiza la lista visible del mazo y calcula contadores por tipo.
 */
function actualizarVistaMazo() {
  const contenedor = document.getElementById('lista-cartas-mazo');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  if (mazoActual.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">Tu mazo está vacío. Haz clic en las cartas del catálogo para agregarlas.</p>';
  }

  let totalCartas = 0;
  let aliados = 0, talismanes = 0, oros = 0, otros = 0;

  const fragmento = document.createDocumentFragment();

  mazoActual.forEach(item => {
    totalCartas += item.cantidad;

    const tipoNorm = (item.tipo || '').toLowerCase();
    if (tipoNorm === 'aliado') aliados += item.cantidad;
    else if (tipoNorm === 'talismán' || tipoNorm === 'talisman') talismanes += item.cantidad;
    else if (tipoNorm === 'oro') oros += item.cantidad;
    else otros += item.cantidad;

    const div = document.createElement('div');
    div.classList.add('item-carta-mazo');

    const nombre = sanitizarHTML(item.nombre_carta);
    const tipo = sanitizarHTML(item.tipo);

    div.innerHTML = `
      <div class="item-carta-info">
        <strong>${nombre}</strong>
        <small>${tipo}</small>
      </div>
      <div class="item-carta-controles">
        <button type="button" class="btn-cant" data-delta="-1">-</button>
        <span>${item.cantidad}</span>
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

/**
 * Configura las acciones globales del mazo (Vaciar y Guardar).
 */
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

        const urlApi = typeof API_URL !== 'undefined' ? `${API_URL}/api/mazos` : '/api/mazos';

        const respuesta = await fetch(urlApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosMazo)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.exito) {
          alert(`¡Mazo "${datosMazo.nombre_mazo}" guardado exitosamente!`);
          mazoActual = [];
          if (inputNombreMazo) inputNombreMazo.value = '';
          if (inputDescripcion) inputDescripcion.value = '';
          actualizarVistaMazo();

          cargarGaleriaMazos();
          const galeria = document.getElementById('subvista-galeria-mazos');
          const constructor = document.getElementById('subvista-constructor-mazo');
          if (galeria && constructor) {
            constructor.style.display = 'none';
            galeria.style.display = 'block';
          }
        } else {
          alert('Error al guardar: ' + (resultado.mensaje || 'Respuesta no válida del servidor.'));
        }
      } catch (error) {
        console.error('Error al conectar con la API:', error);
        alert('No se pudo establecer conexión con el servidor Node.js.');
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Mazo';
      }
    };
  }
}

/**
 * Abre el modal visor de cartas para un mazo específico.
 */
async function abrirModalDetalleMazo(idMazo) {
  const modal = document.getElementById('modal-detalle-mazo');
  const modalNombre = document.getElementById('modal-mazo-nombre');
  const modalAutor = document.getElementById('modal-mazo-autor');
  const modalDesc = document.getElementById('modal-mazo-descripcion');
  const modalResumen = document.getElementById('modal-mazo-resumen');
  const gridCartas = document.getElementById('modal-mazo-grid-cartas');

  if (!modal) return;

  modal.classList.add('active');
  if (gridCartas) gridCartas.innerHTML = '<p class="empty-deck-msg">Cargando cartas del mazo...</p>';

  const res = await obtenerMazoPorIdAPI(idMazo);

  if (res && res.cartas && Array.isArray(res.cartas)) {
    if (modalNombre) modalNombre.textContent = res.nombre_mazo;
    if (modalAutor) modalAutor.textContent = `Por: ${res.nombre_usuario || 'Anónimo'}`;
    if (modalDesc) modalDesc.textContent = res.descripcion_mazo || res.descripcion || 'Sin descripción.';

    // Conteo por tipo de carta
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

/**
 * Configura los eventos de cierre para el modal de detalle del mazo.
 */
function configurarModalDetalleMazo() {
  const modal = document.getElementById('modal-detalle-mazo');
  const btnCerrar = document.getElementById('btn-cerrar-modal-mazo');

  if (btnCerrar && modal) {
    btnCerrar.onclick = () => modal.classList.remove('active');
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}