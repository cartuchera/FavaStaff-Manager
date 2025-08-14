-- ============================================
-- CONSULTAS PARA REVISAR DATOS DE RESERVAS
-- Ejecutar en pgAdmin 4 para debug
-- ============================================

-- 1. Ver todas las reservas que existen
SELECT 
    r.id,
    r.fecha_inicio,
    r.fecha_fin,
    r.estado,
    r.motivo,
    e.nombre as empleado,
    eq.nombre as equipo
FROM reservas_equipos r
LEFT JOIN empleados e ON r.empleado_id = e.id
LEFT JOIN equipos_prestamo eq ON r.equipo_id = eq.id
ORDER BY r.fecha_inicio;

-- 2. Contar total de reservas
SELECT COUNT(*) as total_reservas FROM reservas_equipos;

-- 3. Ver reservas por estado
SELECT estado, COUNT(*) as cantidad 
FROM reservas_equipos 
GROUP BY estado;

-- 4. Ver reservas del mes actual
SELECT 
    r.fecha_inicio,
    r.fecha_fin,
    r.estado,
    r.motivo
FROM reservas_equipos r
WHERE EXTRACT(MONTH FROM r.fecha_inicio) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM r.fecha_inicio) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY r.fecha_inicio;

-- 5. Eliminar todas las reservas (SI QUIERES LIMPIAR TODO)
-- ¡CUIDADO! Esto borra todas las reservas
-- DELETE FROM reservas_equipos;

-- 6. Ver si hay reservas entre el 20 y 28
SELECT 
    r.id,
    r.fecha_inicio,
    r.fecha_fin,
    r.estado,
    r.motivo,
    e.nombre || ' ' || e.apellido as empleado,
    eq.nombre as equipo
FROM reservas_equipos r
LEFT JOIN empleados e ON r.empleado_id = e.id
LEFT JOIN equipos_prestamo eq ON r.equipo_id = eq.id
WHERE r.fecha_inicio <= '2025-08-28'
AND r.fecha_fin >= '2025-08-20'
ORDER BY r.fecha_inicio;
