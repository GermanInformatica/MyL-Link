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
  }

  document.querySelectorAll('.nav-link').forEach(linkNav => {
    linkNav.classList.remove('active');
    if (linkNav.getAttribute('data-target') === vistaDestino) {
      linkNav.classList.add('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Inicializa los eventos de navegación para alternar entre las secciones (SPA).
 */
function inicializarNavegacion() {
  const enlacesNavegacion = document.querySelectorAll('.nav-link, .nav-btn');

  enlacesNavegacion.forEach(enlace => {
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();
      const vistaDestino = enlace.getAttribute('data-target');
      cambiarVista(vistaDestino);
    });
  });
}
