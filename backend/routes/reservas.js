const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// RUTAS PARA SISTEMA DE RESERVAS DE EQUIPOS
// ============================================

// 1. Obtener todos los equipos disponibles para préstamo
router.get('/equipos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.id,
                e.codigo_equipo,
                e.nombre,
                e.marca,
                e.modelo,
                e.descripcion,
                e.estado,
                e.ubicacion_actual,
                t.nombre as tipo_equipo,
                t.icono
            FROM equipos_prestamo e
            JOIN tipos_equipos t ON e.tipo_equipo_id = t.id
            WHERE e.activo = true
            ORDER BY e.codigo_equipo
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener equipos:', err);
        res.status(500).json({ error: 'Error al obtener equipos' });
    }
});

// 2. Obtener equipos disponibles para una fecha específica
router.get('/equipos/disponibles/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;
        const result = await pool.query(`
            SELECT 
                e.id,
                e.codigo_equipo,
                e.nombre,
                e.marca,
                e.modelo,
                e.descripcion,
                e.estado,
                e.ubicacion_actual,
                t.nombre as tipo_equipo,
                t.icono
            FROM equipos_prestamo e
            JOIN tipos_equipos t ON e.tipo_equipo_id = t.id
            WHERE e.activo = true
            AND e.id NOT IN (
                SELECT equipo_id 
                FROM reservas_equipos 
                WHERE fecha_inicio <= $1 
                AND fecha_fin >= $1 
                AND estado IN ('pendiente', 'confirmada', 'en_curso')
            )
            ORDER BY e.codigo_equipo
        `, [fecha]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener equipos disponibles:', err);
        res.status(500).json({ error: 'Error al obtener equipos disponibles' });
    }
});

// 3. Obtener todas las reservas con información completa
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id,
                r.fecha_inicio,
                r.fecha_fin,
                r.hora_inicio,
                r.hora_fin,
                r.motivo,
                r.observaciones,
                r.estado,
                r.fecha_entrega,
                r.fecha_devolucion,
                r.calificacion,
                r.comentarios_finales,
                r.fecha_creacion,
                e.nombre as empleado_nombre,
                e.apellido as empleado_apellido,
                e.numero_legajo,
                eq.codigo_equipo,
                eq.nombre as equipo_nombre,
                eq.marca,
                eq.modelo,
                t.nombre as tipo_equipo,
                t.icono
            FROM reservas_equipos r
            JOIN empleados e ON r.empleado_id = e.id
            JOIN equipos_prestamo eq ON r.equipo_id = eq.id
            JOIN tipos_equipos t ON eq.tipo_equipo_id = t.id
            ORDER BY r.fecha_inicio DESC, r.fecha_creacion DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reservas:', err);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

// 4. Obtener reservas de una fecha específica
router.get('/fecha/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;
        const result = await pool.query(`
            SELECT 
                r.id,
                r.fecha_inicio,
                r.fecha_fin,
                r.hora_inicio,
                r.hora_fin,
                r.motivo,
                r.observaciones,
                r.estado,
                e.nombre as empleado_nombre,
                e.apellido as empleado_apellido,
                e.numero_legajo,
                eq.codigo_equipo,
                eq.nombre as equipo_nombre,
                eq.marca,
                eq.modelo,
                t.nombre as tipo_equipo,
                t.icono
            FROM reservas_equipos r
            JOIN empleados e ON r.empleado_id = e.id
            JOIN equipos_prestamo eq ON r.equipo_id = eq.id
            JOIN tipos_equipos t ON eq.tipo_equipo_id = t.id
            WHERE r.fecha_inicio <= $1 AND r.fecha_fin >= $1
            ORDER BY r.hora_inicio
        `, [fecha]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener reservas del día:', err);
        res.status(500).json({ error: 'Error al obtener reservas del día' });
    }
});

