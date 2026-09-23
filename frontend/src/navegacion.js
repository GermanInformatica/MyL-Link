/**
 * Cambia programáticamente la vista activa en la SPA.
 */
function cambiarVista(vistaDestino) {
  const seccionesVistas = document.querySelectorAll('.vista');
  if (!vistaDestino) return;

  seccionesVistas.forEach(seccion => {
    seccion.classList.remove('active');
  });

  const seccionActiva = document.getElementById(vistaDestino);
  if (seccionActiva) {
    seccionActiva.classList.add('active');

    if (vistaDestino === 'vista-mazos' && typeof mostrarSubvistaMazos === 'function') {
      mostrarSubvistaMazos(typeof subvistaMazosActiva !== 'undefined' ? subvistaMazosActiva : 'galeria');
    }
    if (vistaDestino === 'vista-perfil' && typeof cargarPerfilUsuario === 'function') {
      cargarPerfilUsuario();
    }
    if (vistaDestino === 'vista-admin' && typeof mostrarSubvistaAdmin === 'function') {
      mostrarSubvistaAdmin('menu');
    }
  }

  document.querySelectorAll('.nav-link').forEach(linkNav => {
    linkNav.classList.remove('active');
    if (linkNav.getAttribute('data-target') === vistaDestino) {
      linkNav.classList.add('active');
    }
  });

  // Cerrar el menú móvil si está abierto al cambiar de vista
  cerrarMenuMovil();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Cierra el menú desplegable móvil
 */
function cerrarMenuMovil() {
  const btnHamburguesa = document.getElementById('btn-menu-hamburguesa');
  const menuContenedor = document.getElementById('nav-menu-contenedor');
  if (menuContenedor) {
    menuContenedor.classList.remove('menu-abierto');
  }
  if (btnHamburguesa) {
    btnHamburguesa.classList.remove('activo');
    btnHamburguesa.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Inicializa los eventos del menú móvil (hamburguesa).
 */
function inicializarMenuMovil() {
  const btnHamburguesa = document.getElementById('btn-menu-hamburguesa');
  const menuContenedor = document.getElementById('nav-menu-contenedor');

  if (btnHamburguesa && menuContenedor) {
    btnHamburguesa.onclick = (e) => {
      e.stopPropagation();
      const estaAbierto = menuContenedor.classList.toggle('menu-abierto');
      btnHamburguesa.classList.toggle('activo', estaAbierto);
      btnHamburguesa.setAttribute('aria-expanded', String(estaAbierto));
    };

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', (e) => {
      if (!menuContenedor.contains(e.target) && !btnHamburguesa.contains(e.target)) {
        cerrarMenuMovil();
      }
    });
  }
}

/**
 * Inicializa los eventos de navegación para alternar entre las secciones.
 */
function inicializarNavegacion() {
  inicializarMenuMovil();

  const enlacesNavegacion = document.querySelectorAll('.nav-link, .nav-btn');

  enlacesNavegacion.forEach(enlace => {
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();
      const vistaDestino = enlace.getAttribute('data-target');
      if (vistaDestino) {
        cambiarVista(vistaDestino);
      }
    });
  });
}
