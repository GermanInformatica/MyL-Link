// Variable local para almacenar la lista original de cartas
let cartasCatalogo = [];

/**
 * Inicializa el catálogo con los datos de las cartas y configura los eventos de filtro y modal.
 */
function inicializarCatalogo(cartas) {
  cartasCatalogo = cartas;
  renderizarCartas(cartasCatalogo);
  configurarFiltrosCatalogo();
  configurarModal();
}

/**
 * Renderiza la grilla de cartas en el contenedor del catálogo.
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
    
    // Formatear la visualización de Coste y Fuerza
    const costeTexto = carta.coste !== null && carta.coste !== undefined ? `Coste: ${carta.coste}` : '';
    const fuerzaTexto = carta.fuerza !== null && carta.fuerza !== undefined ? `Fuerza: ${carta.fuerza}` : '';
    
    // Crear el bloque de estadísticas si la carta tiene coste o fuerza
    const statsHTML = (costeTexto || fuerzaTexto) 
      ? `<div class="carta-stats-badget">
           ${costeTexto ? `<span>${costeTexto}</span>` : ''}
           ${fuerzaTexto ? `<span>${fuerzaTexto}</span>` : ''}
         </div>`
      : '';

    card.innerHTML = `
      <img src="${API_URL}${carta.imagen_url}" alt="${carta.nombre_carta}">
      <h3>${carta.nombre_carta}</h3>
      <p><small>${carta.tipo} ${carta.raza ? '• ' + carta.raza : ''}</small></p>
      ${statsHTML}
    `;

    // Evento para abrir el modal con los detalles de la carta
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

function abrirModalCarta(carta) {
  const modal = document.getElementById('modal-carta');
  const imgModal = document.getElementById('modal-img');
  const nombreModal = document.getElementById('modal-nombre');
  const tipoRazaModal = document.getElementById('modal-tipo-raza');
  const statsModal = document.getElementById('modal-stats');

  if (!modal) return;

  imgModal.src = `${API_URL}${carta.imagen_url}`;
  imgModal.alt = carta.nombre_carta;
  nombreModal.textContent = carta.nombre_carta;
  tipoRazaModal.textContent = `${carta.tipo} ${carta.raza ? '• ' + carta.raza : ''}`;
  
  statsModal.innerHTML = `
    ${carta.coste !== null ? `<p><strong>Coste:</strong> ${carta.coste}</p>` : ''}
    ${carta.fuerza !== null ? `<p><strong>Fuerza:</strong> ${carta.fuerza}</p>` : ''}
  `;

  modal.style.display = 'block';
}