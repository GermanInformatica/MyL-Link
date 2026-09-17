// Variable local para almacenar la lista original de cartas
let cartasCatalogo = [];

/**
 * Inicializa el cat?logo con los datos de las cartas y configura los eventos de filtro y modal.
 */
function inicializarCatalogo(cartas) {
  cartasCatalogo = cartas;
  renderizarCartas(cartasCatalogo);
  configurarFiltrosCatalogo();
  configurarModal();
}

/**
 * Renderiza la grilla de cartas en el contenedor del cat?logo.
 */
function renderizarCartas(lista) {
  const contenedor = document.getElementById('catalogo');
  if (!contenedor) return;
  
  contenedor.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    contenedor.innerHTML = '<p class="sin-resultados">No se encontraron cartas que coincidan con los filtros.</p>';
    return;
  }

  lista.forEach(carta => {
    const card = document.createElement('div');
    card.classList.add('carta-card');
    
    // Construir la línea de Coste y Fuerza si existen
    const partesStats = [];
    if (carta.coste !== null && carta.coste !== undefined) {
      partesStats.push(`<strong>Coste:</strong> ${carta.coste}`);
    }
    if (carta.fuerza !== null && carta.fuerza !== undefined) {
      partesStats.push(`<strong>Fuerza:</strong> ${carta.fuerza}`);
    }

    const lineaStatsHTML = partesStats.length > 0 
      ? `<p class="carta-info-linea">${partesStats.join(' | ')}</p>` 
      : '';

    card.innerHTML = `
      <img src="${API_URL}${carta.imagen_url}" alt="${carta.nombre_carta}">
      <h3>${carta.nombre_carta}</h3>
      <div class="carta-detalles">
        <p><strong>Tipo:</strong> ${carta.tipo}</p>
        ${carta.raza ? `<p><strong>Raza:</strong> ${carta.raza}</p>` : ''}
        ${lineaStatsHTML}
      </div>
    `;

    card.addEventListener('click', () => abrirModalCarta(carta));
    contenedor.appendChild(card);
  });
}

/**
 * Configura los eventos de los selectores e input del panel de filtros.
 */
function configurarFiltrosCatalogo() {
  const inputNombre = document.getElementById('filtro-nombre');
  const selectTipo = document.getElementById('filtro-tipo');
  const selectRaza = document.getElementById('filtro-raza');
  const selectCoste = document.getElementById('filtro-coste');
  const selectFuerza = document.getElementById('filtro-fuerza');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');

  if (!inputNombre) return;

  const aplicarFiltros = () => {
    const textoNombre = inputNombre.value.toLowerCase().trim();
    const tipoSeleccionado = selectTipo.value;
    const razaSeleccionada = selectRaza.value;
    const costeSeleccionado = selectCoste.value;
    const fuerzaSeleccionada = selectFuerza.value;

    const filtradas = cartasCatalogo.filter(carta => {
      // Normalizar nombre (quitar acentos)
      const nombreNorm = carta.nombre_carta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const busquedaNorm = textoNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const coincideNombre = nombreNorm.includes(busquedaNorm);
      const coincideTipo = tipoSeleccionado === '' || carta.tipo === tipoSeleccionado;
      const coincideRaza = razaSeleccionada === '' || carta.raza === razaSeleccionada;
      const coincideCoste = costeSeleccionado === '' || (carta.coste !== null && String(carta.coste) === costeSeleccionado);
      const coincideFuerza = fuerzaSeleccionada === '' || (carta.fuerza !== null && String(carta.fuerza) === fuerzaSeleccionada);

      return coincideNombre && coincideTipo && coincideRaza && coincideCoste && coincideFuerza;
    });

    renderizarCartas(filtradas);
  };

  inputNombre.addEventListener('input', aplicarFiltros);
  selectTipo.addEventListener('change', aplicarFiltros);
  selectRaza.addEventListener('change', aplicarFiltros);
  selectCoste.addEventListener('change', aplicarFiltros);
  selectFuerza.addEventListener('change', aplicarFiltros);

  btnLimpiar.addEventListener('click', () => {
    inputNombre.value = '';
    selectTipo.value = '';
    selectRaza.value = '';
    selectCoste.value = '';
    selectFuerza.value = '';
    renderizarCartas(cartasCatalogo);
  });
}

/**
 * Lógica del Modal para ver el detalle ampliado de una carta.
 */
function configurarModal() {
  const modal = document.getElementById('modal-carta');
  const btnCerrar = document.getElementById('btn-cerrar-modal');

  if (!modal || !btnCerrar) return;

  btnCerrar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Abre el modal con los detalles completos de la carta.
 */
function abrirModalCarta(carta) {
  const modal = document.getElementById('modal-carta');
  if (!modal) return;

  // Llenar la imagen y el título
  const img = document.getElementById('modal-img');
  const nombre = document.getElementById('modal-nombre');
  const tipoRaza = document.getElementById('modal-tipo-raza');
  const stats = document.getElementById('modal-stats');

  if (img) img.src = `${API_URL}${carta.imagen_url}`;
  if (nombre) nombre.textContent = carta.nombre_carta;
  
  if (tipoRaza) {
    tipoRaza.textContent = `${carta.tipo} ${carta.raza ? '• ' + carta.raza : ''}`;
  }

  // Llenar coste y fuerza en el contenedor de estad?sticas
  if (stats) {
    const partesStats = [];
    if (carta.coste !== null && carta.coste !== undefined) {
      partesStats.push(`<strong>Coste:</strong> ${carta.coste}`);
    }
    if (carta.fuerza !== null && carta.fuerza !== undefined) {
      partesStats.push(`<strong>Fuerza:</strong> ${carta.fuerza}`);
    }
    
    stats.innerHTML = partesStats.length > 0 
      ? partesStats.join(' | ') 
      : '<em>Sin estad?sticas adicionales</em>';
  }

  // Activar la clase definida en tu CSS para aplicar display: flex y centrar
  modal.classList.add('active');
}

/**
 * Configura los eventos para cerrar el modal (clic en X o fuera de la caja).
 */
function configurarModal() {
  const modal = document.getElementById('modal-carta');
  const btnCerrar = document.getElementById('btn-cerrar-modal');

  if (!modal) return;

  const cerrar = () => {
    modal.classList.remove('active');
  };

  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrar);
  }

  // Cerrar si se hace clic fuera del contenido (en el fondo oscuro)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrar();
    }
  });
}