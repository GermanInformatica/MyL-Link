/**
 * Módulo del Panel de Control y Administración (Gesti?n de Usuarios, Cartas y Estad?sticas).
 */

function sanitizarTextoAdmin(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inicializa los eventos del panel de administración.
 */
function inicializarAdmin() {
  configurarNavegacionSubvistasAdmin();
  configurarFormularioNuevaCarta();
}

/**
 * Configura la alternancia entre el men? principal del admin y sus 3 subm?dulos.
 */
function configurarNavegacionSubvistasAdmin() {
  const menuPrincipal = document.getElementById('subvista-admin-menu');
  const vistaUsuarios = document.getElementById('subvista-admin-usuarios');
  const vistaCartas = document.getElementById('subvista-admin-cartas');
  const vistaStats = document.getElementById('subvista-admin-stats');

  const btnIrUsuarios = document.getElementById('btn-admin-ir-usuarios');
  const btnIrCartas = document.getElementById('btn-admin-ir-cartas');
  const btnIrStats = document.getElementById('btn-admin-ir-stats');
  const botonesVolver = document.querySelectorAll('.btn-admin-volver');

  function ocultarTodasLasSubvistas() {
    if (menuPrincipal) menuPrincipal.style.display = 'none';
    if (vistaUsuarios) vistaUsuarios.style.display = 'none';
    if (vistaCartas) vistaCartas.style.display = 'none';
    if (vistaStats) vistaStats.style.display = 'none';
  }

  function volverAlMenu() {
    ocultarTodasLasSubvistas();
    if (menuPrincipal) menuPrincipal.style.display = 'block';
  }

  // 1. Ir a Gesti?n de Usuarios
  if (btnIrUsuarios) {
    btnIrUsuarios.onclick = () => {
      ocultarTodasLasSubvistas();
      if (vistaUsuarios) vistaUsuarios.style.display = 'block';
      cargarUsuariosAdmin();
    };
  }

  // 2. Ir a Gesti?n de Cartas
  if (btnIrCartas) {
    btnIrCartas.onclick = () => {
      ocultarTodasLasSubvistas();
      if (vistaCartas) vistaCartas.style.display = 'block';
    };
  }

  // 3. Ir a Estad?sticas del Sistema
  if (btnIrStats) {
    btnIrStats.onclick = () => {
      ocultarTodasLasSubvistas();
      if (vistaStats) vistaStats.style.display = 'block';
      cargarEstadisticasAdmin();
    };
  }

  // 4. Botones Volver
  botonesVolver.forEach(btn => {
    btn.onclick = volverAlMenu;
  });
}

/**
 * Consulta la API y renderiza la tabla de usuarios registrados.
 */
async function cargarUsuariosAdmin() {
  const tbody = document.getElementById('tbody-admin-usuarios');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">Cargando usuarios desde MySQL...</td></tr>';

  const res = await obtenerUsuariosAdminAPI();

  if (res && res.exito && Array.isArray(res.datos)) {
    if (res.datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">No hay usuarios registrados.</td></tr>';
      return;
    }

    const fragmento = document.createDocumentFragment();

    res.datos.forEach(usuario => {
      const tr = document.createElement('tr');
      const fecha = usuario.fecha_registro ? new Date(usuario.fecha_registro).toLocaleDateString() : 'N/A';
      const rolClass = usuario.rol === 'ADMIN' ? 'badge-admin' : 'badge-user';
      const nombreLimpio = sanitizarTextoAdmin(usuario.nombre_usuario);

      const botonAccion = usuario.rol === 'ADMIN'
        ? '<span style="color: #666; font-size: 0.82rem;">(Admin)</span>'
        : `<button class="btn-danger-small btn-eliminar-usuario" data-id="${usuario.id_usuario}" data-nombre="${nombreLimpio}">🗑️ Eliminar</button>`;

      tr.innerHTML = `
        <td>#${usuario.id_usuario}</td>
        <td><strong>${nombreLimpio}</strong></td>
        <td>${sanitizarTextoAdmin(usuario.correo)}</td>
        <td><span class="badge ${rolClass}">${sanitizarTextoAdmin(usuario.rol)}</span></td>
        <td>${Number(usuario.total_mazos) || 0}</td>
        <td><small>${fecha}</small></td>
        <td>${botonAccion}</td>
      `;

      fragmento.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragmento);

    // Asignar eventos de eliminación a los botones
    tbody.querySelectorAll('.btn-eliminar-usuario').forEach(boton => {
      boton.onclick = async () => {
        const idUsuario = boton.getAttribute('data-id');
        const nombre = boton.getAttribute('data-nombre');

        const confirmacion = confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?\n\nAl eliminarlo, se borrarán automáticamente de la base de datos todos los mazos que haya creado.`);

        if (!confirmacion) return;

        try {
          boton.disabled = true;
          boton.textContent = 'Borrando...';

          const resultado = await eliminarUsuarioAdminAPI(idUsuario);

          if (resultado && resultado.exito) {
            alert(resultado.mensaje || `Usuario "${nombre}" eliminado con éxito.`);
            cargarUsuariosAdmin();
            // Actualizar la galería de mazos para reflejar los mazos eliminados
            if (typeof cargarGaleriaMazos === 'function') {
              cargarGaleriaMazos();
            }
          } else {
            alert('Error al eliminar: ' + (resultado.mensaje || 'No se pudo completar la operación.'));
            boton.disabled = false;
            boton.textContent = '🗑️ Eliminar';
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          alert('Error de conexión al intentar eliminar el usuario.');
          boton.disabled = false;
          boton.textContent = '🗑️ Eliminar';
        }
      };
    });

  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #e74c3c;">${sanitizarTextoAdmin(res.mensaje || 'Error al cargar los usuarios.')}</td></tr>`;
  }
}

/**
 * Consulta la API y actualiza las métricas y la tabla de cartas populares.
 */
async function cargarEstadisticasAdmin() {
  const statUsuarios = document.getElementById('stat-total-usuarios');
  const statMazos = document.getElementById('stat-total-mazos');
  const statPublicos = document.getElementById('stat-total-publicos');
  const statCartas = document.getElementById('stat-total-cartas');
  const tbodyTop = document.getElementById('tbody-admin-top-cartas');

  const res = await obtenerEstadisticasAdminAPI();

  if (res && res.exito && res.datos) {
    const { totalUsuarios, totalMazos, totalMazosPublicos, totalCartas, topCartas } = res.datos;

    if (statUsuarios) statUsuarios.textContent = totalUsuarios || 0;
    if (statMazos) statMazos.textContent = totalMazos || 0;
    if (statPublicos) statPublicos.textContent = totalMazosPublicos || 0;
    if (statCartas) statCartas.textContent = totalCartas || 0;

    if (tbodyTop) {
      tbodyTop.innerHTML = '';
      if (!topCartas || topCartas.length === 0) {
        tbodyTop.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">No hay datos de uso de cartas aún.</td></tr>';
      } else {
        const fragmento = document.createDocumentFragment();
        topCartas.forEach((c, index) => {
          const tr = document.createElement('tr');
          const medalla = index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `#${index + 1} `;
          tr.innerHTML = `
            <td><strong>${medalla}${sanitizarTextoAdmin(c.nombre_carta)}</strong></td>
            <td>${sanitizarTextoAdmin(c.tipo)}</td>
            <td>${c.raza ? sanitizarTextoAdmin(c.raza) : '-'}</td>
            <td><strong style="color: #e67e22;">${c.total_usadas}</strong> copias</td>
          `;
          fragmento.appendChild(tr);
        });
        tbodyTop.appendChild(fragmento);
      }
    }
  }
}

/**
 * Configura el formulario para añadir una nueva carta al cat?logo.
 */
function configurarFormularioNuevaCarta() {
  const form = document.getElementById('form-admin-nueva-carta');
  const inputNombre = document.getElementById('admin-carta-nombre');
  const selectTipo = document.getElementById('admin-carta-tipo');
  const selectRaza = document.getElementById('admin-carta-raza');
  const inputCoste = document.getElementById('admin-carta-coste');
  const inputFuerza = document.getElementById('admin-carta-fuerza');
  const inputImagen = document.getElementById('admin-carta-imagen');
  const alerta = document.getElementById('admin-carta-alerta');
  const btnSubmit = document.getElementById('btn-submit-admin-carta');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (alerta) {
      alerta.style.display = 'none';
      alerta.textContent = '';
    }

    const nombre = inputNombre ? inputNombre.value.trim() : '';
    const tipo = selectTipo ? selectTipo.value : '';
    const raza = selectRaza ? selectRaza.value : '';
    const coste = inputCoste ? inputCoste.value : '';
    const fuerza = inputFuerza ? inputFuerza.value : '';
    const imagen = inputImagen ? inputImagen.value.trim() : '';

    if (!nombre || !tipo) {
      if (alerta) {
        alerta.textContent = 'El nombre y el tipo de carta son obligatorios.';
        alerta.className = 'auth-alerta auth-alerta-error';
        alerta.style.display = 'block';
      }
      return;
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando carta...';
      }

      const res = await agregarCartaAdminAPI({
        nombre_carta: nombre,
        tipo: tipo,
        raza: raza || null,
        coste: coste !== '' ? Number(coste) : null,
        fuerza: fuerza !== '' ? Number(fuerza) : null,
        imagen_url: imagen || null
      });

      if (res && res.exito) {
        if (alerta) {
          alerta.textContent = res.mensaje || '¡Carta agregada exitosamente!';
          alerta.className = 'auth-alerta auth-alerta-exito';
          alerta.style.display = 'block';
        }
        form.reset();

        // Si tenemos la función de recargar cat?logo global, la llamamos
        if (typeof obtenerCartasAPI === 'function') {
          obtenerCartasAPI().then(nuevasCartas => {
            if (typeof inicializarCatalogo === 'function') inicializarCatalogo(nuevasCartas);
            if (typeof inicializarMazos === 'function') inicializarMazos(nuevasCartas);
          });
        }
      } else {
        if (alerta) {
          alerta.textContent = res.mensaje || 'Error al guardar la carta.';
          alerta.className = 'auth-alerta auth-alerta-error';
          alerta.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error al guardar nueva carta:', error);
      if (alerta) {
        alerta.textContent = 'Error de conexión con el servidor.';
        alerta.className = 'auth-alerta auth-alerta-error';
        alerta.style.display = 'block';
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '+ Guardar Carta en el Cat?logo';
      }
    }
  });
}
