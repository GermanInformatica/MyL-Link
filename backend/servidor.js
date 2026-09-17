const express = require('express');
const cors = require('cors');
const path = require('path'); // Importar el módulo nativo path
const crypto = require('crypto'); // Para encriptar contrase?as
const db = require('./conexion');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('API REST de MyL Link funcionando correctamente');
});

// Endpoint para obtener todas las cartas del cat?logo
app.get('/api/cartas', async (req, res) => {
  try {
    const [cartas] = await db.query('SELECT * FROM carta ORDER BY id_carta ASC');

    // Limpiar propiedades nulas o no aplicables de cada carta
    const cartasLimpias = cartas.map(carta => {
      const objetoCarta = {
        id_carta: carta.id_carta,
        nombre_carta: carta.nombre_carta,
        tipo: carta.tipo,
        imagen_url: carta.imagen_url
      };

      if (carta.raza !== null) objetoCarta.raza = carta.raza;
      if (carta.coste !== null) objetoCarta.coste = carta.coste;
      if (carta.fuerza !== null) objetoCarta.fuerza = carta.fuerza;

      return objetoCarta;
    });

    res.json({
      exito: true,
      total: cartasLimpias.length,
      datos: cartasLimpias
    });
  } catch (error) {
    console.error('Error al consultar las cartas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno al consultar el cat?logo de cartas'
    });
  }
});

// Endpoint para obtener todos los mazos p?blicos
app.get('/api/mazos', async (req, res) => {
  try {
    const [mazos] = await db.query(`
      SELECT 
        m.id_mazo, 
        m.nombre_mazo, 
        m.descripcion_mazo,
        m.descripcion_mazo AS descripcion, 
        m.es_publico, 
        m.fecha_creacion_mazo,
        m.fecha_creacion_mazo AS fecha_creacion, 
        u.nombre_usuario,
        (SELECT COALESCE(SUM(cantidad), 0) FROM MAZO_CARTA WHERE id_mazo = m.id_mazo) AS total_cartas
      FROM MAZO m
      LEFT JOIN USUARIO u ON m.id_usuario = u.id_usuario
      WHERE m.es_publico = 1
      ORDER BY m.fecha_creacion_mazo DESC
    `);

    res.json({
      exito: true,
      total: mazos.length,
      datos: mazos
    });
  } catch (error) {
    console.error('Error al consultar los mazos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno al consultar la galería de mazos'
    });
  }
});

// Endpoint para obtener el detalle de un mazo específico con todas sus cartas
app.get('/api/mazos/:id', async (req, res) => {
  try {
    const idMazo = req.params.id;

    // 1. Obtener la cabecera del mazo y datos de su autor
    const [mazos] = await db.query(`
      SELECT 
        m.id_mazo, 
        m.nombre_mazo, 
        m.descripcion_mazo, 
        m.descripcion_mazo AS descripcion,
        m.es_publico, 
        m.fecha_creacion_mazo,
        m.fecha_creacion_mazo AS fecha_creacion,
        u.nombre_usuario,
        u.id_usuario
      FROM mazo m
      LEFT JOIN usuario u ON m.id_usuario = u.id_usuario
      WHERE m.id_mazo = ?
    `, [idMazo]);

    if (mazos.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Mazo no encontrado.'
      });
    }

    const mazo = mazos[0];

    // 2. Obtener las cartas que componen el mazo con sus cantidades y detalles
    const [cartas] = await db.query(`
      SELECT 
        c.id_carta, 
        c.nombre_carta, 
        c.tipo, 
        c.raza, 
        c.coste, 
        c.fuerza, 
        c.imagen_url, 
        mc.cantidad
      FROM mazo_carta mc
      JOIN carta c ON mc.id_carta = c.id_carta
      WHERE mc.id_mazo = ?
      ORDER BY 
        CASE c.tipo
          WHEN 'Aliado' THEN 1
          WHEN 'Talism?n' THEN 2
          WHEN 'T?tem' THEN 3
          WHEN 'Arma' THEN 4
          WHEN 'Oro' THEN 5
          ELSE 6
        END,
        c.coste ASC, 
        c.nombre_carta ASC
    `, [idMazo]);

    res.json({
      exito: true,
      datos: {
        ...mazo,
        cartas
      }
    });

  } catch (error) {
    console.error('Error al consultar el detalle del mazo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno al obtener el detalle del mazo.'
    });
  }
});

