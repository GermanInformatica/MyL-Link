-- Destrucción de tablas existentes
DROP TABLE IF EXISTS VALORACION;
DROP TABLE IF EXISTS FAVORITO;
DROP TABLE IF EXISTS MAZO_CARTA;
DROP TABLE IF EXISTS MAZO;
DROP TABLE IF EXISTS CARTA;
DROP TABLE IF EXISTS USUARIO;

-- 1. Tabla: USUARIO
CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'USER',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla: CARTA
CREATE TABLE CARTA (
    id_carta INT AUTO_INCREMENT PRIMARY KEY,
    nombre_carta VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    coste INT NULL,
    fuerza INT NULL,
    raza VARCHAR(50) NULL,
    imagen_url VARCHAR(255) NULL,
    visitas_count INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla: MAZO
CREATE TABLE MAZO (
    id_mazo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_mazo VARCHAR(100) NOT NULL,
    es_publico BOOLEAN NOT NULL DEFAULT FALSE,
    descripcion_mazo TEXT NULL,
    fecha_creacion_mazo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_mazo_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO(id_usuario) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla: MAZO_CARTA (Tabla de vinculación muchos a muchos)
CREATE TABLE MAZO_CARTA (
    id_mazo INT NOT NULL,
    id_carta INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_mazo, id_carta),
    CONSTRAINT fk_mazocarta_mazo FOREIGN KEY (id_mazo) 
        REFERENCES MAZO(id_mazo) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_mazocarta_carta FOREIGN KEY (id_carta) 
        REFERENCES CARTA(id_carta) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabla: FAVORITO
CREATE TABLE FAVORITO (
    id_usuario INT NOT NULL,
    id_mazo INT NOT NULL,
    fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_mazo),
    CONSTRAINT fk_favorito_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO(id_usuario) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_favorito_mazo FOREIGN KEY (id_mazo) 
        REFERENCES MAZO(id_mazo) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabla: VALORACION
CREATE TABLE VALORACION (
    id_valoracion INT AUTO_INCREMENT PRIMARY KEY,
    id_mazo INT NOT NULL,
    id_usuario INT NOT NULL,
    puntuacion TINYINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario TEXT NULL,
    fecha_valoracion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_valoracion_mazo FOREIGN KEY (id_mazo) 
        REFERENCES MAZO(id_mazo) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_valoracion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO(id_usuario) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;