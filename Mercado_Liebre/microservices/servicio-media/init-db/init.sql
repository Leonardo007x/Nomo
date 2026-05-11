-- BD exclusiva del microservicio media.
-- Guarda trazabilidad mínima de archivos subidos.

CREATE TABLE IF NOT EXISTS media_assets (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    url TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'cloudinary',
    mime_type VARCHAR(100),
    bytes_size INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
