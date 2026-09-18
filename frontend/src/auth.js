/**
 * Cierra la sesión del usuario y recarga la aplicación.
 */
function cerrarSesion() {
  if (confirm('¿Deseas cerrar tu sesión actual?')) {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('nombre_usuario');
    localStorage.removeItem('correo_usuario');
    localStorage.removeItem('rol_usuario');
    window.location.reload();
  }
}

/**
 * Inicializa los eventos del módulo de autenticación.
 */
function inicializarAuth() {
  configurarModalLogin();
  configurarFormularioRegistro();
  actualizarEstadoUsuarioUI();
}

/**
 * Abre el modal de inicio de sesión.
 */
function abrirModalLogin() {
  const modal = document.getElementById('modal-login');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const inputCorreo = document.getElementById('login-correo');
    if (inputCorreo) inputCorreo.focus();
  }
}

/**
 * Cierra el modal de inicio de sesión y limpia el formulario.
 */
function cerrarModalLogin() {
  const modal = document.getElementById('modal-login');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    const form = document.getElementById('form-login');
    if (form) form.reset();
    ocultarAlertaLogin();
  }
}

/**
 * Muestra un mensaje de alerta en el modal de login.
 */
function mostrarAlertaLogin(mensaje, tipo = 'error') {
  const alerta = document.getElementById('login-alerta');
  if (alerta) {
    alerta.textContent = mensaje;
    alerta.className = `auth-alerta auth-alerta-${tipo}`;
    alerta.style.display = 'block';
  }
}

/**
 * Oculta la alerta del modal de login.
 */
function ocultarAlertaLogin() {
  const alerta = document.getElementById('login-alerta');
  if (alerta) {
    alerta.style.display = 'none';
  }
}

/**
 * Muestra un mensaje de alerta en la vista de registro.
 */
function mostrarAlertaRegistro(mensaje, tipo = 'error') {
  const alerta = document.getElementById('registro-alerta');
  if (alerta) {
    alerta.textContent = mensaje;
    alerta.className = `auth-alerta auth-alerta-${tipo}`;
    alerta.style.display = 'block';
  }
}

/**
 * Oculta la alerta de la vista de registro.
 */
function ocultarAlertaRegistro() {
  const alerta = document.getElementById('registro-alerta');
  if (alerta) {
    alerta.style.display = 'none';
  }
}

/**
 * Configura los eventos del modal de inicio de sesión.
 */
function configurarModalLogin() {
  const modal = document.getElementById('modal-login');
  const btnAbrir = document.getElementById('btn-abrir-login');
  const btnCerrar = document.getElementById('btn-cerrar-login');
  const linkIrRegistro = document.getElementById('link-ir-registro');
  const linkIrLogin = document.getElementById('link-ir-login');
  const formLogin = document.getElementById('form-login');

  if (btnAbrir) {
    btnAbrir.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalLogin();
    });
  }

  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalLogin);
  }

  if (modal) {
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) {
        cerrarModalLogin();
      }
    });
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      cerrarModalLogin();
    }
  });

  if (linkIrRegistro) {
    linkIrRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarModalLogin();
      if (typeof cambiarVista === 'function') {
        cambiarVista('vista-registro');
      }
    });
  }

  if (linkIrLogin) {
    linkIrLogin.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalLogin();
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      ocultarAlertaLogin();

      const inputCorreo = document.getElementById('login-correo');
      const inputPassword = document.getElementById('login-password');
      const btnSubmit = document.getElementById('btn-submit-login');

      const correo = inputCorreo ? inputCorreo.value.trim() : '';
      const password = inputPassword ? inputPassword.value : '';

      if (!correo || !password) {
        mostrarAlertaLogin('Por favor completa todos los campos.');
        return;
      }

      try {
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Iniciando sesión...';
        }

        const respuesta = await iniciarSesionAPI({
          correo: correo,
          contrasena: password
        });

        if (respuesta && respuesta.exito) {
          if (respuesta.usuario) {
            localStorage.setItem('id_usuario', respuesta.usuario.id_usuario);
            localStorage.setItem('nombre_usuario', respuesta.usuario.nombre_usuario);
            localStorage.setItem('correo_usuario', respuesta.usuario.correo);
            localStorage.setItem('rol_usuario', respuesta.usuario.rol);
          }

          mostrarAlertaLogin(`¡Hola, ${respuesta.usuario.nombre_usuario}! Entrando...`, 'exito');

          setTimeout(async () => {
            cerrarModalLogin();
            actualizarEstadoUsuarioUI();
            if (typeof actualizarSetFavoritosUsuario === 'function') {
              await actualizarSetFavoritosUsuario();
            }
            if (typeof mostrarSubvistaMazos === 'function' && typeof subvistaMazosActiva !== 'undefined') {
              mostrarSubvistaMazos(subvistaMazosActiva);
            }
          }, 800);

        } else {
          mostrarAlertaLogin(respuesta.mensaje || 'Credenciales incorrectas.');
        }

      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        mostrarAlertaLogin('Error al conectar con el servidor.');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Ingresar';
        }
      }
    });
  }
}

