// URL base del backend Node.js / Express
const API_URL = 'http://localhost:3000';

/**
 * Obtiene el listado completo de cartas desde el backend / MySQL.
 */
async function obtenerCartasAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/cartas`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const res = await respuesta.json();

    // Extraer el arreglo desde la propiedad 'datos' que envía Express
    if (res && Array.isArray(res.datos)) {
      return res.datos;
    } else if (Array.isArray(res)) {
      return res;
    }

    console.warn('Estructura inesperada devuelta por la API:', res);
    return [];
  } catch (error) {
    console.error('Error al conectar con la API de cartas:', error);
    return [];
  }
}

/**
 * Envía un nuevo mazo para ser guardado en la base de datos.
 */
async function guardarMazoAPI(datosMazo) {
  try {
    const respuesta = await fetch(`${API_URL}/api/mazos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosMazo)
    });
    return await respuesta.json();
  } catch (error) {
    console.error('Error al guardar el mazo en la API:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}