const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const path = require('path'); // Importar el módulo nativo path
const crypto = require('crypto'); // Para encriptar contraseñas
const db = require('./conexion');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'

// ==========================================
// CONFIGURACIÓN DE SUBIDA DE IMÁGENES (MULTER)
// ==========================================
const storageCartas = multer.diskStorage({
  destination: function (req, file, cb) {
    const dirCartas = path.join(__dirname, 'public', 'img', 'cartas');
    if (!fs.existsSync(dirCartas)) {
      fs.mkdirSync(dirCartas, { recursive: true });
    }
    cb(null, dirCartas);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const nombreLimpio = 'carta-' + Date.now() + '-' + Math.round(Math.random() * 1e4) + ext;
    cb(null, nombreLimpio);
  }
});

const uploadCarta = multer({
  storage: storageCartas,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: function (req, file, cb) {
    const permitidos = /jpeg|jpg|png|webp|gif/;
    const extValida = permitidos.test(path.extname(file.originalname).toLowerCase());
    const mimeValido = permitidos.test(file.mimetype);
    if (extValida && mimeValido) {
      return cb(null, true);
    }
    cb(new Error('Formato de imagen no válido. Solo se permiten imágenes PNG, JPG, JPEG o WEBP.'));
  }
});

// Servir estaticos del frontend y de la carpeta public
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'API REST de MyL Link funcionando correctamente' });
});

// Endpoint para obtener todas las cartas del catálogo

// Registrar visita a una carta y obtener métricas de popularidad en tiempo real
app.post('/api/cartas/:id/vista', async (req, res) => {
  try {
    const idCarta = req.params.id;

    // 1. Incrementar visitas
    await db.execute(
      'UPDATE carta SET visitas_count = COALESCE(visitas_count, 0) + 1 WHERE id_carta = ?',
      [idCarta]
    );

    // 2. Obtener el total de visitas actualizado
    const [cartaRows] = await db.query(
      'SELECT visitas_count FROM carta WHERE id_carta = ?',
      [idCarta]
    );

    if (cartaRows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Carta no encontrada.' });
    }

    // 3. Obtener cuántas veces está incluida en mazos
    const [mazoRows] = await db.query(
      'SELECT COALESCE(SUM(cantidad), 0) AS total_en_mazos FROM mazo_carta WHERE id_carta = ?',
      [idCarta]
    );

    const totalVisitas = Number(cartaRows[0].visitas_count) || 0;
    const totalEnMazos = Number(mazoRows[0].total_en_mazos) || 0;

    res.json({
      exito: true,
      id_carta: idCarta,
      visitas: totalVisitas,
      total_en_mazos: totalEnMazos
    });
  } catch (error) {
    console.error('Error al registrar vista de carta:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno al registrar vista de carta.' });
  }
});

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
      mensaje: 'Error interno al consultar el catálogo de cartas'
    });
  }
});

// Endpoint para obtener todos los mazos públicos
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
        (SELECT COALESCE(SUM(cantidad), 0) FROM MAZO_CARTA WHERE id_mazo = m.id_mazo) AS total_cartas,
        (SELECT ROUND(AVG(puntuacion), 1) FROM valoracion WHERE id_mazo = m.id_mazo) AS promedio_puntuacion,
        (SELECT COUNT(*) FROM valoracion WHERE id_mazo = m.id_mazo) AS total_valoraciones
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
          WHEN 'Talismán' THEN 2
          WHEN 'Tótem' THEN 3
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
        mensaje: 'Debes iniciar sesión para guardar un mazo.'
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