// Endpoint para guardar un nuevo mazo (Tablas MAZO y MAZO_CARTA)
app.post('/api/mazos', async (req, res) => {
  let connection;
  try {
    const { nombre_mazo, descripcion, es_publico, id_usuario, cartas } = req.body;

    if (!id_usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Debes iniciar sesi?n para guardar un mazo.'
      });
    }

    if (!cartas || !Array.isArray(cartas) || cartas.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El mazo debe contener cartas.'
      });
    }

    // Validación reglamentaria: El mazo debe tener EXACTAMENTE 50 cartas
    const totalCartas = cartas.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
    if (totalCartas !== 50) {
      return res.status(400).json({
        exito: false,
        mensaje: `Un mazo reglamentario de Mitos y Leyendas debe contener exactamente 50 cartas (actualmente tiene ${totalCartas}).`
      });
    }

    // Obtener conexión del pool para manejar la transacción atómica
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Insertar la cabecera en la tabla MAZO
    const [resultadoMazo] = await connection.execute(
      `INSERT INTO mazo (nombre_mazo, es_publico, descripcion_mazo, fecha_creacion_mazo, id_usuario) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [
        nombre_mazo || 'Mi Nuevo Mazo',
        es_publico !== undefined ? es_publico : 1,
        descripcion || null,
        id_usuario
      ]
    );

    const idMazoInsertado = resultadoMazo.insertId;

    // 2. Insertar cada carta en la tabla MAZO_CARTA
    for (const item of cartas) {
      await connection.execute(
        `INSERT INTO mazo_carta (id_mazo, id_carta, cantidad) VALUES (?, ?, ?)`,
        [idMazoInsertado, item.id_carta, item.cantidad]
      );
    }

    // Confirmar la transacción
    await connection.commit();

    res.status(201).json({
      exito: true,
      mensaje: 'Mazo guardado correctamente en la base de datos',
      id_mazo: idMazoInsertado
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al guardar el mazo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al guardar el mazo'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint para el registro de nuevos usuarios
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre_usuario, correo, contrasena } = req.body;

    // 1. Validaciones básicas
    if (!nombre_usuario || !correo || !contrasena) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son obligatorios.'
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contrase?a debe tener al menos 6 caracteres.'
      });
    }

    const correoLimpio = correo.trim().toLowerCase();
    const nombreLimpio = nombre_usuario.trim();

    // 2. Verificar si el correo ya existe en la base de datos
    const [usuariosExistentes] = await db.query(
      'SELECT id_usuario FROM usuario WHERE correo = ?',
      [correoLimpio]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe una cuenta registrada con este correo electrónico.'
      });
    }

    // 3. Hashear la contrase?a con SHA-256
    const contrasenaHash = crypto.createHash('sha256').update(contrasena).digest('hex');

    // 4. Insertar en la tabla USUARIO
    const [resultado] = await db.execute(
      'INSERT INTO usuario (nombre_usuario, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?)',
      [nombreLimpio, correoLimpio, contrasenaHash, 'USER']
    );

    res.status(201).json({
      exito: true,
      mensaje: '¡Usuario registrado exitosamente!',
      usuario: {
        id_usuario: resultado.insertId,
        nombre_usuario: nombreLimpio,
        correo: correoLimpio,
        rol: 'USER'
      }
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al procesar el registro.'
    });
  }
});

// Endpoint para el inicio de sesi?n (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes ingresar tu correo y contrase?a.'
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    // 1. Buscar al usuario en la base de datos
    const [usuarios] = await db.query(
      'SELECT id_usuario, nombre_usuario, correo, contrasena_hash, rol FROM usuario WHERE correo = ?',
      [correoLimpio]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Correo o contrase?a incorrectos.'
      });
    }

    const usuario = usuarios[0];
    const contrasenaHash = crypto.createHash('sha256').update(contrasena).digest('hex');

    // 2. Comprobar contrase?a (soporta hash SHA-256 o texto directo para usuarios de prueba antiguos)
    const esValida = (usuario.contrasena_hash === contrasenaHash) || (usuario.contrasena_hash === contrasena);

    if (!esValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Correo o contrase?a incorrectos.'
      });
    }

    res.json({
      exito: true,
      mensaje: `¡Bienvenido de nuevo, ${usuario.nombre_usuario}!`,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesi?n:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al procesar el inicio de sesi?n.'
    });
  }
});

// ==========================================
// ENDPOINTS DE ADMINISTRACIÓN (PANEL DE CONTROL)
// ==========================================

// 1. Estad?sticas generales del sistema
app.get('/api/admin/estadisticas', async (req, res) => {
  try {
    const [[{ totalUsuarios }]] = await db.query('SELECT COUNT(*) AS totalUsuarios FROM usuario');
    const [[{ totalMazos }]] = await db.query('SELECT COUNT(*) AS totalMazos FROM mazo');
    const [[{ totalMazosPublicos }]] = await db.query('SELECT COUNT(*) AS totalMazosPublicos FROM mazo WHERE es_publico = 1');
    const [[{ totalCartas }]] = await db.query('SELECT COUNT(*) AS totalCartas FROM carta');

    // Top cartas m?s utilizadas en los mazos
    const [topCartas] = await db.query(`
      SELECT 
        c.id_carta, 
        c.nombre_carta, 
        c.tipo, 
        c.raza, 
        COALESCE(SUM(mc.cantidad), 0) AS total_usadas
      FROM mazo_carta mc
      JOIN carta c ON mc.id_carta = c.id_carta
      GROUP BY c.id_carta, c.nombre_carta, c.tipo, c.raza
      ORDER BY total_usadas DESC
      LIMIT 5
    `);

    res.json({
      exito: true,
      datos: {
        totalUsuarios,
        totalMazos,
        totalMazosPublicos,
        totalCartas,
        topCartas
      }
    });
  } catch (error) {
    console.error('Error al obtener estad?sticas del admin:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar estad?sticas del sistema.' });
  }
});

// 2. Gesti?n de Usuarios: Listado completo
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT 
        u.id_usuario, 
        u.nombre_usuario, 
        u.correo, 
        u.rol, 
        u.fecha_registro,
        (SELECT COUNT(*) FROM MAZO WHERE id_usuario = u.id_usuario) AS total_mazos
      FROM USUARIO u
      ORDER BY u.fecha_registro DESC
    `);

    res.json({
      exito: true,
      total: usuarios.length,
      datos: usuarios
    });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar la lista de usuarios.' });
  }
});

