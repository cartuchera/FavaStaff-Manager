const express = require('express');
const router = express.Router();
const pool = require('../db');

// ======================================
// RUTA DE PRUEBA
// ======================================
router.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as fecha_actual');
    res.json({ 
      message: 'Conexión exitosa',
      fecha: result.rows[0].fecha_actual 
    });
  } catch (error) {
    console.error('Error de conexión:', error);
    res.status(500).json({ 
      error: 'Error de conexión',
      details: error.message 
    });
  }
});

// ======================================
// OBTENER TODOS LOS EMPLEADOS
// ======================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.dni,
        e.nombre,
        e.apellido,
        e.email,
        e.telefono,
        e.numero_legajo,
        e.fecha_ingreso,
        e.activo,
        p.nombre as puesto,
        COALESCE(s.nombre, 'Sin sector específico') as sector
      FROM empleados e
      LEFT JOIN puestos p ON e.puesto_id = p.id
      LEFT JOIN sectores s ON e.sector_id = s.id
      ORDER BY e.nombre, e.apellido
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    console.error('Detalles del error:', error.message);
    console.error('Código del error:', error.code);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// OBTENER SOLO EMPLEADOS ACTIVOS
// ======================================
router.get('/activos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.email,
        e.numero_legajo,
        p.nombre as puesto,
        COALESCE(s.nombre, 'Sin sector específico') as sector
      FROM empleados e
      LEFT JOIN puestos p ON e.puesto_id = p.id
      LEFT JOIN sectores s ON e.sector_id = s.id
      WHERE e.activo = true
      ORDER BY e.nombre, e.apellido
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener empleados activos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ======================================
// CREAR NUEVO EMPLEADO
// ======================================
router.post('/', async (req, res) => {
  try {
    const {
      dni, nombre, apellido, email, telefono, numero_legajo,
      puesto_id, sector_id, fecha_ingreso
    } = req.body;

    // Validaciones básicas
    if (!dni || !nombre || !apellido || !email || !telefono || !fecha_ingreso) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: dni, nombre, apellido, email, telefono, fecha_ingreso' 
      });
    }

    const result = await pool.query(`
      INSERT INTO empleados (
        dni, nombre, apellido, email, telefono, numero_legajo,
        puesto_id, sector_id, fecha_ingreso
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      dni, nombre, apellido, email, telefono, numero_legajo,
      puesto_id, sector_id, fecha_ingreso
    ]);

    res.status(201).json({
      message: 'Empleado creado exitosamente',
      empleado: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    if (error.code === '23505') { // Violación de unicidad
      res.status(400).json({ error: 'El DNI o email ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

module.exports = router;