// Endpoint para actualizar un mazo existente (PUT /api/mazos/:id)
app.put('/api/mazos/:id', async (req, res) => {
  let connection;
  try {
    const idMazo = req.params.id;
    const { nombre_mazo, descripcion, es_publico, id_usuario, cartas } = req.body;

    if (!id_usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Debes iniciar sesión para editar un mazo.'
      });
    }

    // 1. Verificar si el mazo existe y comprobar permisos
    const [mazos] = await db.query('SELECT * FROM mazo WHERE id_mazo = ?', [idMazo]);
    if (mazos.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'El mazo no existe.'
      });
    }

    const [usuarios] = await db.query('SELECT rol FROM usuario WHERE id_usuario = ?', [id_usuario]);
    const esAdmin = usuarios.length > 0 && usuarios[0].rol === 'ADMIN';
    const esDuenio = mazos[0].id_usuario === Number(id_usuario);

    if (!esAdmin && !esDuenio) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para editar este mazo.'
      });
    }

    // 2. Validación de 50 cartas
    if (!cartas || !Array.isArray(cartas) || cartas.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El mazo debe contener cartas.'
      });
    }

    const totalCartas = cartas.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
    if (totalCartas !== 50) {
      return res.status(400).json({
        exito: false,
        mensaje: `Un mazo reglamentario de Mitos y Leyendas debe contener exactamente 50 cartas (actualmente tiene ${totalCartas}).`
      });
    }

    // 3. Transacción atómica
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Actualizar cabecera del mazo
    await connection.execute(
      `UPDATE mazo SET nombre_mazo = ?, es_publico = ?, descripcion_mazo = ? WHERE id_mazo = ?`,
      [
        nombre_mazo || 'Mi Mazo Editado',
        es_publico !== undefined ? es_publico : 1,
        descripcion || null,
        idMazo
      ]
    );

    // Eliminar cartas anteriores del mazo
    await connection.execute(`DELETE FROM mazo_carta WHERE id_mazo = ?`, [idMazo]);

    // Insertar nuevas cartas
    for (const item of cartas) {
      await connection.execute(
        `INSERT INTO mazo_carta (id_mazo, id_carta, cantidad) VALUES (?, ?, ?)`,
        [idMazo, item.id_carta, item.cantidad]
      );
    }

    await connection.commit();

    res.json({
      exito: true,
      mensaje: '¡Mazo actualizado exitosamente!',
      id_mazo: idMazo
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar el mazo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al actualizar el mazo.'
    });
  } finally {
    if (connection) connection.release();
  }
});

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
        mensaje: 'La contraseña debe tener al menos 6 caracteres.'
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

    // 3. Hashear la contraseña con SHA-256
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

// Endpoint para el inicio de sesión (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes ingresar tu correo y contraseña.'
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
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    const usuario = usuarios[0];
    const contrasenaHash = crypto.createHash('sha256').update(contrasena).digest('hex');

    // 2. Comprobar contraseña (soporta hash SHA-256 o texto directo para usuarios de prueba antiguos)
    const esValida = (usuario.contrasena_hash === contrasenaHash) || (usuario.contrasena_hash === contrasena);

    if (!esValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Correo o contraseña incorrectos.'
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
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al procesar el inicio de sesión.'
    });
  }
});

// ==========================================
// ENDPOINTS DE ADMINISTRACIÓN (PANEL DE CONTROL)
// ==========================================

// 1. Estadísticas generales del sistema
app.get('/api/admin/estadisticas', async (req, res) => {
  try {
    const [[{ totalUsuarios }]] = await db.query('SELECT COUNT(*) AS totalUsuarios FROM usuario');
    const [[{ totalMazos }]] = await db.query('SELECT COUNT(*) AS totalMazos FROM mazo');
    const [[{ totalMazosPublicos }]] = await db.query('SELECT COUNT(*) AS totalMazosPublicos FROM mazo WHERE es_publico = 1');
    const [[{ totalCartas }]] = await db.query('SELECT COUNT(*) AS totalCartas FROM carta');

    // Top cartas más utilizadas en los mazos
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
    console.error('Error al obtener estadísticas del admin:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar estadísticas del sistema.' });
  }
});

// 2. Gestión de Usuarios: Listado completo
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

// 2.1 Gestión de Usuarios: Eliminar usuario (y sus mazos en cascada)
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

    // Al eliminar el usuario, MySQL borra automáticamente sus mazos
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

