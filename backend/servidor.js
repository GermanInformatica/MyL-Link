const express = require('express');
const cors = require('cors');
const path = require('path'); // Importar el módulo nativo path
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

// Endpoint para obtener todas las cartas del catálogo
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});