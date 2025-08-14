const express = require('express');
const router = express.Router();
const pool = require('../db');
const { enviarNotificacionBaja, enviarRecordatorioEquipos } = require('../services/emailService');

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
    const empleadoQuery = await pool.query(`
      SELECT 
        e.id, e.activo, e.nombre, e.apellido, e.dni, e.numero_legajo,
        p.nombre as puesto,
        COALESCE(s.nombre, 'Sin sector específico') as sector
      FROM empleados e
      LEFT JOIN puestos p ON e.puesto_id = p.id
      LEFT JOIN sectores s ON e.sector_id = s.id
      WHERE e.id = $1
    `, [empleado_id]);

    if (empleadoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const empleadoData = empleadoQuery.rows[0];

    if (!empleadoData.activo) {
      return res.status(400).json({ error: 'El empleado ya está dado de baja' });
    }

    // Verificar equipos pendientes de devolución
    const equiposPendientes = await pool.query(`
      SELECT DISTINCT
        eq.id, eq.nombre, eq.codigo_equipo, eq.marca, eq.modelo
      FROM reservas r
      JOIN equipos eq ON r.equipo_id = eq.id
      WHERE r.empleado_id = $1 
        AND r.estado IN ('confirmada', 'en_curso')
        AND r.fecha_fin >= CURRENT_DATE
    `, [empleado_id]);

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

      // Cancelar reservas futuras del empleado
      await pool.query(`
        UPDATE reservas 
        SET estado = 'cancelada',
            observaciones = COALESCE(observaciones, '') || ' - CANCELADA POR BAJA DE EMPLEADO'
        WHERE empleado_id = $1 
          AND estado IN ('pendiente', 'confirmada') 
          AND fecha_inicio > CURRENT_DATE
      `, [empleado_id]);

      await pool.query('COMMIT');

      // Preparar datos para el email
      const bajaData = {
        fecha_baja: bajaResult.rows[0].fecha_baja,
        tipo_baja: tipo_baja,
        motivo: motivo,
        observaciones: observaciones
      };

      // Enviar notificación por email de forma asíncrona
      setTimeout(async () => {
        try {
          const emailResult = await enviarNotificacionBaja(empleadoData, bajaData);
          
          if (emailResult.success) {
            console.log(`✅ Email de baja enviado exitosamente para ${empleadoData.nombre} ${empleadoData.apellido}`);
            
            // Si hay equipos pendientes, enviar recordatorio adicional
            if (equiposPendientes.rows.length > 0) {
              const recordatorioResult = await enviarRecordatorioEquipos(empleadoData, equiposPendientes.rows);
              if (recordatorioResult.success) {
                console.log(`✅ Recordatorio de equipos enviado para ${empleadoData.nombre} ${empleadoData.apellido}`);
              }
            }
          } else {
            console.error(`❌ Error al enviar email de baja: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error('❌ Error en proceso de email:', emailError);
        }
      }, 1000); // Delay de 1 segundo para no bloquear la respuesta

      // Respuesta exitosa
      const mensaje = equiposPendientes.rows.length > 0 
        ? `Baja procesada exitosamente para ${empleadoData.nombre} ${empleadoData.apellido}. ATENCIÓN: El empleado tiene ${equiposPendientes.rows.length} equipo(s) pendiente(s) de devolución.`
        : `Baja procesada exitosamente para ${empleadoData.nombre} ${empleadoData.apellido}`;

      res.status(201).json({
        message: mensaje,
        baja: bajaResult.rows[0],
        equipos_pendientes: equiposPendientes.rows,
        notificacion_email: 'Enviando notificación por email a sistemas...'
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
// REENVIAR NOTIFICACIÓN DE EMAIL
// ======================================
router.post('/:bajaId/reenviar-email', async (req, res) => {
  try {
    const { bajaId } = req.params;

    // Obtener datos de la baja y empleado
    const result = await pool.query(`
      SELECT 
        b.id as baja_id,
        b.fecha_baja,
        b.tipo_baja,
        b.motivo,
        b.observaciones,
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
      WHERE b.id = $1
    `, [bajaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Baja no encontrada' });
    }

    const baja = result.rows[0];
    
    const empleadoData = {
      nombre: baja.nombre,
      apellido: baja.apellido,
      dni: baja.dni,
      numero_legajo: baja.numero_legajo,
      puesto: baja.puesto,
      sector: baja.sector
    };

    const bajaData = {
      fecha_baja: baja.fecha_baja,
      tipo_baja: baja.tipo_baja,
      motivo: baja.motivo,
      observaciones: baja.observaciones
    };

    // Enviar email
    const emailResult = await enviarNotificacionBaja(empleadoData, bajaData);

    if (emailResult.success) {
      res.json({
        message: 'Notificación reenviada exitosamente',
        destinatarios: emailResult.destinatarios,
        messageId: emailResult.messageId
      });
    } else {
      res.status(500).json({
        error: 'Error al reenviar notificación',
        details: emailResult.error
      });
    }

  } catch (error) {
    console.error('Error al reenviar email:', error);
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