// 3. Gestión de Cartas: Agregar nueva carta al catálogo (Soporta archivo subido y URL)
app.post('/api/admin/cartas', uploadCarta.single('imagen_archivo'), async (req, res) => {
  try {
    const { nombre_carta, tipo, coste, fuerza, raza, imagen_url } = req.body || {};

    if (!nombre_carta || !tipo) {
      return res.status(400).json({
        exito: false,
        mensaje: "El nombre y el tipo de la carta son obligatorios."
      });
    }

    let rutaImagenFinal = null;
    if (req.file && req.file.filename) {
      rutaImagenFinal = "/img/cartas/" + req.file.filename;
    } else if (imagen_url && imagen_url.trim() !== "") {
      rutaImagenFinal = imagen_url.trim();
    }

    const [resultado] = await db.execute(
      `INSERT INTO carta (nombre_carta, tipo, coste, fuerza, raza, imagen_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_carta.trim(),
        tipo.trim(),
        coste !== "" && coste !== undefined && coste !== null ? Number(coste) : null,
        fuerza !== "" && fuerza !== undefined && fuerza !== null ? Number(fuerza) : null,
        raza ? raza.trim() : null,
        rutaImagenFinal
      ]
    );

    res.status(201).json({
      exito: true,
      mensaje: `¡Carta "${nombre_carta.trim()}" agregada exitosamente al catálogo!`,
      id_carta: resultado.insertId,
      imagen_url: rutaImagenFinal
    });
  } catch (error) {
    console.error("Error al agregar carta:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno al registrar la carta: " + error.message });
  }
});

// 4. Gestión de Cartas: Actualizar/Editar una carta existente
app.put('/api/admin/cartas/:id', uploadCarta.single('imagen_archivo'), async (req, res) => {
  try {
    const idCarta = req.params.id;
    const { nombre_carta, tipo, coste, fuerza, raza, imagen_url } = req.body || {};

    if (!nombre_carta || !tipo) {
      return res.status(400).json({
        exito: false,
        mensaje: "El nombre y el tipo de la carta son obligatorios."
      });
    }

    const [cartasExistentes] = await db.query('SELECT * FROM carta WHERE id_carta = ?', [idCarta]);
    if (cartasExistentes.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "La carta no existe." });
    }

    const cartaAnterior = cartasExistentes[0];
    let rutaImagenFinal = cartaAnterior.imagen_url;

    if (req.file && req.file.filename) {
      rutaImagenFinal = "/img/cartas/" + req.file.filename;

      if (cartaAnterior.imagen_url && cartaAnterior.imagen_url.startsWith('/img/cartas/carta-')) {
        const rutaVieja = path.join(__dirname, 'public', cartaAnterior.imagen_url);
        if (fs.existsSync(rutaVieja)) {
          try { fs.unlinkSync(rutaVieja); } catch (e) { console.error('Error al borrar imagen anterior:', e); }
        }
      }
    } else if (imagen_url !== undefined && imagen_url.trim() !== "") {
      rutaImagenFinal = imagen_url.trim();
    }

    await db.execute(
      `UPDATE carta SET nombre_carta = ?, tipo = ?, coste = ?, fuerza = ?, raza = ?, imagen_url = ? WHERE id_carta = ?`,
      [
        nombre_carta.trim(),
        tipo.trim(),
        coste !== "" && coste !== undefined && coste !== null ? Number(coste) : null,
        fuerza !== "" && fuerza !== undefined && fuerza !== null ? Number(fuerza) : null,
        raza ? raza.trim() : null,
        rutaImagenFinal,
        idCarta
      ]
    );

    res.json({
      exito: true,
      mensaje: `¡Carta "${nombre_carta.trim()}" actualizada exitosamente!`,
      id_carta: idCarta,
      imagen_url: rutaImagenFinal
    });
  } catch (error) {
    console.error("Error al actualizar carta:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno al actualizar la carta: " + error.message });
  }
});

// 5. Gestión de Cartas: Eliminar una carta del catálogo y su archivo físico
app.delete('/api/admin/cartas/:id', async (req, res) => {
  try {
    const idCarta = req.params.id;

    const [cartasExistentes] = await db.query('SELECT * FROM carta WHERE id_carta = ?', [idCarta]);
    if (cartasExistentes.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "La carta no existe." });
    }

    const carta = cartasExistentes[0];

    // 1. Eliminar de mazo_carta
    await db.execute('DELETE FROM mazo_carta WHERE id_carta = ?', [idCarta]);

    // 2. Eliminar de carta
    await db.execute('DELETE FROM carta WHERE id_carta = ?', [idCarta]);

    // 3. Eliminar archivo físico de la imagen si fue subida
    if (carta.imagen_url && carta.imagen_url.startsWith('/img/cartas/carta-')) {
      const rutaFisica = path.join(__dirname, 'public', carta.imagen_url);
      if (fs.existsSync(rutaFisica)) {
        try {
          fs.unlinkSync(rutaFisica);
          console.log(`Imagen física eliminada: ${rutaFisica}`);
        } catch (e) {
          console.error('Error al borrar imagen física en disco:', e);
        }
      }
    }

    res.json({
      exito: true,
      mensaje: `¡Carta "${carta.nombre_carta}" eliminada exitosamente del catálogo!`
    });
  } catch (error) {
    console.error("Error al eliminar carta:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno al eliminar la carta: " + error.message });
  }
});
// ==========================================
// ENDPOINTS DE PERFIL, MIS MAZOS Y FAVORITOS
// ==========================================

// 1. Obtener todos los mazos creados por un usuario

// Actualizar datos del perfil de usuario (Nombre y/o Contraseña)
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const idUsuario = req.params.id;
    const { nombre_usuario, nueva_contrasena } = req.body || {};

    const [usuarios] = await db.query('SELECT * FROM usuario WHERE id_usuario = ?', [idUsuario]);
    if (usuarios.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    const usuario = usuarios[0];
    let nombreFinal = usuario.nombre_usuario;
    let contrasenaHashFinal = usuario.contrasena_hash;

    if (nombre_usuario && nombre_usuario.trim() !== '') {
      nombreFinal = nombre_usuario.trim();
    }

    if (nueva_contrasena && nueva_contrasena.trim() !== '') {
      if (nueva_contrasena.length < 6) {
        return res.status(400).json({ exito: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      contrasenaHashFinal = crypto.createHash('sha256').update(nueva_contrasena).digest('hex');
    }

    await db.execute(
      'UPDATE usuario SET nombre_usuario = ?, contrasena_hash = ? WHERE id_usuario = ?',
      [nombreFinal, contrasenaHashFinal, idUsuario]
    );

    res.json({
      exito: true,
      mensaje: '¡Perfil actualizado con éxito!',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_usuario: nombreFinal,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al actualizar perfil.' });
  }
});

app.get('/api/usuarios/:id/mazos', async (req, res) => {
  try {
    const idUsuario = req.params.id;
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
      WHERE m.id_usuario = ?
      ORDER BY m.fecha_creacion_mazo DESC
    `, [idUsuario]);

    res.json({
      exito: true,
      total: mazos.length,
      datos: mazos
    });
  } catch (error) {
    console.error('Error al consultar mazos del usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar tus mazos creados.' });
  }
});

