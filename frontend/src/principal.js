/**
 * Punto de entrada principal de la aplicación.
 * Coordina la carga inicial de datos y la inicialización de módulos.
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Iniciando MyL Link...');

  // 1. Inicializar la navegación SPA
  inicializarNavegacion();

  // 2. Obtener las cartas desde el backend MySQL
  const cartas = await obtenerCartasAPI();

  // 3. Inicializar los módulos con los datos obtenidos
  inicializarCatalogo(cartas);
  inicializarMazos(cartas);
  if (typeof inicializarAuth === 'function') {
    inicializarAuth();
  }
  if (typeof inicializarAdmin === 'function') {
    inicializarAdmin();
  }

  console.log('Aplicación lista y módulos cargados.');
});