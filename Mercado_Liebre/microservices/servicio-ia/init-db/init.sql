-- BD exclusiva del microservicio IA.
-- Registro mínimo de prompts/respuestas para trazabilidad.

CREATE TABLE IF NOT EXISTS ia_generaciones (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'groq',
    modelo VARCHAR(100) NOT NULL,
    prompt_usuario TEXT NOT NULL,
    prompt_sistema TEXT,
    respuesta TEXT,
    error_msg TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
