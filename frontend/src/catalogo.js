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
    card.classList.add('tarjeta-carta');
    
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
 * Abre el modal con los detalles completos de la carta.
 */
async function abrirModalCarta(carta) {
  const modal = document.getElementById('modal-carta');
  if (!modal) return;

  // Llenar la imagen y el título
  const img = document.getElementById('modal-img');
  const nombre = document.getElementById('modal-nombre');
  const tipoRaza = document.getElementById('modal-tipo-raza');
  const stats = document.getElementById('modal-stats');
  const elVisitas = document.getElementById('modal-carta-visitas');
  const elEnMazos = document.getElementById('modal-carta-en-mazos');

  if (img) img.src = `${API_URL}${carta.imagen_url}`;
  if (nombre) nombre.textContent = carta.nombre_carta;
  
  if (tipoRaza) {
    tipoRaza.textContent = `${carta.tipo} ${carta.raza ? '• ' + carta.raza : ''}`;
  }

  // Llenar coste y fuerza en el contenedor de estadísticas
  if (stats) {
    const partesStats = [];
    if (carta.coste !== null && carta.coste !== undefined) {
      partesStats.push(
        '<div class="stat-atributo-item stat-coste">' +
          '<span class="stat-atributo-icono">🪙</span>' +
          '<div class="stat-atributo-info">' +
            '<span class="stat-atributo-label">Coste</span>' +
            '<span class="stat-atributo-valor">' + carta.coste + '</span>' +
          '</div>' +
        '</div>'
      );
    }
    if (carta.fuerza !== null && carta.fuerza !== undefined) {
      partesStats.push(
        '<div class="stat-atributo-item stat-fuerza">' +
          '<span class="stat-atributo-icono">⚔️</span>' +
          '<div class="stat-atributo-info">' +
            '<span class="stat-atributo-label">Fuerza</span>' +
            '<span class="stat-atributo-valor">' + carta.fuerza + '</span>' +
          '</div>' +
        '</div>'
      );
    }
    if (partesStats.length !== 0) {
      stats.style.display = "grid";
      stats.innerHTML = partesStats.join("");
    } else {
      stats.style.display = "block";
      stats.innerHTML = '<span class="sin-atributos-texto">Sin atributos de combate</span>';
    }
  }
  if (elVisitas) elVisitas.textContent = '...';
  if (elEnMazos) elEnMazos.textContent = '...';

  modal.classList.add('active');

  if (carta.id_carta) {
    try {
      const resMetricas = await registrarVistaCartaAPI(carta.id_carta);
      if (resMetricas && resMetricas.exito) {
        if (elVisitas) elVisitas.textContent = Number(resMetricas.visitas).toLocaleString();
        if (elEnMazos) elEnMazos.textContent = Number(resMetricas.total_en_mazos).toLocaleString();
      } else {
        if (elVisitas) elVisitas.textContent = '-';
        if (elEnMazos) elEnMazos.textContent = '-';
      }
    } catch (err) {
      console.error('Error al actualizar metricas de carta en modal:', err);
      if (elVisitas) elVisitas.textContent = '-';
      if (elEnMazos) elEnMazos.textContent = '-';
    }
  }
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