// 5. Crear nueva reserva
router.post('/', async (req, res) => {
    try {
        const {
            equipo_id,
            empleado_id,
            usuario_reserva_id,
            fecha_inicio,
            fecha_fin,
            hora_inicio,
            hora_fin,
            motivo,
            observaciones
        } = req.body;

        // Validar que no haya conflictos de fechas
        const conflictCheck = await pool.query(`
            SELECT id FROM reservas_equipos 
            WHERE equipo_id = $1 
            AND (
                (fecha_inicio <= $2 AND fecha_fin >= $2) OR
                (fecha_inicio <= $3 AND fecha_fin >= $3) OR
                (fecha_inicio >= $2 AND fecha_fin <= $3)
            )
            AND estado IN ('pendiente', 'confirmada', 'en_curso')
        `, [equipo_id, fecha_inicio, fecha_fin]);

        if (conflictCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El equipo ya está reservado para esas fechas' 
            });
        }

        // Crear la reserva
        const result = await pool.query(`
            INSERT INTO reservas_equipos (
                equipo_id, empleado_id, usuario_reserva_id, 
                fecha_inicio, fecha_fin, hora_inicio, hora_fin,
                motivo, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            equipo_id, empleado_id, usuario_reserva_id,
            fecha_inicio, fecha_fin, hora_inicio, hora_fin,
            motivo, observaciones
        ]);

        // Actualizar estado del equipo a "reservado"
        await pool.query(`
            UPDATE equipos_prestamo 
            SET estado = 'reservado' 
            WHERE id = $1
        `, [equipo_id]);

        res.status(201).json({
            message: 'Reserva creada exitosamente',
            reserva: result.rows[0]
        });

    } catch (err) {
        console.error('Error al crear reserva:', err);
        res.status(500).json({ error: 'Error al crear reserva' });
    }
});

// 6. Actualizar estado de reserva
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, usuario_id, motivo_cambio } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Actualizar estado de la reserva
            const result = await client.query(`
                UPDATE reservas_equipos 
                SET estado = $1,
                    ${estado === 'en_curso' ? 'fecha_entrega = CURRENT_TIMESTAMP,' : ''}
                    ${estado === 'finalizada' ? 'fecha_devolucion = CURRENT_TIMESTAMP,' : ''}
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `, [estado, id]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }

            const reserva = result.rows[0];

            // Actualizar estado del equipo según el estado de la reserva
            let estadoEquipo = 'disponible';
            if (estado === 'confirmada' || estado === 'pendiente') {
                estadoEquipo = 'reservado';
            } else if (estado === 'en_curso') {
                estadoEquipo = 'en_uso';
            } else if (estado === 'finalizada' || estado === 'cancelada') {
                estadoEquipo = 'disponible';
            }

            await client.query(`
                UPDATE equipos_prestamo 
                SET estado = $1 
                WHERE id = $2
            `, [estadoEquipo, reserva.equipo_id]);

            // Registrar en historial si se proporcionó motivo
            if (motivo_cambio) {
                await client.query(`
                    INSERT INTO historial_reservas (
                        reserva_id, estado_nuevo, usuario_cambio_id, motivo_cambio
                    ) VALUES ($1, $2, $3, $4)
                `, [id, estado, usuario_id, motivo_cambio]);
            }

            await client.query('COMMIT');
            res.json({
                message: 'Estado actualizado exitosamente',
                reserva: reserva
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error al actualizar estado:', err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// 7. Obtener empleados activos para el formulario
router.get('/empleados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                numero_legajo,
                nombre,
                apellido,
                dni
            FROM empleados 
            WHERE activo = true
            ORDER BY apellido, nombre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

// 8. Obtener estadísticas de reservas
router.get('/estadisticas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_reservas,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
                COUNT(CASE WHEN estado = 'en_curso' THEN 1 END) as en_curso,
                COUNT(CASE WHEN estado = 'finalizada' THEN 1 END) as finalizadas,
                COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
                COUNT(CASE WHEN fecha_inicio = CURRENT_DATE AND estado != 'cancelada' THEN 1 END) as hoy,
                COUNT(CASE WHEN DATE_TRUNC('month', fecha_inicio) = DATE_TRUNC('month', CURRENT_DATE) AND estado != 'cancelada' THEN 1 END) as este_mes
            FROM reservas_equipos
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// 9. Cancelar reserva
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_cancelacion, usuario_id } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener datos de la reserva antes de cancelar
            const reservaResult = await client.query(`
                SELECT equipo_id, estado FROM reservas_equipos WHERE id = $1
            `, [id]);

            if (reservaResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Reserva no encontrada' });
            }

            const { equipo_id, estado } = reservaResult.rows[0];

            // Actualizar reserva a cancelada
            await client.query(`
                UPDATE reservas_equipos 
                SET estado = 'cancelada',
                    observaciones = COALESCE(observaciones, '') || 
                                  CASE WHEN observaciones IS NOT NULL AND observaciones != '' 
                                       THEN ' | CANCELADA: ' || $2
                                       ELSE 'CANCELADA: ' || $2 END,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [id, motivo_cancelacion || 'Sin motivo especificado']);

            // Si el equipo estaba reservado, liberarlo
            if (estado === 'pendiente' || estado === 'confirmada') {
                await client.query(`
                    UPDATE equipos_prestamo 
                    SET estado = 'disponible' 
                    WHERE id = $1
                `, [equipo_id]);
            }

            // Registrar en historial
            await client.query(`
                INSERT INTO historial_reservas (
                    reserva_id, estado_anterior, estado_nuevo, 
                    usuario_cambio_id, motivo_cambio
                ) VALUES ($1, $2, 'cancelada', $3, $4)
            `, [id, estado, usuario_id, motivo_cancelacion || 'Cancelación sin motivo']);

            await client.query('COMMIT');
            res.json({ message: 'Reserva cancelada exitosamente' });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error al cancelar reserva:', err);
        res.status(500).json({ error: 'Error al cancelar reserva' });
    }
});

module.exports = router;
