const fs = require('fs');
const path = require('path');
const db = require('./conexion');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function cargarDatos() {
  try {
    const rutaCsv = path.join(__dirname, 'cartas.csv');
    const contenido = fs.readFileSync(rutaCsv, 'utf-8');
    const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
    const filas = lineas.slice(1);

    console.log(`Cargando ${filas.length} cartas a la base de datos...`);

    for (const linea of filas) {
      const datos = parseCSVLine(linea);
      if (datos.length >= 8) {
        let [id_carta, nombre_carta, tipo, coste, fuerza, raza, imagen_url, visitas_count] = datos;
        if (nombre_carta.startsWith('"') && nombre_carta.endsWith('"')) {
          nombre_carta = nombre_carta.slice(1, -1);
        }
        const formattedId = String(id_carta).padStart(3, '0');
        const realImg = `/img/cartas/${formattedId}.png`;
        const costeNum = (coste !== '' && !isNaN(parseInt(coste))) ? parseInt(coste) : null;
        const fuerzaNum = (fuerza !== '' && !isNaN(parseInt(fuerza))) ? parseInt(fuerza) : null;
        const razaVal = (raza !== '' && raza !== null && raza !== undefined) ? raza : null;

        const sql = `
          INSERT INTO CARTA (id_carta, nombre_carta, tipo, coste, fuerza, raza, imagen_url, visitas_count)
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
          costeNum,
          fuerzaNum,
          razaVal,
          realImg,
          parseInt(visitas_count) || 0
        ]);
      }
    }

    const [count] = await db.query('SELECT COUNT(*) as total FROM CARTA');
    console.log(`TOTAL CARTAS EN BD: ${count[0].total}`);
    const [tipos] = await db.query('SELECT tipo, COUNT(*) as cant FROM CARTA GROUP BY tipo');
    console.log('Desglose por tipo:', tipos);
    process.exit(0);
  } catch (error) {
    console.error('Error al cargar las cartas:', error);
    process.exit(1);
  }
}

cargarDatos();
