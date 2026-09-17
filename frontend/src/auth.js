/**
 * Módulo de Autenticaci?n y Gesti?n de Usuarios (Registro e Inicio de Sesi?n).
 */

/**
 * Muestra un mensaje de alerta (éxito o error) en el formulario de registro.
 */
function mostrarAlertaRegistro(mensaje, tipo = 'error') {
  const alerta = document.getElementById('reg-alerta');
  if (!alerta) return;

  alerta.textContent = mensaje;
  alerta.className = `auth-alerta auth-alerta-${tipo}`;
  alerta.style.display = 'block';
}

/**
 * Oculta la alerta del formulario de registro.
 */
function ocultarAlertaRegistro() {
  const alerta = document.getElementById('reg-alerta');
  if (alerta) {
    alerta.style.display = 'none';
    alerta.textContent = '';
  }
}

/**
 * Muestra un mensaje de alerta en el modal de inicio de sesi?n.
 */
function mostrarAlertaLogin(mensaje, tipo = 'error') {
  const alerta = document.getElementById('login-alerta');
  if (!alerta) return;

  alerta.textContent = mensaje;
  alerta.className = `auth-alerta auth-alerta-${tipo}`;
  alerta.style.display = 'block';
}

/**
 * Oculta la alerta del modal de inicio de sesi?n.
 */
function ocultarAlertaLogin() {
  const alerta = document.getElementById('login-alerta');
  if (alerta) {
    alerta.style.display = 'none';
    alerta.textContent = '';
  }
}

/**
 * Abre la ventana modal de inicio de sesi?n.
 */
function abrirModalLogin() {
  const modal = document.getElementById('modal-login');
  if (!modal) return;

  ocultarAlertaLogin();
  const form = document.getElementById('form-login');
  if (form) form.reset();

  modal.classList.add('active');
  const inputCorreo = document.getElementById('login-correo');
  if (inputCorreo) setTimeout(() => inputCorreo.focus(), 100);
}

/**
 * Cierra la ventana modal de inicio de sesi?n.
 */
function cerrarModalLogin() {
  const modal = document.getElementById('modal-login');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Inicializa los eventos del módulo de autenticaci?n (Registro y Modal de Login).
 */
function inicializarAuth() {
  // 1. Configurar eventos de la ventana modal de Login
  configurarModalLogin();

  // 2. Configurar el formulario de Registro
  configurarFormularioRegistro();

  // 3. Revisar el estado de sesi?n guardado
  actualizarEstadoUsuarioUI();
}

/**
 * Configura la apertura, cierre y envío del modal de inicio de sesi?n.
 */
function configurarModalLogin() {
  const btnAbrir = document.getElementById('btn-abrir-login');
  const btnCerrar = document.getElementById('btn-cerrar-login');
  const modal = document.getElementById('modal-login');
  const formLogin = document.getElementById('form-login');
  const linkIrRegistro = document.getElementById('link-ir-registro');
  const linkIrLogin = document.getElementById('link-ir-login');

  if (btnAbrir) {
    btnAbrir.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalLogin();
    });
  }

  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalLogin);
  }

  // Cerrar al hacer clic en el fondo oscuro
  if (modal) {
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) {
        cerrarModalLogin();
      }
    });
  }

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      cerrarModalLogin();
    }
  });

  // Enlace dentro del modal para ir a registrarse
  if (linkIrRegistro) {
    linkIrRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarModalLogin();
      const btnRegistroNav = document.querySelector('.nav-btn[data-target="vista-registro"]');
      if (btnRegistroNav) btnRegistroNav.click();
    });
  }

  // Enlace dentro de la página de registro para abrir el login
  if (linkIrLogin) {
    linkIrLogin.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalLogin();
    });
  }

  // Envío del formulario de Login
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
          btnSubmit.textContent = 'Iniciando sesi?n...';
        }

        const respuesta = await iniciarSesionAPI({
          correo: correo,
          contrasena: password
        });

        if (respuesta && respuesta.exito) {
          // Guardar sesi?n en el navegador
          if (respuesta.usuario) {
            localStorage.setItem('id_usuario', respuesta.usuario.id_usuario);
            localStorage.setItem('nombre_usuario', respuesta.usuario.nombre_usuario);
            localStorage.setItem('correo_usuario', respuesta.usuario.correo);
            localStorage.setItem('rol_usuario', respuesta.usuario.rol);
          }

          mostrarAlertaLogin(`¡Hola, ${respuesta.usuario.nombre_usuario}! Entrando...`, 'exito');

          setTimeout(() => {
            cerrarModalLogin();
            actualizarEstadoUsuarioUI();
          }, 1000);

        } else {
          mostrarAlertaLogin(respuesta.mensaje || 'Credenciales incorrectas.');
        }

      } catch (error) {
        console.error('Error al iniciar sesi?n:', error);
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
      mostrarAlertaRegistro('La contrase?a debe tener al menos 6 caracteres.');
      if (inputPassword) inputPassword.focus();
      return;
    }

    if (password !== passwordConfirm) {
      mostrarAlertaRegistro('Las contrase?as no coinciden. Verifícalas.');
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

        setTimeout(() => {
          actualizarEstadoUsuarioUI();
          const btnInicio = document.querySelector('.nav-link[data-target="vista-inicio"]');
          if (btnInicio) btnInicio.click();
        }, 1500);

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
 * Actualiza la barra de navegación según el estado de la sesi?n.
 */
function actualizarEstadoUsuarioUI() {
  const nombreUsuario = localStorage.getItem('nombre_usuario');
  const rolUsuario = localStorage.getItem('rol_usuario');
  const contenedorBotones = document.querySelector('.auth-buttons');
  const navItemAdmin = document.getElementById('nav-item-admin');

  // Mostrar u ocultar pestaña de Administración según el rol
  if (navItemAdmin) {
    navItemAdmin.style.display = (rolUsuario === 'ADMIN') ? 'inline-block' : 'none';
  }

  if (!contenedorBotones) return;

  if (nombreUsuario) {
    contenedorBotones.innerHTML = `
      <span class="usuario-conectado">Hola, <strong>${nombreUsuario}</strong></span>
      <button id="btn-cerrar-sesion" class="btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">Cerrar Sesi?n</button>
    `;

    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
      btnCerrar.onclick = () => {
        if (confirm('¿Deseas cerrar tu sesi?n actual?')) {
          localStorage.removeItem('id_usuario');
          localStorage.removeItem('nombre_usuario');
          localStorage.removeItem('correo_usuario');
          localStorage.removeItem('rol_usuario');
          window.location.reload();
        }
      };
    }
  } else {
    contenedorBotones.innerHTML = `
      <button id="btn-abrir-login" class="btn-secondary">Iniciar Sesi?n</button>
      <button class="btn-primary nav-btn" data-target="vista-registro">Registrarse</button>
    `;

    // Reasignar eventos al volver a renderizar los botones
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
