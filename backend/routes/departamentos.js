const express = require('express');
const router = express.Router();
const pool = require('../db');

// ======================================
// OBTENER TODOS LOS SECTORES
// ======================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        activo
      FROM sectores
      WHERE activo = true
      ORDER BY nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// CREAR NUEVO SECTOR
// ======================================
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        error: 'El nombre del sector es obligatorio' 
      });
    }

    const result = await pool.query(`
      INSERT INTO sectores (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `, [nombre, descripcion]);

    res.status(201).json({
      message: 'Sector creado exitosamente',
      sector: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear sector:', error);
    if (error.code === '23505') { // Violación de unicidad
      res.status(400).json({ error: 'Ya existe un sector con ese nombre' });
    } else {
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
});

module.exports = router;
