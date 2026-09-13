const express = require('express');
const router = express.Router();
const { buscarPeliculas, obtenerDetallePelicula } = require('../controllers/peliculasController');

// GET /api/peliculas/buscar?query=...
router.get('/buscar', buscarPeliculas);

// GET /api/peliculas/detalle/:tipo/:tmdb_id
router.get('/detalle/:tipo/:tmdb_id', obtenerDetallePelicula);

module.exports = router;