// 2. Eliminar un mazo (por su autor o por el administrador)
app.delete('/api/mazos/:id', async (req, res) => {
  try {
    const idMazo = req.params.id;
    const { id_usuario } = req.body || {};

    if (id_usuario) {
      const [usuario] = await db.query('SELECT rol FROM USUARIO WHERE id_usuario = ?', [id_usuario]);
      const [mazo] = await db.query('SELECT id_usuario FROM MAZO WHERE id_mazo = ?', [idMazo]);

      if (mazo.length === 0) {
        return res.status(404).json({ exito: false, mensaje: 'Mazo no encontrado.' });
      }

      const esAdmin = usuario.length > 0 && usuario[0].rol === 'ADMIN';
      const esDuenio = mazo[0].id_usuario === Number(id_usuario);

      if (!esAdmin && !esDuenio) {
        return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar este mazo.' });
      }
    }

    await db.query('DELETE FROM MAZO WHERE id_mazo = ?', [idMazo]);
    res.json({ exito: true, mensaje: 'Mazo eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar mazo:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar el mazo.' });
  }
});

// 3. Obtener mazos favoritos de un usuario
app.get('/api/usuarios/:id/favoritos', async (req, res) => {
  try {
    const idUsuario = req.params.id;
    const [favoritos] = await db.query(`
      SELECT 
        m.id_mazo, 
        m.nombre_mazo, 
        m.descripcion_mazo,
        m.descripcion_mazo AS descripcion, 
        m.es_publico, 
        m.fecha_creacion_mazo,
        m.fecha_creacion_mazo AS fecha_creacion, 
        u.nombre_usuario,
        f.fecha_guardado,
        (SELECT COALESCE(SUM(cantidad), 0) FROM MAZO_CARTA WHERE id_mazo = m.id_mazo) AS total_cartas
      FROM FAVORITO f
      JOIN MAZO m ON f.id_mazo = m.id_mazo
      LEFT JOIN USUARIO u ON m.id_usuario = u.id_usuario
      WHERE f.id_usuario = ?
      ORDER BY f.fecha_guardado DESC
    `, [idUsuario]);

    res.json({
      exito: true,
      total: favoritos.length,
      datos: favoritos
    });
  } catch (error) {
    console.error('Error al consultar favoritos del usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar tus mazos favoritos.' });
  }
});

