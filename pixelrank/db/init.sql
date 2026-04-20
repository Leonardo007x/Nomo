-- PixelRank: inicialización de base de datos
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS juegos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    titulo        VARCHAR(200) NOT NULL,
    desarrollador VARCHAR(100) NOT NULL,
    genero        VARCHAR(60)  NOT NULL,
    anio          YEAR         NOT NULL,
    puntuacion    DECIMAL(3,1) NOT NULL CHECK (puntuacion BETWEEN 0 AND 10)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO juegos (titulo, desarrollador, genero, anio, puntuacion) VALUES
('The Last of Us Part I',        'Naughty Dog',         'Aventura',    2022, 9.5),
('God of War Ragnarök',          'Santa Monica Studio', 'Acción',      2022, 9.3),
('Hollow Knight',                'Team Cherry',         'Metroidvania',2017, 9.2),
('Hades',                        'Supergiant Games',    'Roguelike',   2020, 9.4),
('Celeste',                      'Maddy Makes Games',   'Plataformas', 2018, 9.1),
('Red Dead Redemption 2',        'Rockstar Games',      'Mundo Abierto',2018,9.6),
('Portal 2',                     'Valve',               'Puzles',      2011, 9.5),
('Stardew Valley',               'ConcernedApe',        'Simulación',  2016, 9.0),
('Undertale',                    'Toby Fox',            'RPG',         2015, 9.2),
('Disco Elysium',                'ZA/UM',               'RPG',         2019, 9.4),
('Sekiro: Shadows Die Twice',    'FromSoftware',        'Acción',      2019, 9.1),
('Ori and the Will of the Wisps','Moon Studios',        'Metroidvania',2020, 9.0);
