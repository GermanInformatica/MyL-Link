// Estado local del constructor de mazos
let todasLasCartasMazos = [];
let mazoActual = [];

/**
 * Inicializa la sección del constructor de mazos.
 */
function inicializarMazos(cartas) {
  todasLasCartasMazos = cartas;
  renderizarCatalogoDeckbuilder(todasLasCartasMazos);
  configurarFiltrosDeckbuilder();
  configurarAccionesMazo();
  actualizarVistaMazo();
}

/**
 * Configura los eventos de búsqueda rápida en el panel izquierdo del deckbuilder.
 */
function configurarFiltrosDeckbuilder() {
  const inputNombre = document.getElementById('deck-filtro-nombre');
  const selectTipo = document.getElementById('deck-filtro-tipo');

  if (!inputNombre || !selectTipo) return;

  const filtrarCatalogoDeck = () => {
    const busqueda = inputNombre.value.toLowerCase().trim();
    const tipo = selectTipo.value;

    const filtradas = todasLasCartasMazos.filter(carta => {
      const coincideNombre = carta.nombre_carta.toLowerCase().includes(busqueda);
      const coincideTipo = tipo === '' || carta.tipo === tipo;
      return coincideNombre && coincideTipo;
    });

    renderizarCatalogoDeckbuilder(filtradas);
  };

  inputNombre.addEventListener('input', filtrarCatalogoDeck);
  selectTipo.addEventListener('change', filtrarCatalogoDeck);
}

/**
 * Renderiza el mini-catálogo en el panel izquierdo del Deckbuilder.
 */
function renderizarCatalogoDeckbuilder(cartas) {
  const contenedor = document.getElementById('deck-catalogo-lista');
  if (!contenedor) return;
  
  contenedor.innerHTML = '';

  if (cartas.length === 0) {
    contenedor.innerHTML = '<p class="empty-deck-msg">No hay cartas que coincidan.</p>';
    return;
  }

  cartas.forEach(carta => {
    const card = document.createElement('div');
    card.classList.add('carta-card');
    card.innerHTML = `
      <img src="${API_URL}${carta.imagen_url}" alt="${carta.nombre_carta}">
      <h3>${carta.nombre_carta}</h3>
      <p><small>${carta.tipo}</small></p>
    `;

    // Hacer clic en una carta del catálogo la añade al mazo
    card.addEventListener('click', () => agregarCartaAlMazo(carta));
    contenedor.appendChild(card);
  });
}

/**
 * Añade una carta al mazo validando las reglas de Espada Sagrada (máx 3 copias y 50 cartas total).
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
    }
  } else {
    mazoActual.push({ ...carta, cantidad: 1 });
  }

  actualizarVistaMazo();
}

/**
 * Modifica la cantidad de copias de una carta en el mazo (+1 / -1).
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
 * Actualiza la lista visible del mazo y calcula los contadores por tipo de carta.
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

  mazoActual.forEach(item => {
    totalCartas += item.cantidad;

    if (item.tipo === 'Aliado') aliados += item.cantidad;
    else if (item.tipo === 'Talismán') talismanes += item.cantidad;
    else if (item.tipo === 'Oro') oros += item.cantidad;
    else otros += item.cantidad;

    const div = document.createElement('div');
    div.classList.add('item-carta-mazo');
    div.innerHTML = `
      <div class="item-carta-info">
        <strong>${item.nombre_carta}</strong>
        <small>${item.tipo}</small>
      </div>
      <div class="item-carta-controles">
        <button class="btn-cant" data-id="${item.id_carta}" data-delta="-1">-</button>
        <span>${item.cantidad}</span>
        <button class="btn-cant" data-id="${item.id_carta}" data-delta="1">+</button>
      </div>
    `;

    // Asignar eventos a los botones de + y -
    const btnRestar = div.querySelector('[data-delta="-1"]');
    const btnSumar = div.querySelector('[data-delta="1"]');

    btnRestar.addEventListener('click', () => cambiarCantidadMazo(item.id_carta, -1));
    btnSumar.addEventListener('click', () => cambiarCantidadMazo(item.id_carta, 1));

    contenedor.appendChild(div);
  });

  // Actualizar indicadores en el DOM
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

  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      if (mazoActual.length === 0) return;
      if (confirm('¿Deseas vaciar todas las cartas de este mazo?')) {
        mazoActual = [];
        actualizarVistaMazo();
      }
    });
  }

  if (btnGuardar) {
    btnGuardar.addEventListener('click', async () => {
      const totalCartas = mazoActual.reduce((acc, i) => acc + i.cantidad, 0);
      
      if (totalCartas === 0) {
        alert('El mazo está vacío. Añade cartas antes de guardar.');
        return;
      }

      const datosMazo = {
        nombre_mazo: inputNombreMazo ? inputNombreMazo.value.trim() : 'Mi Nuevo Mazo',
        cartas: mazoActual.map(item => ({
          id_carta: item.id_carta,
          cantidad: item.cantidad
        }))
      };

      console.log('Mazo listo para ser procesado:', datosMazo);
      alert(`¡Mazo "${datosMazo.nombre_mazo}" guardado temporalmente con ${totalCartas} cartas!`);
    });
  }
}