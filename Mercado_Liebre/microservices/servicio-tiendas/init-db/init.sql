-- BD exclusiva del microservicio tiendas (sin FK hacia usuarios u otros dominios)

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
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
