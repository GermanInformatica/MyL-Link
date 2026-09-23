// Estado local del módulo de perfil de usuario

function sanitizarHTMLPerfil(cadena) {
  if (!cadena) return '';
  return String(cadena)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function inicializarPerfil() {
  const navLinkPerfil = document.querySelector('.nav-link[data-target="vista-perfil"]');
  if (navLinkPerfil) {
    navLinkPerfil.addEventListener('click', () => {
      cargarPerfilUsuario();
    });
  }
  configurarModalEditarPerfil();
}

async function cargarPerfilUsuario() {
  const contenedor = document.getElementById('perfil-contenido');
  if (!contenedor) return;

  const idUsuario = localStorage.getItem('id_usuario');
  const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Jugador';
  const correoUsuario = localStorage.getItem('correo_usuario') || '';
  const rolUsuario = localStorage.getItem('rol_usuario') || 'USER';

  if (!idUsuario) {
    contenedor.innerHTML = `
      <div class="tarjeta-perfil perfil-no-auth">
        <div class="perfil-avatar">🔒</div>
        <h3>No has iniciado sesión</h3>
        <p>Debes iniciar sesión o registrarte para ver las estadísticas de tu cuenta.</p>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button class="btn-primary" onclick="document.getElementById('btn-abrir-login').click()">Iniciar Sesión</button>
          <button class="btn-secondary nav-btn" data-target="vista-registro">Registrarse</button>
        </div>
      </div>
    `;

    const btnReg = contenedor.querySelector('[data-target="vista-registro"]');
    if (btnReg && typeof cambiarVista === 'function') {
      btnReg.onclick = () => cambiarVista('vista-registro');
    }
    return;
  }

  const inicial = (nombreUsuario.charAt(0) || 'U').toUpperCase();

  contenedor.innerHTML = `
    <div class="tarjeta-encabezado-perfil">
      <div class="perfil-user-info">
        <div class="perfil-avatar">${inicial}</div>
        <div class="perfil-detalles">
          <h3>${sanitizarHTMLPerfil(nombreUsuario)}</h3>
          <p class="perfil-correo">${sanitizarHTMLPerfil(correoUsuario)}</p>
          <span class="badge-rol ${rolUsuario === 'ADMIN' ? 'badge-admin' : 'badge-user'}">
            ${rolUsuario === 'ADMIN' ? '👑 Administrador' : '⚔️ Jugador'}
          </span>
        </div>
      </div>
      <div class="perfil-acciones">
        <button id="btn-abrir-editar-perfil" class="btn-primary">✏️ Editar Mis Datos</button>
      </div>
    </div>

    <!-- ESTADÍSTICAS DEL USUARIO (KPIS) -->
    <div class="perfil-stats-grid">
      <div class="tarjeta-stat-perfil">
        <div class="icono-stat-perfil">📁</div>
        <div class="info-stat-perfil">
          <span class="num-stat-perfil" id="perfil-count-mazos">0</span>
          <span class="label-stat-perfil">Mazos Construidos</span>
        </div>
      </div>

      <div class="tarjeta-stat-perfil">
        <div class="icono-stat-perfil">⭐</div>
        <div class="info-stat-perfil">
          <span class="num-stat-perfil" id="perfil-count-favoritos">0</span>
          <span class="label-stat-perfil">Mazos Favoritos</span>
        </div>
      </div>
    </div>


  `;

  configurarBotonesPerfil(idUsuario);

  // Consultar contadores de mazos y favoritos
  try {
    const misMazosRes = await obtenerMisMazosAPI(idUsuario);
    const totalMazos = Array.isArray(misMazosRes) ? misMazosRes.length : (misMazosRes && misMazosRes.datos ? misMazosRes.datos.length : 0);
    const countMazosEl = document.getElementById('perfil-count-mazos');
    if (countMazosEl) countMazosEl.textContent = totalMazos;
  } catch (e) {
    console.error('Error al cargar conteo de mazos:', e);
  }

  try {
    const favsRes = await obtenerFavoritosUsuarioAPI(idUsuario);
    const totalFavs = Array.isArray(favsRes) ? favsRes.length : (favsRes && favsRes.datos ? favsRes.datos.length : 0);
    const countFavsEl = document.getElementById('perfil-count-favoritos');
    if (countFavsEl) countFavsEl.textContent = totalFavs;
  } catch (e) {
    console.error('Error al cargar conteo de favoritos:', e);
  }
}

function configurarBotonesPerfil(idUsuario) {
  const btnEditar = document.getElementById('btn-abrir-editar-perfil');
  if (btnEditar) {
    btnEditar.onclick = () => abrirModalEditarPerfil();
  }
}

// ==========================================
// MODAL DE EDICIÓN DE PERFIL (NOMBRE Y PASSWORD)
// ==========================================

function abrirModalEditarPerfil() {
  const modal = document.getElementById('modal-editar-perfil');
  const inputNombre = document.getElementById('edit-perfil-nombre');
  const inputCorreo = document.getElementById('edit-perfil-correo');
  const inputPass = document.getElementById('edit-perfil-password');
  const inputPassConfirm = document.getElementById('edit-perfil-password-confirm');
  const alerta = document.getElementById('alerta-editar-perfil');

  if (!modal) return;

  const nombreActual = localStorage.getItem('nombre_usuario') || '';
  const correoActual = localStorage.getItem('correo_usuario') || '';

  if (inputNombre) inputNombre.value = nombreActual;
  if (inputCorreo) inputCorreo.value = correoActual;
  if (inputPass) inputPass.value = '';
  if (inputPassConfirm) inputPassConfirm.value = '';

  if (alerta) {
    alerta.style.display = 'none';
    alerta.textContent = '';
  }

  modal.classList.add('active');
}

function cerrarModalEditarPerfil() {
  const modal = document.getElementById('modal-editar-perfil');
  if (modal) modal.classList.remove('active');
}

function configurarModalEditarPerfil() {
  const modal = document.getElementById('modal-editar-perfil');
  const btnCerrar = document.getElementById('btn-cerrar-editar-perfil');
  const btnCancelar = document.getElementById('btn-cancelar-modal-perfil');
  const form = document.getElementById('form-editar-perfil');

  if (btnCerrar) btnCerrar.onclick = cerrarModalEditarPerfil;
  if (btnCancelar) btnCancelar.onclick = cerrarModalEditarPerfil;

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModalEditarPerfil();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inputNombre = document.getElementById('edit-perfil-nombre');
      const inputPass = document.getElementById('edit-perfil-password');
      const inputPassConfirm = document.getElementById('edit-perfil-password-confirm');
      const alerta = document.getElementById('alerta-editar-perfil');
      const btnSubmit = document.getElementById('btn-submit-editar-perfil');

      const idUsuario = localStorage.getItem('id_usuario');
      if (!idUsuario) return;

      const nuevoNombre = inputNombre ? inputNombre.value.trim() : '';
      const nuevaPass = inputPass ? inputPass.value : '';
      const nuevaPassConfirm = inputPassConfirm ? inputPassConfirm.value : '';

      if (!nuevoNombre) {
        if (alerta) {
          alerta.textContent = 'El nombre de usuario es obligatorio.';
          alerta.className = 'auth-alerta auth-alerta-error';
          alerta.style.display = 'block';
        }
        return;
      }

      if (nuevaPass) {
        if (nuevaPass.length < 6) {
          if (alerta) {
            alerta.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
            alerta.className = 'auth-alerta auth-alerta-error';
            alerta.style.display = 'block';
          }
          return;
        }

        if (nuevaPass !== nuevaPassConfirm) {
          if (alerta) {
            alerta.textContent = 'Las contraseñas no coinciden. Verifícalas.';
            alerta.className = 'auth-alerta auth-alerta-error';
            alerta.style.display = 'block';
          }
          return;
        }
      }

      try {
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Guardando...';
        }

        const datosEnvio = { nombre_usuario: nuevoNombre };
        if (nuevaPass) datosEnvio.nueva_contrasena = nuevaPass;

        const res = await actualizarPerfilUsuarioAPI(idUsuario, datosEnvio);

        if (res && res.exito) {
          if (res.usuario && res.usuario.nombre_usuario) {
            localStorage.setItem('nombre_usuario', res.usuario.nombre_usuario);
          }

          if (alerta) {
            alerta.textContent = res.mensaje || '¡Perfil actualizado exitosamente!';
            alerta.className = 'auth-alerta auth-alerta-exito';
            alerta.style.display = 'block';
          }

          if (typeof actualizarEstadoUsuarioUI === 'function') {
            actualizarEstadoUsuarioUI();
          }

          setTimeout(() => {
            cerrarModalEditarPerfil();
            cargarPerfilUsuario();
          }, 800);
        } else {
          if (alerta) {
            alerta.textContent = res.mensaje || 'Error al actualizar el perfil.';
            alerta.className = 'auth-alerta auth-alerta-error';
            alerta.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Error al actualizar datos de perfil:', err);
        if (alerta) {
          alerta.textContent = 'Error de conexión con el servidor.';
          alerta.className = 'auth-alerta auth-alerta-error';
          alerta.style.display = 'block';
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '💾 Guardar';
        }
      }
    });
  }
}