// 4. Obtener solo los IDs de favoritos de un usuario
app.get('/api/usuarios/:id/favoritos/ids', async (req, res) => {
  try {
    const idUsuario = req.params.id;
    const [filas] = await db.query('SELECT id_mazo FROM FAVORITO WHERE id_usuario = ?', [idUsuario]);
    res.json({
      exito: true,
      datos: filas.map(f => f.id_mazo)
    });
  } catch (error) {
    console.error('Error al consultar IDs de favoritos:', error);
    res.status(500).json({ exito: false, datos: [] });
  }
});

// 5. Alternar favorito (Agregar / Quitar)
app.post('/api/favoritos', async (req, res) => {
  try {
    const idUsuario = parseInt(req.body.id_usuario, 10);
    const idMazo = parseInt(req.body.id_mazo, 10);

    if (isNaN(idUsuario) || isNaN(idMazo)) {
      return res.status(400).json({ exito: false, mensaje: 'Usuario y mazo deben ser números válidos.' });
    }

    // Verificar que el usuario exista
    const [usuarios] = await db.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [idUsuario]);
    if (usuarios.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'El usuario especificado no existe.' });
    }

    // Verificar que el mazo exista
    const [mazos] = await db.query('SELECT id_mazo, nombre_mazo FROM mazo WHERE id_mazo = ?', [idMazo]);
    if (mazos.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'El mazo especificado no existe.' });
    }

    const [existente] = await db.query(
      'SELECT * FROM favorito WHERE id_usuario = ? AND id_mazo = ?',
      [idUsuario, idMazo]
    );

    if (existente.length > 0) {
      await db.query('DELETE FROM favorito WHERE id_usuario = ? AND id_mazo = ?', [idUsuario, idMazo]);
      const [[{ totalFavoritos }]] = await db.query('SELECT COUNT(*) AS totalFavoritos FROM favorito WHERE id_mazo = ?', [idMazo]);
      return res.json({
        exito: true,
        esFavorito: false,
        totalFavoritos: Number(totalFavoritos),
        mensaje: 'Mazo quitado de tus favoritos.'
      });
    } else {
      await db.query('INSERT INTO favorito (id_usuario, id_mazo) VALUES (?, ?)', [idUsuario, idMazo]);
      const [[{ totalFavoritos }]] = await db.query('SELECT COUNT(*) AS totalFavoritos FROM favorito WHERE id_mazo = ?', [idMazo]);
      return res.json({
        exito: true,
        esFavorito: true,
        totalFavoritos: Number(totalFavoritos),
        mensaje: '¡Mazo guardado en tus favoritos!'
      });
    }
  } catch (error) {
    console.error('Error al alternar favorito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al procesar favoritos: ' + error.message });
  }
});

