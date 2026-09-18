// Configuración de la URL de la API REST
// Detectar automáticamente si estamos en desarrollo local o en producción (Netlify / Render)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://myl-link-backend.onrender.com';

/**
 * Obtiene la lista completa de cartas desde la API REST.
 */
async function obtenerCartasAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/cartas`);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const res = await respuesta.json();
    return res.datos || res;
  } catch (error) {
    console.error('Error al obtener el catálogo de cartas desde la API:', error);
    return [];
  }
}

/**
 * Obtiene la lista completa de mazos públicos creados por la comunidad.
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
 * Elimina un mazo de la base de datos según su ID (requiere autenticación/id_usuario para validar propiedad).
 */
async function eliminarMazoAPI(idMazo, idUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/mazos/${idMazo}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario: idUsuario })
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
 * Inicia sesión de un usuario contra la API REST.
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
    console.error('Error al iniciar sesión en la API:', error);
    return {
      exito: false,
      mensaje: 'Error de conexión con el servidor.'
    };
  }
}

/**
 * Obtiene las métricas y estadísticas del sistema para el panel de administración.
 */
async function obtenerEstadisticasAdminAPI() {
  try {
    const respuesta = await fetch(`${API_URL}/api/admin/estadisticas`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
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
 * Registra una nueva carta en el catálogo (Función exclusiva de Administrador).
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

/**
 * Obtiene todos los mazos creados por un usuario específico.
 */
async function obtenerMisMazosAPI(idUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${idUsuario}/mazos`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener mis mazos:', error);
    return { exito: false, datos: [] };
  }
}

/**
 * Obtiene los mazos guardados como favoritos por un usuario.
 */
async function obtenerFavoritosUsuarioAPI(idUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${idUsuario}/favoritos`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return { exito: false, datos: [] };
  }
}

/**
 * Obtiene la lista rápida de IDs de mazos favoritos de un usuario.
 */
async function obtenerIdsFavoritosAPI(idUsuario) {
  try {
    const respuesta = await fetch(`${API_URL}/api/usuarios/${idUsuario}/favoritos/ids`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const res = await respuesta.json();
    return Array.isArray(res.datos) ? res.datos : [];
  } catch (error) {
    console.error('Error al obtener IDs de favoritos:', error);
    return [];
  }
}

/**
 * Alterna el estado de favorito de un mazo (añade si no estaba, quita si ya estaba).
 */
async function alternarFavoritoAPI(idUsuario, idMazo) {
  try {
    const respuesta = await fetch(`${API_URL}/api/favoritos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario: Number(idUsuario), id_mazo: Number(idMazo) })
    });
    return await respuesta.json();
  } catch (error) {
    console.error('Error al alternar favorito:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}

/**
 * Quita un mazo de la lista de favoritos de un usuario.
 */
async function quitarFavoritoAPI(idUsuario, idMazo) {
  try {
    const respuesta = await fetch(`${API_URL}/api/favoritos/${idUsuario}/${idMazo}`, {
      method: 'DELETE'
    });
    return await respuesta.json();
  } catch (error) {
    console.error('Error al quitar favorito:', error);
    return { exito: false, mensaje: 'Error de conexión con el servidor.' };
  }
}
