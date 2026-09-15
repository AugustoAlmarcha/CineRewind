const express = require('express');
const router = express.Router();
const {
  buscarPeliculas,
  obtenerDetallePelicula,
  obtenerDetalleTemporada,
  obtenerDetalleEpisodioCompleto,
} = require('../controllers/peliculasController');

// 1. Buscador
router.get('/buscar', buscarPeliculas);

// 2. Detalle de película o serie (AQUÍ ESTÁ LA CLAVE PARA LAS TEMPORADAS)
router.get('/detalle/:tipo/:tmdb_id', obtenerDetallePelicula);

// 3. Episodios de una temporada
router.get('/serie/:tmdb_id/temporada/:season_number', obtenerDetalleTemporada);

// 4. Detalle de un episodio específico
router.get('/serie/:tmdb_id/temporada/:temporada/episodio/:episodio', obtenerDetalleEpisodioCompleto);

module.exports = router;