// 6. Quitar favorito directamente
app.delete('/api/favoritos/:id_usuario/:id_mazo', async (req, res) => {
  try {
    const { id_usuario, id_mazo } = req.params;
    await db.query('DELETE FROM FAVORITO WHERE id_usuario = ? AND id_mazo = ?', [id_usuario, id_mazo]);
    res.json({ exito: true, mensaje: 'Mazo quitado de tus favoritos.' });
  } catch (error) {
    console.error('Error al quitar favorito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al quitar el mazo de favoritos.' });
  }
});


// Obtener valoraciones de un mazo
app.get('/api/mazos/:id/valoraciones', async (req, res) => {
  try {
    const idMazo = req.params.id;
    const [stats] = await db.query('SELECT ROUND(AVG(puntuacion), 1) AS promedio, COUNT(*) AS total FROM valoracion WHERE id_mazo = ?', [idMazo]);
    const [comentarios] = await db.query('SELECT v.id_valoracion, v.id_mazo, v.id_usuario, v.puntuacion, v.comentario, v.fecha_valoracion, u.nombre_usuario, u.correo FROM valoracion v JOIN usuario u ON v.id_usuario = u.id_usuario WHERE v.id_mazo = ? ORDER BY v.fecha_valoracion DESC', [idMazo]);
    res.json({ exito: true, id_mazo: idMazo, promedio: stats[0].promedio ? Number(stats[0].promedio) : null, total: Number(stats[0].total) || 0, datos: comentarios });
  } catch (error) {
    console.error('Error al obtener valoraciones:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar valoraciones.' });
  }
});

// Guardar o actualizar valoracion
app.post('/api/mazos/:id/valoraciones', async (req, res) => {
  try {
    const idMazo = req.params.id;
    const { id_usuario, puntuacion, comentario } = req.body;
    if (!id_usuario) return res.status(401).json({ exito: false, mensaje: 'Debes iniciar sesion para valorar un mazo.' });
    const numPuntuacion = Number(puntuacion);
    if (!numPuntuacion || numPuntuacion < 1 || numPuntuacion > 5) return res.status(400).json({ exito: false, mensaje: 'La puntuacion debe ser entre 1 y 5 estrellas.' });
    const comentarioLimpio = (comentario || '').trim();
    const [existente] = await db.query('SELECT id_valoracion FROM valoracion WHERE id_usuario = ? AND id_mazo = ?', [id_usuario, idMazo]);
    if (existente.length > 0) {
      await db.execute('UPDATE valoracion SET puntuacion = ?, comentario = ?, fecha_valoracion = NOW() WHERE id_valoracion = ?', [numPuntuacion, comentarioLimpio, existente[0].id_valoracion]);
      return res.json({ exito: true, mensaje: 'Tu reseña se ha actualizado correctamente.' });
    } else {
      await db.execute('INSERT INTO valoracion (id_mazo, id_usuario, puntuacion, comentario, fecha_valoracion) VALUES (?, ?, ?, ?, NOW())', [idMazo, id_usuario, numPuntuacion, comentarioLimpio]);
      return res.json({ exito: true, mensaje: '¡Gracias por tu valoracion!' });
    }
  } catch (error) {
    console.error('Error al guardar valoracion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno al guardar valoracion.' });
  }
});

// Eliminar valoracion
app.delete('/api/valoraciones/:id', async (req, res) => {
  try {
    const idValoracion = req.params.id;
    await db.execute('DELETE FROM valoracion WHERE id_valoracion = ?', [idValoracion]);
    res.json({ exito: true, mensaje: 'Valoracion eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar valoracion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar valoracion.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


