-- BD exclusiva del microservicio catálogo (solo productos; categorías vive en categorias-service)

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id VARCHAR(36),
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
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO productos (nombre, descripcion, precio, categoria)
VALUES ('Auriculares Bluetooth', 'Auriculares circumaurales inalámbricos.', 120.50, 'Electrónica');

INSERT INTO productos (nombre, descripcion, precio, categoria)
VALUES ('Teclado Mecánico', 'Teclado RGB Dockerizado.', 150.00, 'Periféricos');
