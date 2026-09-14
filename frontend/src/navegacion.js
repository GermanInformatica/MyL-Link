/**
 * Inicializa los eventos de navegación para alternar entre las secciones (SPA).
 */
function inicializarNavegacion() {
  const enlacesNavegacion = document.querySelectorAll('.nav-link, .nav-btn');
  const seccionesVistas = document.querySelectorAll('.vista');

  enlacesNavegacion.forEach(enlace => {
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();

      // Obtener el ID de la vista destino desde el atributo data-target
      const vistaDestino = enlace.getAttribute('data-target');

      if (!vistaDestino) return;

      // Ocultar todas las secciones
      seccionesVistas.forEach(seccion => {
        seccion.classList.remove('active');
      });

      // Mostrar la sección seleccionada
      const seccionActiva = document.getElementById(vistaDestino);
      if (seccionActiva) {
        seccionActiva.classList.add('active');
      }

      // Actualizar el estado 'active' en la barra de navegación principal
      document.querySelectorAll('.nav-link').forEach(linkNav => {
        linkNav.classList.remove('active');
        if (linkNav.getAttribute('data-target') === vistaDestino) {
          linkNav.classList.add('active');
        }
      });
    });
  });
}