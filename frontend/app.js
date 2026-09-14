const API_URL = 'http://localhost:3000';
let cartasCargadas = false;
let listaCartas = []; // Guarda las 66 cartas originales obtenidas de la API

function inicializarNavegacion() {
  const navLinks = document.querySelectorAll('.nav-link, .nav-btn');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');

      if (!targetId) return;

      document.querySelectorAll('.vista').forEach(vista => {
        vista.classList.remove('active');
      });

      const vistaDestino = document.getElementById(targetId);
      if (vistaDestino) {
        vistaDestino.classList.add('active');
      }

      document.querySelectorAll('.nav-link').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-target') === targetId) {
          nav.classList.add('active');
        }
      });

      if (targetId === 'vista-cartas' && !cartasCargadas) {
        cargarCartas();
      }
    });
  });
}

// OBTENER Y RENDERIZAR CARTAS
async function cargarCartas() {
  const catalogoContainer = document.getElementById('catalogo');
  catalogoContainer.innerHTML = '<p>Cargando catálogo de cartas...</p>';

  try {
    const respuesta = await fetch(`${API_URL}/api/cartas`);
    const resultado = await respuesta.json();

    if (resultado.exito) {
      cartasCargadas = true;
      listaCartas = resultado.datos; // Guardar la lista completa
      
      renderizarCartas(listaCartas);
      inicializarFiltros();
    } else {
      catalogoContainer.innerHTML = '<p>Error al obtener las cartas.</p>';
    }
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    catalogoContainer.innerHTML = '<p>No se pudo conectar con el servidor.</p>';
  }
}

// FUNCIÓN PARA MOSTRAR LAS CARTAS EN PANTALLA
function renderizarCartas(cartas) {
  const catalogoContainer = document.getElementById('catalogo');
  catalogoContainer.innerHTML = '';

  if (cartas.length === 0) {
    catalogoContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No se encontraron cartas que coincidan con los filtros.</p>';
    return;
  }

  cartas.forEach(carta => {
    const cartaElemento = document.createElement('div');
    cartaElemento.classList.add('carta-card');
    cartaElemento.style.cursor = 'pointer';

    const razaHTML = (carta.raza !== undefined && carta.raza !== null)
      ? `<p><strong>Raza:</strong> ${carta.raza}</p>`
      : '';

    const tieneCoste = carta.coste !== undefined && carta.coste !== null;
    const tieneFuerza = carta.fuerza !== undefined && carta.fuerza !== null;

    let statsHTML = '';
    if (tieneCoste && tieneFuerza) {
      statsHTML = `<p><strong>Coste:</strong> ${carta.coste} | <strong>Fuerza:</strong> ${carta.fuerza}</p>`;
    } else if (tieneCoste) {
      statsHTML = `<p><strong>Coste:</strong> ${carta.coste}</p>`;
    } else if (tieneFuerza) {
      statsHTML = `<p><strong>Fuerza:</strong> ${carta.fuerza}</p>`;
    }

    cartaElemento.innerHTML = `
      <img src="${API_URL}${carta.imagen_url}" alt="${carta.nombre_carta}" loading="lazy">
      <h3>${carta.nombre_carta}</h3>
      <p><strong>Tipo:</strong> ${carta.tipo}</p>
      ${razaHTML}
      ${statsHTML}
    `;

    cartaElemento.addEventListener('click', () => abrirModalCarta(carta));
    catalogoContainer.appendChild(cartaElemento);
  });
}

// LÓGICA DE FILTRADO REUTILIZABLE
function aplicarFiltros() {
  const textoNombre = document.getElementById('filtro-nombre').value.toLowerCase().trim();
  const tipoSeleccionado = document.getElementById('filtro-tipo').value;
  const razaSeleccionada = document.getElementById('filtro-raza').value;
  const costeSeleccionado = document.getElementById('filtro-coste').value;
  const fuerzaSeleccionada = document.getElementById('filtro-fuerza').value;

  const cartasFiltradas = listaCartas.filter(carta => {
    // Normalizar nombre (ignorar acentos)
    const nombreNormalizado = carta.nombre_carta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const busquedaNormalizada = textoNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const coincideNombre = nombreNormalizado.includes(busquedaNormalizada);
    const coincideTipo = tipoSeleccionado === '' || carta.tipo === tipoSeleccionado;
    const coincideRaza = razaSeleccionada === '' || carta.raza === razaSeleccionada;
    
    // Verificación exacta de Coste y Fuerza (convirtiendo a String para comparar con el select)
    const coincideCoste = costeSeleccionado === '' || (carta.coste !== null && String(carta.coste) === costeSeleccionado);
    const coincideFuerza = fuerzaSeleccionada === '' || (carta.fuerza !== null && String(carta.fuerza) === fuerzaSeleccionada);

    return coincideNombre && coincideTipo && coincideRaza && coincideCoste && coincideFuerza;
  });

  renderizarCartas(cartasFiltradas);
}

function inicializarFiltros() {
  const inputNombre = document.getElementById('filtro-nombre');
  const selectTipo = document.getElementById('filtro-tipo');
  const selectRaza = document.getElementById('filtro-raza');
  const selectCoste = document.getElementById('filtro-coste');
  const selectFuerza = document.getElementById('filtro-fuerza');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');

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
    renderizarCartas(listaCartas);
  });
}

// MODAL CARTA
function abrirModalCarta(carta) {
  const modal = document.getElementById('modal-carta');
  
  document.getElementById('modal-img').src = `${API_URL}${carta.imagen_url}`;
  document.getElementById('modal-nombre').textContent = carta.nombre_carta;

  let tipoRazaTexto = carta.tipo;
  if (carta.raza) {
    tipoRazaTexto += ` - ${carta.raza}`;
  }
  document.getElementById('modal-tipo-raza').textContent = tipoRazaTexto;

  const modalStats = document.getElementById('modal-stats');
  const tieneCoste = carta.coste !== undefined && carta.coste !== null;
  const tieneFuerza = carta.fuerza !== undefined && carta.fuerza !== null;

  if (tieneCoste || tieneFuerza) {
    modalStats.style.display = 'block';
    let partesStats = [];
    if (tieneCoste) partesStats.push(`<strong>Coste:</strong> ${carta.coste}`);
    if (tieneFuerza) partesStats.push(`<strong>Fuerza:</strong> ${carta.fuerza}`);
    modalStats.innerHTML = partesStats.join(' &nbsp;|&nbsp; ');
  } else {
    modalStats.style.display = 'none';
  }

  modal.classList.add('active');
}

function inicializarModal() {
  const modal = document.getElementById('modal-carta');
  const btnCerrar = document.getElementById('btn-cerrar-modal');

  btnCerrar.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarNavegacion();
  inicializarModal();
});