const express = require('express');
const router = express.Router();
const { 
  buscarPeliculas, 
  obtenerDetallePelicula, 
  obtenerDetalleTemporada // <-- Importar
} = require('../controllers/peliculasController');

router.get('/buscar', buscarPeliculas);
router.get('/detalle/:tipo/:tmdb_id', obtenerDetallePelicula);
router.get('/serie/:tmdb_id/temporada/:season_number', obtenerDetalleTemporada); // <-- Nueva ruta

module.exports = router;