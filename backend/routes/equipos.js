const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/ping', (req, res) => {
  res.send('pong');
});

// Ruta GET /equipos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id, 
        e.nombre, 
        e.tipo, 
        e.fecha_adquisicion, 
        e.estado, 
        u.nombre AS ubicacion
      FROM equipos e
      JOIN ubicaciones u ON e.ubicacion_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('ERROR DETALLADO:', err); // Cambia aquí para ver el error completo
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;


// iniciar servidor : npm run dev 
