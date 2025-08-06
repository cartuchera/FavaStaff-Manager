const express = require('express');
const router = express.Router();
const pool = require('../db');

// ======================================
// OBTENER TODAS LAS BAJAS
// ======================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id as baja_id,
        b.fecha_baja,
        b.tipo_baja,
        b.motivo,
        b.observaciones,
        b.estado,
        e.nombre,
        e.apellido,
        e.dni,
        e.numero_legajo,
        p.nombre as puesto,
        COALESCE(s.nombre, 'Sin sector específico') as sector
      FROM bajas_empleados b
      JOIN empleados e ON b.empleado_id = e.id
      LEFT JOIN puestos p ON e.puesto_id = p.id
      LEFT JOIN sectores s ON e.sector_id = s.id
      ORDER BY b.fecha_baja DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bajas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// PROCESAR NUEVA BAJA DE EMPLEADO
// ======================================
router.post('/', async (req, res) => {
  try {
    const {
      empleado_id,
      fecha_baja,
      tipo_baja,
      motivo,
      observaciones
    } = req.body;

    // Validaciones básicas
    if (!empleado_id || !tipo_baja || !motivo) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: empleado_id, tipo_baja, motivo' 
      });
    }

    // Verificar que el empleado existe y está activo
    const empleado = await pool.query(
      'SELECT id, activo, nombre, apellido FROM empleados WHERE id = $1',
      [empleado_id]
    );

    if (empleado.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    if (!empleado.rows[0].activo) {
      return res.status(400).json({ error: 'El empleado ya está dado de baja' });
    }

    // Iniciar transacción
    await pool.query('BEGIN');

    try {
      // Insertar registro de baja
      const bajaResult = await pool.query(`
        INSERT INTO bajas_empleados (
          empleado_id, fecha_baja, tipo_baja, motivo, observaciones, procesado_por
        ) VALUES ($1, $2, $3, $4, $5, 1)
        RETURNING *
      `, [
        empleado_id, 
        fecha_baja || new Date().toISOString().split('T')[0], // Fecha actual si no se proporciona
        tipo_baja, 
        motivo, 
        observaciones
      ]);

      // Marcar empleado como inactivo
      await pool.query(`
        UPDATE empleados 
        SET activo = false
        WHERE id = $1
      `, [empleado_id]);

      await pool.query('COMMIT');

      res.status(201).json({
        message: `Baja procesada exitosamente para ${empleado.rows[0].nombre} ${empleado.rows[0].apellido}`,
        baja: bajaResult.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al procesar baja:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// OBTENER EMPLEADOS ACTIVOS (para el formulario de bajas)
// ======================================
router.get('/empleados-activos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.dni,
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
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ======================================
// ESTADÍSTICAS DE BAJAS
// ======================================
router.get('/estadisticas', async (req, res) => {
  try {
    // Total de bajas por tipo
    const porTipo = await pool.query(`
      SELECT 
        tipo_baja,
        COUNT(*) as cantidad
      FROM bajas_empleados
      GROUP BY tipo_baja
      ORDER BY cantidad DESC
    `);

    // Bajas por mes (últimos 6 meses)
    const porMes = await pool.query(`
      SELECT 
        TO_CHAR(fecha_baja, 'YYYY-MM') as mes,
        COUNT(*) as bajas
      FROM bajas_empleados
      WHERE fecha_baja >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(fecha_baja, 'YYYY-MM')
      ORDER BY mes DESC
    `);

    // Total empleados activos vs inactivos
    const totales = await pool.query(`
      SELECT 
        COUNT(CASE WHEN activo THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN NOT activo THEN 1 END) as empleados_inactivos,
        COUNT(*) as total_empleados
      FROM empleados
    `);

    res.json({
      por_tipo: porTipo.rows,
      por_mes: porMes.rows,
      totales: totales.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

module.exports = router;
