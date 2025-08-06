const express = require('express');
const router = express.Router();
const pool = require('../db');

// ======================================
// OBTENER TODOS LOS PUESTOS
// ======================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.sector_id,
        s.nombre as sector_nombre,
        p.activo
      FROM puestos p
      LEFT JOIN sectores s ON p.sector_id = s.id
      WHERE p.activo = true
      ORDER BY p.nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// CREAR NUEVO PUESTO
// ======================================
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, salario_base } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        error: 'El nombre del puesto es obligatorio' 
      });
    }

    const result = await pool.query(`
      INSERT INTO puestos (nombre, descripcion, salario_base)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [nombre, descripcion, salario_base]);

    res.status(201).json({
      message: 'Puesto creado exitosamente',
      puesto: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear puesto:', error);
    if (error.code === '23505') { // Violación de unicidad
      res.status(400).json({ error: 'Ya existe un puesto con ese nombre' });
    } else {
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
});

module.exports = router;
