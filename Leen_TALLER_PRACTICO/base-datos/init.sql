-- Script de inicialización para Leen (UTF-8)
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO libros (titulo, autor) VALUES 
('Cien años de soledad', 'Gabriel García Márquez'),
('El amor en los tiempos del cólera', 'Gabriel García Márquez'),
('Crónica de una muerte anunciada', 'Gabriel García Márquez'),
('La vorágine', 'José Eustasio Rivera'),
('María', 'Jorge Isaacs'),
('Delirio', 'Laura Restrepo'),
('El olvido que seremos', 'Héctor Abad Faciolince'),
('Don Quijote de la Mancha', 'Miguel de Cervantes'),
('El principito', 'Antoine de Saint-Exupéry');
