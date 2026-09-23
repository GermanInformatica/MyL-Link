// Estado y lógica del Panel de Administración
let vistaAdminActual = 'menu';
let idCartaEditando = null;
let cartasAdminCache = [];

function sanitizarTextoAdmin(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inicializarAdmin() {
  configurarNavegacionAdmin();
  configurarFormularioNuevaCarta();
  configurarBuscadorCartasAdmin();
}

function configurarNavegacionAdmin() {
  const btnUsuarios = document.getElementById('btn-admin-usuarios') || document.getElementById('btn-admin-ir-usuarios');
  const btnCartas = document.getElementById('btn-admin-cartas') || document.getElementById('btn-admin-ir-cartas');
  const btnStats = document.getElementById('btn-admin-stats') || document.getElementById('btn-admin-ir-stats');
  const botonesVolver = document.querySelectorAll('.btn-admin-volver');

  if (btnUsuarios) {
    btnUsuarios.onclick = () => {
      mostrarSubvistaAdmin('usuarios');
      cargarUsuariosAdmin();
    };
  }

  if (btnCartas) {
    btnCartas.onclick = () => {
      mostrarSubvistaAdmin('cartas');
      cargarCartasAdmin();
    };
  }

  if (btnStats) {
    btnStats.onclick = () => {
      mostrarSubvistaAdmin('stats');
      cargarEstadisticasAdmin();
    };
  }

  botonesVolver.forEach(btn => {
    btn.onclick = () => {
      mostrarSubvistaAdmin('menu');
      if (typeof cancelarEdicionCarta === 'function') {
        cancelarEdicionCarta();
      }
    };
  });
}

function mostrarSubvistaAdmin(subvista) {
  vistaAdminActual = subvista;

  const subvistas = {
    menu: document.getElementById('subvista-admin-menu'),
    usuarios: document.getElementById('subvista-admin-usuarios'),
    cartas: document.getElementById('subvista-admin-cartas'),
    stats: document.getElementById('subvista-admin-stats')
  };

  Object.values(subvistas).forEach(el => {
    if (el) el.style.display = 'none';
  });

  if (subvistas[subvista]) {
    subvistas[subvista].style.display = 'block';
  }
}

async function cargarUsuariosAdmin() {
  const tbody = document.getElementById('tbody-admin-usuarios');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">Cargando usuarios...</td></tr>';

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
        : `<button class="btn-danger-mini btn-eliminar-usuario" data-id="${usuario.id_usuario}" data-nombre="${nombreLimpio}">🗑️ Eliminar</button>`;

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

    tbody.querySelectorAll('.btn-eliminar-usuario').forEach(boton => {
      boton.onclick = async () => {
        const idUsuario = boton.getAttribute('data-id');
        const nombre = boton.getAttribute('data-nombre');

        const confirmacion = confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?\n\nAl eliminarlo, se borrarán automáticamente de la base de datos todos los mazos que haya creado.`);

        if (!confirmacion) return;

        try {
          const resultado = await eliminarUsuarioAdminAPI(idUsuario);
          if (resultado && resultado.exito) {
            alert(`Usuario "${nombre}" eliminado con éxito.`);
            cargarUsuariosAdmin();
          } else {
            alert('Error al eliminar usuario: ' + (resultado.mensaje || 'Error desconocido.'));
          }
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          alert('Error de conexión al intentar eliminar el usuario.');
        }
      };
    });

  } else {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Error al cargar la lista de usuarios.</td></tr>';
  }
}

// ==========================================
// CRUD DE CARTAS (TABLA Y LISTADO)
// ==========================================

async function cargarCartasAdmin() {
  const tbody = document.getElementById('tbody-admin-cartas');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">Cargando cartas...</td></tr>';

  try {
    const cartas = await obtenerCartasAPI();
    cartasAdminCache = Array.isArray(cartas) ? cartas : [];
    renderizarTablaCartasAdmin(cartasAdminCache);
  } catch (error) {
    console.error('Error al cargar cartas admin:', error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Error al cargar las cartas.</td></tr>';
  }
}

function renderizarTablaCartasAdmin(cartas) {
  const tbody = document.getElementById('tbody-admin-cartas');
  if (!tbody) return;

  if (!cartas || cartas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">No se encontraron cartas en el catálogo.</td></tr>';
    return;
  }

  const fragmento = document.createDocumentFragment();

  cartas.forEach(carta => {
    const tr = document.createElement('tr');
    const nombreLimpio = sanitizarTextoAdmin(carta.nombre_carta);
    const tipoLimpio = sanitizarTextoAdmin(carta.tipo);
    const razaLimpia = carta.raza ? sanitizarTextoAdmin(carta.raza) : '-';
    const costeLimpio = carta.coste !== null && carta.coste !== undefined ? carta.coste : '-';
    const fuerzaLimpia = carta.fuerza !== null && carta.fuerza !== undefined ? carta.fuerza : '-';

    tr.innerHTML = `
      <td>#${carta.id_carta}</td>
      <td>
        <a href="#" class="admin-carta-link" data-id="${carta.id_carta}" title="Ver detalle de la carta"><strong>${nombreLimpio}</strong></a>
      </td>
      <td>${tipoLimpio}</td>
      <td>${razaLimpia}</td>
      <td>${costeLimpio}</td>
      <td>${fuerzaLimpia}</td>
      <td>
        <div class="admin-acciones-cell">
          <button class="btn-editar-mini btn-editar-carta" data-id="${carta.id_carta}">✏️ Editar</button>
          <button class="btn-danger-mini btn-eliminar-carta" data-id="${carta.id_carta}" data-nombre="${nombreLimpio}">🗑️ Eliminar</button>
        </div>
      </td>
    `;

    fragmento.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragmento);

  // Evento Clic en el Nombre de la Carta -> Abre el Modal Detalle
  tbody.querySelectorAll('.admin-carta-link').forEach(enlace => {
    enlace.onclick = (e) => {
      e.preventDefault();
      const id = enlace.getAttribute('data-id');
      const cartaSeleccionada = cartasAdminCache.find(c => String(c.id_carta) === String(id));
      if (cartaSeleccionada && typeof abrirModalCarta === 'function') {
        abrirModalCarta(cartaSeleccionada);
      }
    };
  });

  // Evento Clic en Botón Editar
  tbody.querySelectorAll('.btn-editar-carta').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const cartaSeleccionada = cartasAdminCache.find(c => String(c.id_carta) === String(id));
      if (cartaSeleccionada) {
        prepararEdicionCarta(cartaSeleccionada);
      }
    };
  });

  // Evento Clic en Botón Eliminar
  tbody.querySelectorAll('.btn-eliminar-carta').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const nombre = btn.getAttribute('data-nombre');

      const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la carta "${nombre}" del catálogo?\n\nAl eliminarla, se borrará tanto de la base de datos como el archivo físico de imagen en el backend.`);

      if (!confirmacion) return;

      try {
        const res = await eliminarCartaAdminAPI(id);
        if (res && res.exito) {
          alert(res.mensaje || `¡Carta "${nombre}" eliminada con éxito!`);
          await cargarCartasAdmin();

          // Si estábamos editando esta misma carta, cancelar edición
          if (idCartaEditando === Number(id)) {
            cancelarEdicionCarta();
          }

          // Actualizar catálogo global y constructor de mazos
          if (typeof obtenerCartasAPI === 'function') {
            const cartasActualizadas = await obtenerCartasAPI();
            if (typeof inicializarCatalogo === 'function') inicializarCatalogo(cartasActualizadas);
            if (typeof inicializarMazos === 'function') inicializarMazos(cartasActualizadas);
          }
        } else {
          alert('Error al eliminar carta: ' + (res.mensaje || 'Error desconocido.'));
        }
      } catch (err) {
        console.error('Error al eliminar carta:', err);
        alert('Error de conexión al intentar eliminar la carta.');
      }
    };
  });
}