/**
 * Configura el formulario de registro de usuario.
 */
function configurarFormularioRegistro() {
  const formRegistro = document.getElementById('form-registro');
  const inputNombre = document.getElementById('reg-nombre');
  const inputCorreo = document.getElementById('reg-correo');
  const inputPassword = document.getElementById('reg-password');
  const inputPasswordConfirm = document.getElementById('reg-password-confirm');
  const btnSubmit = document.getElementById('btn-submit-registro');

  if (!formRegistro) return;

  formRegistro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    ocultarAlertaRegistro();

    const nombre = inputNombre ? inputNombre.value.trim() : '';
    const correo = inputCorreo ? inputCorreo.value.trim() : '';
    const password = inputPassword ? inputPassword.value : '';
    const passwordConfirm = inputPasswordConfirm ? inputPasswordConfirm.value : '';

    if (!nombre || !correo || !password || !passwordConfirm) {
      mostrarAlertaRegistro('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      mostrarAlertaRegistro('La contraseña debe tener al menos 6 caracteres.');
      if (inputPassword) inputPassword.focus();
      return;
    }

    if (password !== passwordConfirm) {
      mostrarAlertaRegistro('Las contraseñas no coinciden. Verifícalas.');
      if (inputPasswordConfirm) inputPasswordConfirm.focus();
      return;
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Creando cuenta...';
      }

      const respuesta = await registrarUsuarioAPI({
        nombre_usuario: nombre,
        correo: correo,
        contrasena: password
      });

      if (respuesta && respuesta.exito) {
        if (respuesta.usuario) {
          localStorage.setItem('id_usuario', respuesta.usuario.id_usuario);
          localStorage.setItem('nombre_usuario', respuesta.usuario.nombre_usuario);
          localStorage.setItem('correo_usuario', respuesta.usuario.correo);
          localStorage.setItem('rol_usuario', respuesta.usuario.rol);
        }

        mostrarAlertaRegistro('¡Cuenta creada con éxito! Redirigiendo...', 'exito');
        formRegistro.reset();

        setTimeout(async () => {
          actualizarEstadoUsuarioUI();
          if (typeof cambiarVista === 'function') {
            cambiarVista('vista-inicio');
          }
          if (typeof actualizarSetFavoritosUsuario === 'function') {
            await actualizarSetFavoritosUsuario();
          }
        }, 1200);

      } else {
        mostrarAlertaRegistro(respuesta.mensaje || 'Error al registrar el usuario.');
      }
    } catch (error) {
      console.error('Error en el formulario de registro:', error);
      mostrarAlertaRegistro('No se pudo conectar con el servidor.');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Registrarme';
      }
    }
  });
}

/**
 * Actualiza la barra de navegación según el estado de la sesión.
 */
function actualizarEstadoUsuarioUI() {
  const nombreUsuario = localStorage.getItem('nombre_usuario');
  const rolUsuario = localStorage.getItem('rol_usuario');
  const contenedorBotones = document.querySelector('.auth-buttons');
  const navItemAdmin = document.getElementById('nav-item-admin');

  if (navItemAdmin) {
    navItemAdmin.style.display = (rolUsuario === 'ADMIN') ? 'inline-block' : 'none';
  }

  if (!contenedorBotones) return;

  if (nombreUsuario) {
    contenedorBotones.innerHTML = `
      <span class="usuario-conectado">👤 Hola, <strong>${nombreUsuario}</strong></span>
      <button id="btn-cerrar-sesion" class="btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">Cerrar Sesión</button>
    `;

    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
      btnCerrar.onclick = cerrarSesion;
    }
  } else {
    contenedorBotones.innerHTML = `
      <button id="btn-abrir-login" class="btn-secondary">Iniciar Sesión</button>
      <button class="btn-primary nav-btn" data-target="vista-registro">Registrarse</button>
    `;

    const nuevoBtnLogin = document.getElementById('btn-abrir-login');
    if (nuevoBtnLogin) {
      nuevoBtnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalLogin();
      });
    }

    const nuevoBtnReg = document.querySelector('.auth-buttons .nav-btn[data-target="vista-registro"]');
    if (nuevoBtnReg && typeof inicializarNavegacion === 'function') {
      inicializarNavegacion();
    }
  }
}
