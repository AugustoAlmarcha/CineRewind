// backend/routes/peliculasRoutes.js
const express = require('express');
const router = express.Router();

const {
  buscarPeliculas,
  obtenerDetallePelicula,
  obtenerDetalleTemporada,
  obtenerDetalleEpisodioCompleto,
  obtenerProveedoresStreaming,
  obtenerTendencias,
  obtenerCreditosActor,
  obtenerFilmografiaActor,
} = require('../controllers/peliculasController');

// 1. Buscador global (TMDb multi-search)[cite: 1]
// GET /api/peliculas/buscar?query=...
router.get('/buscar', buscarPeliculas);

// 2. Tendencias semanales y populares por país (HU-04)[cite: 1]
// GET /api/peliculas/tendencias?tipo=movie|tv&pais=GLOBAL|AR|ES...
router.get('/tendencias', obtenerTendencias);

// 3. Ficha general de película o serie (detalles, temporadas, géneros)[cite: 1]
// GET /api/peliculas/detalle/:tipo/:tmdb_id
router.get('/detalle/:tipo/:tmdb_id', obtenerDetallePelicula);

// 4. Proveedores de streaming en Argentina (JustWatch / TMDb)[cite: 1]
// GET /api/peliculas/proveedores/:tipo/:tmdb_id
router.get('/proveedores/:tipo/:tmdb_id', obtenerProveedoresStreaming);

// 5. Episodios y capturas de una temporada concreta[cite: 1]
// GET /api/peliculas/serie/:tmdb_id/temporada/:season_number
router.get('/serie/:tmdb_id/temporada/:season_number', obtenerDetalleTemporada);

// 6. Ficha profunda de episodio individual (elenco de actores y captura)[cite: 1]
// GET /api/peliculas/serie/:tmdb_id/temporada/:temporada/episodio/:episodio
router.get('/serie/:tmdb_id/temporada/:temporada/episodio/:episodio', obtenerDetalleEpisodioCompleto);

router.get('/actor/:person_id/obras', obtenerCreditosActor);

router.get('/actor/:persona_id/filmografia', obtenerFilmografiaActor);

module.exports = router;