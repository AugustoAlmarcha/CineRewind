-- CineRewind: Esquema Definitivo de Base de Datos

-- 1. Tabla de Usuarios (Soporte Dual: Contraseña y Google OAuth)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    biografia TEXT,
    banner_url TEXT,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Catálogo Local (Caché TMDb)
CREATE TABLE IF NOT EXISTS obras_catalogo (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pelicula', 'serie')),
    titulo VARCHAR(255) NOT NULL,
    poster_path TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Historial de Visualizaciones (Timeline)
CREATE TABLE IF NOT EXISTS historial_visualizaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE RESTRICT,
    temporada INTEGER,
    episodio INTEGER,
    fecha_visto DATE NOT NULL DEFAULT CURRENT_DATE,
    plataforma VARCHAR(50),
    pais VARCHAR(50),
    calificacion NUMERIC(2, 1),
    resenia TEXT,
    foto_episodio TEXT,
    es_final_temporada BOOLEAN DEFAULT false,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Estado de Seguimiento de Series (Viendo Actualmente / Rewatch)
CREATE TABLE IF NOT EXISTS seguimiento_series (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    total_episodios_temporada INTEGER DEFAULT NULL,
    fecha_reinicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, obra_id)
);

-- 5. Tabla de Favoritos Destacados (Top 4 del Perfil)
CREATE TABLE IF NOT EXISTS favoritos_top4 (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    posicion INTEGER NOT NULL CHECK (posicion BETWEEN 1 AND 4),
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_posicion UNIQUE (usuario_id, posicion)
);

-- 6. Tabla de Obras Pendientes (Watchlist / Ver más tarde)
CREATE TABLE IF NOT EXISTS obras_pendientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_obra_pendiente UNIQUE (usuario_id, obra_id)
);

-- ==========================================================
-- Índices de Rendimiento (PostgreSQL)
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_historial_usuario_fecha 
ON historial_visualizaciones (usuario_id, fecha_visto DESC);

CREATE INDEX IF NOT EXISTS idx_historial_ciclo_viendo 
ON historial_visualizaciones (usuario_id, obra_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_historial_obra 
ON historial_visualizaciones (obra_id);

CREATE INDEX IF NOT EXISTS idx_obras_tmdb_id 
ON obras_catalogo (tmdb_id);

CREATE INDEX IF NOT EXISTS idx_seguimiento_usuario_activo 
ON seguimiento_series (usuario_id, activo);

CREATE INDEX IF NOT EXISTS idx_seguimiento_reinicio
ON seguimiento_series (usuario_id, obra_id, fecha_reinicio);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_posicion 
ON favoritos_top4 (usuario_id, posicion ASC);

CREATE INDEX IF NOT EXISTS idx_pendientes_usuario 
ON obras_pendientes (usuario_id, creado_en DESC);