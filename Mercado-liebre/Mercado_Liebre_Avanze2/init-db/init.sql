-- MySQL Init Script para Mercado Liebre

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY, -- UID generado por auth
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: tiendas
-- =============================================
CREATE TABLE IF NOT EXISTS tiendas (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    eslogan VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_postal VARCHAR(20),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    twitter VARCHAR(255),
    whatsapp VARCHAR(50),
    horario_apertura VARCHAR(10),
    horario_cierre VARCHAR(10),
    dias_abierto JSON,
    imagen_logo_url TEXT,
    imagen_banner_url TEXT,
    moneda VARCHAR(10) DEFAULT 'USD',
    idioma VARCHAR(10) DEFAULT 'es',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: temas
-- =============================================
CREATE TABLE IF NOT EXISTS temas (
    id VARCHAR(36) PRIMARY KEY,
    tienda_id VARCHAR(36) NOT NULL,
    color_primario VARCHAR(20) DEFAULT '#FFE600',
    color_secundario VARCHAR(20) DEFAULT '#3483FA',
    color_fondo VARCHAR(20) DEFAULT '#EBEBEB',
    color_texto VARCHAR(20) DEFAULT '#333333',
    color_texto_titulos VARCHAR(20) DEFAULT '#333333',
    fuente_titulos VARCHAR(50) DEFAULT 'Playfair Display',
    fuente_cuerpo VARCHAR(50) DEFAULT 'Inter',
    estilo_plantilla VARCHAR(50) DEFAULT 'moderno',
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: categorias
-- =============================================
CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(36) PRIMARY KEY,
    tienda_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE
);

-- =============================================
-- TABLA: productos
-- =============================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Para compatibilidad con el backend actual simple
    tienda_id VARCHAR(36),             -- Nullable temporario para compatibilidad API
    categoria_id VARCHAR(36),
    categoria VARCHAR(100) DEFAULT 'General',
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    imagen_url TEXT,
    caracteristicas JSON,
    disponible BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE SET NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- =============================================
-- SEMILLAS (BOOTSTRAP)
-- =============================================

INSERT INTO productos (nombre, descripcion, precio, categoria) 
VALUES ('Auriculares Bluetooth', 'Auriculares circumaurales inalámbricos.', 120.50, 'Electrónica');

INSERT INTO productos (nombre, descripcion, precio, categoria) 
VALUES ('Teclado Mecánico', 'Teclado RGB Dockerizado.', 150.00, 'Periféricos');
