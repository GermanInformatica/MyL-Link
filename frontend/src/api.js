// URL base del backend Node.js / Express
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://myl-link-backend.onrender.com';

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

    console.warn('Estructura inesperada devuelta por la API de cartas:', res);
    return [];
  } catch (error) {
    console.error('Error al conectar con la API de cartas:', error);
    return [];
  }
}

/**
 * Obtiene el listado completo de mazos desde el backend.
 */
async function obtenerMazosAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/mazos`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const res = await respuesta.json();

    if (res && Array.isArray(res.datos)) {
      return res.datos;
    } else if (Array.isArray(res)) {
      return res;
    }

    console.warn('Estructura inesperada devuelta por la API de mazos:', res);
    return [];
  } catch (error) {
    console.error('Error al obtener la lista de mazos desde la API:', error);
    return [];
  }
}

/**
 * Obtiene el detalle de un mazo específico junto con sus cartas.
 */
async function obtenerMazoPorIdAPI(idMazo) {
  try {
    const respuesta = await fetch(`${API_URL}/api/mazos/${idMazo}`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const res = await respuesta.json();
    return res.datos || res;
  } catch (error) {
    console.error(`Error al obtener el mazo con ID ${idMazo}:`, error);
    return null;
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

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    return await respuesta.json();
  } catch (error) {
    console.error('Error al guardar el mazo en la API:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}

/**
 * Elimina un mazo de la base de datos según su ID.
 */
async function eliminarMazoAPI(idMazo) {
  try {
    const respuesta = await fetch(`${API_URL}/api/mazos/${idMazo}`, {
      method: 'DELETE'
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    return await respuesta.json();
  } catch (error) {
    console.error(`Error al eliminar el mazo con ID ${idMazo}:`, error);
    return { exito: false, mensaje: 'Error al conectar con el servidor.' };
  }
}

/**
 * Registra un nuevo usuario en la plataforma.
 */
async function registrarUsuarioAPI(datosUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    });

    return await respuesta.json();
  } catch (error) {
    console.error('Error al registrar usuario en la API:', error);
    return {
      exito: false,
      mensaje: 'Error de conexión con el servidor.'
    };
  }
}

/**
 * Inicia sesi?n de un usuario contra la API REST.
 */
async function iniciarSesionAPI(credenciales) {
  try {
    const respuesta = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credenciales)
    });

    return await respuesta.json();
  } catch (error) {
    console.error('Error al iniciar sesi?n en la API:', error);
    return {
      exito: false,
      mensaje: 'Error de conexión con el servidor.'
    };
  }
}

/**
 * Obtiene las métricas y estad?sticas del sistema para el panel de administración.
 */
async function obtenerEstadisticasAdminAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/admin/estadisticas`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener estad?sticas del admin:', error);
    return { exito: false, mensaje: 'Error al conectar con el servidor.' };
  }
}

/**
 * Obtiene el listado completo de usuarios para el panel de administración.
 */
async function obtenerUsuariosAdminAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/admin/usuarios`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener usuarios del admin:', error);
    return { exito: false, mensaje: 'Error al conectar con el servidor.' };
  }
}

/**
 * Registra una nueva carta en el cat?logo (Función exclusiva de Administrador).
 */
async function agregarCartaAdminAPI(datosCarta) {
  try {
    const respuesta = await fetch(`${API_URL}/api/admin/cartas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosCarta)
    });
    return await respuesta.json();
  } catch (error) {
    console.error('Error al agregar carta en la API:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}

/**
 * Elimina un usuario de la base de datos (Función exclusiva de Administrador).
 */
async function eliminarUsuarioAdminAPI(idUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/admin/usuarios/${idUsuario}`, {
      method: 'DELETE'
    });
    return await respuesta.json();
  } catch (error) {
    console.error('Error al eliminar usuario en la API:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}



