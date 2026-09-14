const fs = require('fs');
const path = require('path');
const db = require('./conexion');

async function cargarDatos() {
  try {
    // Lee el archivo cartas.csv ubicado en la raíz o donde lo tengas guardado
    const rutaCsv = path.join(__dirname, 'cartas.csv');
    const contenido = fs.readFileSync(rutaCsv, 'utf-8');

    // Separa el texto por líneas
    const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
    
    // Omite la cabecera (primera línea)
    const filas = lineas.slice(1);

    console.log(`Cargando ${filas.length} cartas a la base de datos...`);

    for (const linea of filas) {
      // Expresión regular para separar por comas respetando los textos entre comillas
      const valores = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      
      // Limpia comillas si existen
      const datos = valores.map(v => v.replace(/^"|"$/g, '').trim());

      if (datos.length >= 8) {
        const [id_carta, nombre_carta, tipo, coste, fuerza, raza, imagen_url, visitas_count] = datos;

        const sql = `
          INSERT INTO carta (id_carta, nombre_carta, tipo, coste, fuerza, raza, imagen_url, visitas_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            nombre_carta = VALUES(nombre_carta),
            tipo = VALUES(tipo),
            coste = VALUES(coste),
            fuerza = VALUES(fuerza),
            raza = VALUES(raza),
            imagen_url = VALUES(imagen_url);
        `;

        await db.query(sql, [
          parseInt(id_carta),
          nombre_carta,
          tipo,
          coste !== '' ? parseInt(coste) : null,
          fuerza !== '' ? parseInt(fuerza) : null,
          raza !== '' ? raza : null,
          imagen_url,
          parseInt(visitas_count) || 0
        ]);
      }
    }

    console.log('¡Cartas cargadas con éxito en MySQL!');
    process.exit(0);
  } catch (error) {
    console.error('Error al cargar las cartas:', error);
    process.exit(1);
  }
}

cargarDatos();