// 2.1 Gesti?n de Usuarios: Eliminar usuario (y sus mazos en cascada)
app.delete('/api/admin/usuarios/:id', async (req, res) => {
  try {
    const idUsuario = req.params.id;

    const [usuarios] = await db.query('SELECT id_usuario, nombre_usuario, rol FROM usuario WHERE id_usuario = ?', [idUsuario]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El usuario que intentas eliminar no existe.'
      });
    }

    if (usuarios[0].rol === 'ADMIN') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No se puede eliminar a una cuenta con rol de Administrador.'
      });
    }

    // Al eliminar el usuario, MySQL borra automáticamente sus mazos (ON DELETE CASCADE)
    await db.execute('DELETE FROM usuario WHERE id_usuario = ?', [idUsuario]);

    res.json({
      exito: true,
      mensaje: `Usuario "${usuarios[0].nombre_usuario}" y todos sus mazos asociados fueron eliminados con éxito.`
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al eliminar el usuario.'
    });
  }
});

// 3. Gesti?n de Cartas: Agregar nueva carta al cat?logo
app.post('/api/admin/cartas', async (req, res) => {
  try {
    const { nombre_carta, tipo, coste, fuerza, raza, imagen_url } = req.body;

    if (!nombre_carta || !tipo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El nombre y el tipo de la carta son obligatorios.'
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO carta (nombre_carta, tipo, coste, fuerza, raza, imagen_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_carta.trim(),
        tipo.trim(),
        coste !== '' && coste !== undefined && coste !== null ? Number(coste) : null,
        fuerza !== '' && fuerza !== undefined && fuerza !== null ? Number(fuerza) : null,
        raza ? raza.trim() : null,
        imagen_url ? imagen_url.trim() : null
      ]
    );

    res.status(201).json({
      exito: true,
      mensaje: `¡Carta "${nombre_carta.trim()}" agregada exitosamente al cat?logo!`,
      id_carta: resultado.insertId
    });
  } catch (error) {
    console.error('Error al agregar carta:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno al registrar la carta.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


