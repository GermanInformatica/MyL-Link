# ⚔️ MyL Link - Plataforma de Mitos y Leyendas

Plataforma web para jugadores y coleccionistas del juego de cartas **Mitos y Leyendas** (Edición *Espada Sagrada*). Permite consultar cartas, armar mazos de 50 cartas, guardarlos, calificarlos y compartirlos con la comunidad.

---

## 📌 ¿Qué incluye el proyecto?

* **Catálogo de Cartas:** Búsqueda rápida y filtros combinados por tipo, raza, coste y fuerza.
* **Constructor de Mazos:** Herramienta interactiva para armar y validar mazos reglamentarios (exactamente 50 cartas y máximo 3 copias por carta).
* **Comunidad:** Galería de mazos públicos con sistema de puntuación mediante estrellas y comentarios.
* **Cuentas de Usuario:** Registro seguro, inicio de sesión, sistema de favoritos y gestión de mazos creados.
* **Panel de Administrador:** Gestión de usuarios y control total del catálogo de cartas (agregar, editar y eliminar con subida de imágenes).
* **Diseño Responsivo:** Interfaz adaptable y compatible con computadores y teléfonos móviles.

---

## 🛠️ Tecnologías

* **Frontend:** HTML5, CSS3 y JavaScript.
* **Backend:** Node.js y Express.
* **Base de Datos:** MySQL.

---

## 🚀 Cómo ejecutarlo en tu computador

1. **Clonar el proyecto:**
   ```bash
   git clone https://github.com/GermanInformatica/MyL-Link.git
   cd MyL-Link
   ```

2. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

3. **Configuración de Base de Datos:**
   * Asegúrate de tener MySQL ejecutándose localmente.
   * Crea la base de datos (por ejemplo `myl_link`) e importa el script con las tablas y datos iniciales:
     `backend/base_datos/esquema.sql`
   * Configura tus credenciales en el archivo `backend/.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`).

4. **Iniciar la aplicación:**
   ```bash
   node servidor.js
   ```

5. **Visualizar el proyecto:**
   Abre tu navegador web e ingresa a: `http://localhost:3000`

---

## 📄 Nota Académica y Legal

Este es un proyecto académico de titulación desarrollado estrictamente sin fines de lucro. Mitos y Leyendas, sus logotipos, diseños y reglas son propiedad exclusiva de sus respectivos creadores y titulares comerciales. El uso de las imágenes e información se realiza a título de ilustración e investigación académica.
