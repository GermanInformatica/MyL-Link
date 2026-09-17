/**
 * Punto de entrada principal de la aplicación.
 * Coordina la carga inicial de datos y la inicialización de módulos.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Iniciando MyL Link...');

  // 1. Inicializar navegación SPA y autenticación de inmediato (sin esperar a la red)
  inicializarNavegacion();
  if (typeof inicializarAuth === 'function') {
    inicializarAuth();
  }
  if (typeof inicializarAdmin === 'function') {
    inicializarAdmin();
  }

  // 2. Obtener las cartas desde el backend de forma asíncrona
  try {
    const cartas = await obtenerCartasAPI();
    inicializarCatalogo(cartas);
    inicializarMazos(cartas);
  } catch (err) {
    console.error('Error al cargar catálogo inicial:', err);
  }

  console.log('Aplicación lista y módulos cargados.');
});
