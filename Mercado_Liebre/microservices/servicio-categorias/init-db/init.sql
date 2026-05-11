-- BD exclusiva del microservicio categorías.

CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(36) PRIMARY KEY,
    tienda_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