function configurarBuscadorCartasAdmin() {
  const inputBuscar = document.getElementById('admin-buscar-cartas');
  if (!inputBuscar) return;

  inputBuscar.oninput = () => {
    const termino = inputBuscar.value.trim().toLowerCase();
    if (!termino) {
      renderizarTablaCartasAdmin(cartasAdminCache);
      return;
    }
    const filtradas = cartasAdminCache.filter(c => 
      (c.nombre_carta && c.nombre_carta.toLowerCase().includes(termino)) ||
      (c.tipo && c.tipo.toLowerCase().includes(termino)) ||
      (c.raza && c.raza.toLowerCase().includes(termino)) ||
      String(c.id_carta).includes(termino)
    );
    renderizarTablaCartasAdmin(filtradas);
  };
}

function prepararEdicionCarta(carta) {
  idCartaEditando = carta.id_carta;

  const form = document.getElementById('form-admin-nueva-carta');
  const tituloForm = document.getElementById('admin-form-carta-titulo');
  const inputNombre = document.getElementById('admin-carta-nombre');
  const selectTipo = document.getElementById('admin-carta-tipo');
  const selectRaza = document.getElementById('admin-carta-raza');
  const inputCoste = document.getElementById('admin-carta-coste');
  const inputFuerza = document.getElementById('admin-carta-fuerza');
  const inputArchivo = document.getElementById('admin-carta-archivo');
  const inputUrl = document.getElementById('admin-carta-url-externa');
  const previewImg = document.getElementById('admin-carta-preview-img');
  const previewWrapper = document.getElementById('admin-carta-preview-wrapper');
  const previewFilename = document.getElementById('admin-preview-filename');
  const btnSubmit = document.getElementById('btn-submit-admin-carta');
  const btnCancelar = document.getElementById('btn-cancelar-edicion-carta');
  const alerta = document.getElementById('admin-carta-alerta');

  if (alerta) alerta.style.display = 'none';

  if (tituloForm) {
    tituloForm.textContent = `✏️ Editando Carta #${carta.id_carta}: ${carta.nombre_carta}`;
    tituloForm.style.color = '#3498db';
  }

  if (inputNombre) inputNombre.value = carta.nombre_carta || '';
  if (selectTipo) selectTipo.value = carta.tipo || '';
  if (selectRaza) selectRaza.value = carta.raza || '';
  if (inputCoste) inputCoste.value = carta.coste !== null && carta.coste !== undefined ? carta.coste : '';
  if (inputFuerza) inputFuerza.value = carta.fuerza !== null && carta.fuerza !== undefined ? carta.fuerza : '';

  if (inputArchivo) inputArchivo.value = '';
  if (inputUrl) inputUrl.value = carta.imagen_url || '';

  if (carta.imagen_url && previewImg && previewWrapper) {
    previewImg.src = carta.imagen_url;
    previewWrapper.style.display = 'flex';
    if (previewFilename) previewFilename.textContent = `Imagen actual: ${carta.imagen_url}`;
  } else if (previewWrapper) {
    previewWrapper.style.display = 'none';
  }

  if (btnSubmit) {
    btnSubmit.textContent = '💾 Guardar Cambios en la Carta';
  }

  if (btnCancelar) {
    btnCancelar.style.display = 'block';
  }

  if (form) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function cancelarEdicionCarta() {
  idCartaEditando = null;

  const form = document.getElementById('form-admin-nueva-carta');
  const tituloForm = document.getElementById('admin-form-carta-titulo');
  const previewImg = document.getElementById('admin-carta-preview-img');
  const previewWrapper = document.getElementById('admin-carta-preview-wrapper');
  const btnSubmit = document.getElementById('btn-submit-admin-carta');
  const btnCancelar = document.getElementById('btn-cancelar-edicion-carta');
  const alerta = document.getElementById('admin-carta-alerta');

  if (form) form.reset();
  if (alerta) alerta.style.display = 'none';

  if (tituloForm) {
    tituloForm.textContent = '+ Agregar Nueva Carta';
    tituloForm.style.color = '#e67e22';
  }

  if (previewWrapper) previewWrapper.style.display = 'none';
  if (previewImg) previewImg.src = '';

  if (btnSubmit) {
    btnSubmit.textContent = '+ Guardar Carta en el Catálogo';
  }

  if (btnCancelar) {
    btnCancelar.style.display = 'none';
  }
}

// ==========================================
// ESTADÍSTICAS DEL ADMIN
// ==========================================

async function cargarEstadisticasAdmin() {
  const statUsuarios = document.getElementById('stat-total-usuarios');
  const statMazos = document.getElementById('stat-total-mazos');
  const statPublicos = document.getElementById('stat-total-publicos');
  const statCartas = document.getElementById('stat-total-cartas');
  const tbodyTop = document.getElementById('tbody-admin-top-cartas');

  if (tbodyTop) {
    tbodyTop.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Cargando estadísticas...</td></tr>';
  }

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

function configurarFormularioNuevaCarta() {
  const form = document.getElementById('form-admin-nueva-carta');
  const inputNombre = document.getElementById('admin-carta-nombre');
  const selectTipo = document.getElementById('admin-carta-tipo');
  const selectRaza = document.getElementById('admin-carta-raza');
  const inputCoste = document.getElementById('admin-carta-coste');
  const inputFuerza = document.getElementById('admin-carta-fuerza');
  const inputArchivo = document.getElementById('admin-carta-archivo');
  const dropZone = document.getElementById('admin-drop-zone');
  const inputUrl = document.getElementById('admin-carta-url-externa');
  const previewImg = document.getElementById('admin-carta-preview-img');
  const previewWrapper = document.getElementById('admin-carta-preview-wrapper');
  const previewFilename = document.getElementById('admin-preview-filename');
  const btnQuitarImg = document.getElementById('btn-quitar-preview-img');
  const alerta = document.getElementById('admin-carta-alerta');
  const btnSubmit = document.getElementById('btn-submit-admin-carta');
  const btnCancelar = document.getElementById('btn-cancelar-edicion-carta');

  if (!form) return;

  if (btnCancelar) {
    btnCancelar.onclick = cancelarEdicionCarta;
  }

  const mostrarPreviewArchivo = (archivo) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .webp).');
      if (inputArchivo) inputArchivo.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg && previewWrapper) {
        previewImg.src = e.target.result;
        previewWrapper.style.display = 'flex';
        if (previewFilename) previewFilename.textContent = archivo.name + ' (' + Math.round(archivo.size / 1024) + ' KB)';
      }
    };
    reader.readAsDataURL(archivo);
  };

  // Evento al seleccionar archivo desde el explorador
  if (inputArchivo) {
    inputArchivo.onchange = () => {
      if (inputArchivo.files && inputArchivo.files[0]) {
        mostrarPreviewArchivo(inputArchivo.files[0]);
      }
    };
  }

  // Soporte Drag & Drop en la zona de subida
  if (dropZone && inputArchivo) {
    dropZone.onclick = () => inputArchivo.click();

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files[0]) {
        inputArchivo.files = files;
        mostrarPreviewArchivo(files[0]);
      }
    }, false);
  }

  // Previsualización si escribe URL web
  if (inputUrl) {
    inputUrl.oninput = () => {
      const url = inputUrl.value.trim();
      const hayArchivo = inputArchivo && inputArchivo.files && inputArchivo.files.length > 0;
      if (url && !hayArchivo) {
        if (previewImg && previewWrapper) {
          previewImg.src = url;
          previewWrapper.style.display = 'flex';
          if (previewFilename) previewFilename.textContent = 'Imagen desde URL web';
        }
      } else if (!url && !hayArchivo) {
        if (previewWrapper) previewWrapper.style.display = 'none';
        if (previewImg) previewImg.src = '';
      }
    };
  }

  // Botón para quitar imagen seleccionada
  if (btnQuitarImg) {
    btnQuitarImg.onclick = () => {
      if (inputArchivo) inputArchivo.value = '';
      if (inputUrl) inputUrl.value = '';
      if (previewWrapper) previewWrapper.style.display = 'none';
      if (previewImg) previewImg.src = '';
    };
  }

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
    const archivo = inputArchivo && inputArchivo.files && inputArchivo.files[0] ? inputArchivo.files[0] : null;
    const urlExterna = inputUrl ? inputUrl.value.trim() : '';

    if (!nombre || !tipo) {
      if (alerta) {
        alerta.textContent = 'El nombre y el tipo de carta son obligatorios.';
        alerta.className = 'auth-alerta auth-alerta-error';
        alerta.style.display = 'block';
      }
      return;
    }

    const formData = new FormData();
    formData.append('nombre_carta', nombre);
    formData.append('tipo', tipo);
    if (raza) formData.append('raza', raza);
    if (coste !== '') formData.append('coste', coste);
    if (fuerza !== '') formData.append('fuerza', fuerza);

    if (archivo) {
      formData.append('imagen_archivo', archivo);
    } else if (urlExterna) {
      formData.append('imagen_url', urlExterna);
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = idCartaEditando ? 'Guardando cambios...' : 'Subiendo y guardando carta...';
      }

      let res;
      if (idCartaEditando) {
        res = await actualizarCartaAdminAPI(idCartaEditando, formData);
      } else {
        res = await agregarCartaAdminAPI(formData);
      }

      if (res && res.exito) {
        if (alerta) {
          alerta.textContent = res.mensaje || (idCartaEditando ? '¡Carta actualizada exitosamente!' : '¡Carta agregada exitosamente al catálogo!');
          alerta.className = 'auth-alerta auth-alerta-exito';
          alerta.style.display = 'block';
        }
        
        cancelarEdicionCarta();
        await cargarCartasAdmin();

        if (typeof obtenerCartasAPI === 'function') {
          const nuevasCartas = await obtenerCartasAPI();
          if (typeof inicializarCatalogo === 'function') inicializarCatalogo(nuevasCartas);
          if (typeof inicializarMazos === 'function') inicializarMazos(nuevasCartas);
        }
      } else {
        if (alerta) {
          alerta.textContent = res.mensaje || 'Error al procesar la carta.';
          alerta.className = 'auth-alerta auth-alerta-error';
          alerta.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error al guardar/actualizar carta:', error);
      if (alerta) {
        alerta.textContent = 'Error de conexión con el servidor.';
        alerta.className = 'auth-alerta auth-alerta-error';
        alerta.style.display = 'block';
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = idCartaEditando ? '💾 Guardar Cambios en la Carta' : '+ Guardar Carta en el Catálogo';
      }
    }
  });
}
