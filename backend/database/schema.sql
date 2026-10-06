-- ==========================================================
-- CineRewind: Esquema Definitivo de Base de Datos (PostgreSQL)
-- ==========================================================

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
    token_recuperacion TEXT,
    token_recuperacion_expira TIMESTAMP WITH TIME ZONE,
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
    visto_con_texto VARCHAR(255), -- Acompañantes manuales sin cuenta (ej: "Mamá", "Hermana")
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

-- 5. Tabla de Favoritos Destacados (Top 4 Series y Top 4 Películas del Perfil)
CREATE TABLE IF NOT EXISTS favoritos_top4 (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    posicion INTEGER NOT NULL CHECK (posicion BETWEEN 1 AND 4),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pelicula', 'serie')),
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_posicion_tipo UNIQUE (usuario_id, posicion, tipo)
);

-- 6. Tabla de Obras Pendientes (Watchlist / Ver más tarde)
CREATE TABLE IF NOT EXISTS obras_pendientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_obra_pendiente UNIQUE (usuario_id, obra_id)
);

-- 7. Tabla de Amistades y Red Social Cinéfila
CREATE TABLE IF NOT EXISTS amistades (
    id SERIAL PRIMARY KEY,
    remitente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    destinatario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Reglas de integridad
    CONSTRAINT uq_amistad_par UNIQUE (remitente_id, destinatario_id),
    CONSTRAINT check_amistad_distintos_usuarios CHECK (remitente_id <> destinatario_id)
);

-- 8. Tabla de Co-visualizaciones ("Visto con...")
CREATE TABLE IF NOT EXISTS covisualizaciones (
    id SERIAL PRIMARY KEY,
    visualizacion_id INTEGER NOT NULL REFERENCES historial_visualizaciones(id) ON DELETE CASCADE,
    amigo_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Evita duplicar invitaciones para una misma visualización
    CONSTRAINT uq_covision_par UNIQUE (visualizacion_id, amigo_id)
);

-- 9. Tabla de Calificaciones y Reseñas de Temporadas y Series Completas
CREATE TABLE IF NOT EXISTS calificaciones_series (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras_catalogo(id) ON DELETE CASCADE,
    temporada INTEGER DEFAULT NULL, -- NULL = Serie Completa; Número = Temporada específica (1, 2, 3...)
    calificacion NUMERIC(2, 1) NOT NULL,
    resenia TEXT,
    fecha_calificado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Índices de Rendimiento (PostgreSQL)
-- ==========================================================

-- Timeline y Consultas por Fecha
CREATE INDEX IF NOT EXISTS idx_historial_usuario_fecha 
ON historial_visualizaciones (usuario_id, fecha_visto DESC);

CREATE INDEX IF NOT EXISTS idx_historial_ciclo_viendo 
ON historial_visualizaciones (usuario_id, obra_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_historial_obra 
ON historial_visualizaciones (obra_id);

-- Catálogo Caché TMDb
CREATE INDEX IF NOT EXISTS idx_obras_tmdb_id 
ON obras_catalogo (tmdb_id);

-- Carrusel de Series Activas
CREATE INDEX IF NOT EXISTS idx_seguimiento_usuario_activo 
ON seguimiento_series (usuario_id, activo);

CREATE INDEX IF NOT EXISTS idx_seguimiento_reinicio
ON seguimiento_series (usuario_id, obra_id, fecha_reinicio);

-- Perfil y Watchlist
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_posicion_tipo 
ON favoritos_top4 (usuario_id, tipo, posicion ASC);

CREATE INDEX IF NOT EXISTS idx_pendientes_usuario 
ON obras_pendientes (usuario_id, creado_en DESC);

-- Amistades y Notificaciones
CREATE INDEX IF NOT EXISTS idx_amistades_remitente 
ON amistades (remitente_id, estado);

CREATE INDEX IF NOT EXISTS idx_amistades_destinatario 
ON amistades (destinatario_id, estado);

-- Co-visualizaciones
CREATE INDEX IF NOT EXISTS idx_covisualizaciones_amigo_estado 
ON covisualizaciones (amigo_id, estado);

CREATE INDEX IF NOT EXISTS idx_covisualizaciones_visualizacion 
ON covisualizaciones (visualizacion_id);

-- Calificaciones de Series y Temporadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_calif_serie_global 
ON calificaciones_series (usuario_id, obra_id) 
WHERE temporada IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calif_serie_temporada 
ON calificaciones_series (usuario_id, obra_id, temporada) 
WHERE temporada IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calif_serie_usuario 
ON calificaciones_series (usuario_id, fecha_calificado DESC);