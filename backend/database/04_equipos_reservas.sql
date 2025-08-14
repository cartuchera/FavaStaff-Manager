-- ============================================
-- SISTEMA DE RESERVAS DE EQUIPOS - FAVASTAFF
-- ============================================

-- Tabla de equipos disponibles para préstamo
CREATE TABLE IF NOT EXISTS equipos_prestamo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'notebook', 'proyector', 'tablet', 'otros'
    marca VARCHAR(50),
    modelo VARCHAR(50),
    numero_serie VARCHAR(100) UNIQUE,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'disponible', -- 'disponible', 'en_uso', 'mantenimiento', 'baja'
    ubicacion VARCHAR(100), -- Donde se encuentra el equipo
    observaciones TEXT,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reservas de equipos
CREATE TABLE IF NOT EXISTS reservas_equipos (
    id SERIAL PRIMARY KEY,
    equipo_id INTEGER REFERENCES equipos_prestamo(id) ON DELETE CASCADE,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME DEFAULT '08:00',
    hora_fin TIME DEFAULT '17:00',
    motivo VARCHAR(200) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activa', -- 'activa', 'completada', 'cancelada'
    fecha_entrega TIMESTAMP NULL,
    fecha_devolucion TIMESTAMP NULL,
    entregado_por INTEGER REFERENCES empleados(id) NULL,
    recibido_por INTEGER REFERENCES empleados(id) NULL,
    observaciones_entrega TEXT,
    observaciones_devolucion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de movimientos de equipos
CREATE TABLE IF NOT EXISTS historial_equipos (
    id SERIAL PRIMARY KEY,
    equipo_id INTEGER REFERENCES equipos_prestamo(id) ON DELETE CASCADE,
    reserva_id INTEGER REFERENCES reservas_equipos(id) ON DELETE SET NULL,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- 'prestamo', 'devolucion', 'mantenimiento', 'baja'
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    realizado_por INTEGER REFERENCES empleados(id) ON DELETE SET NULL
);

-- Insertar equipos de ejemplo
INSERT INTO equipos_prestamo (nombre, tipo, marca, modelo, numero_serie, descripcion, ubicacion) VALUES
('Notebook Dell Administrativo', 'notebook', 'Dell', 'Latitude 3520', 'DL001', 'Notebook para presentaciones y trabajo administrativo', 'Oficina Sistemas'),
('Notebook HP Reuniones', 'notebook', 'HP', 'ProBook 450', 'HP001', 'Notebook con Office completo para reuniones', 'Oficina Sistemas'),
('Proyector Epson Sala 1', 'proyector', 'Epson', 'PowerLite X41+', 'EP001', 'Proyector para presentaciones en sala de reuniones', 'Sala de Reuniones 1'),
('Proyector BenQ Auditorio', 'proyector', 'BenQ', 'MX535', 'BQ001', 'Proyector de alta luminosidad para auditorio', 'Auditorio Principal'),
('Tablet Samsung Inspecciones', 'tablet', 'Samsung', 'Galaxy Tab A8', 'SM001', 'Tablet para inspecciones y formularios móviles', 'Oficina Calidad'),
('Cámara Digital Canon', 'camara', 'Canon', 'EOS Rebel T7', 'CN001', 'Cámara para documentación fotográfica', 'Oficina Sistemas'),
('Notebook Lenovo Capacitación', 'notebook', 'Lenovo', 'ThinkPad E14', 'LN001', 'Notebook para capacitaciones del personal', 'Aula de Capacitación');

-- Insertar algunas reservas de ejemplo (solo si hay empleados)
-- Nota: Estas se ejecutarán solo si existen empleados en la tabla
INSERT INTO reservas_equipos (equipo_id, empleado_id, fecha_inicio, fecha_fin, motivo, observaciones, estado)
SELECT 
    1, -- Notebook Dell
    e.id,
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days',
    'Presentación mensual de resultados',
    'Necesario para presentar informe a dirección',
    'activa'
FROM empleados e 
WHERE e.activo = true 
LIMIT 1;

INSERT INTO reservas_equipos (equipo_id, empleado_id, fecha_inicio, fecha_fin, motivo, observaciones, estado)
SELECT 
    3, -- Proyector Epson
    e.id,
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '2 days',
    'Capacitación personal de enfermería',
    'Capacitación sobre nuevos protocolos',
    'activa'
FROM empleados e 
WHERE e.activo = true 
OFFSET 1
LIMIT 1;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_fechas ON reservas_equipos(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas_equipos(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos_prestamo(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos_prestamo(tipo);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el timestamp en reservas
CREATE TRIGGER trigger_actualizar_reservas_timestamp
    BEFORE UPDATE ON reservas_equipos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para actualizar automáticamente el timestamp en equipos
CREATE TRIGGER trigger_actualizar_equipos_timestamp
    BEFORE UPDATE ON equipos_prestamo
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Vista para consultas rápidas de reservas con información completa
CREATE OR REPLACE VIEW vista_reservas_completa AS
SELECT 
    r.id as reserva_id,
    r.fecha_inicio,
    r.fecha_fin,
    r.hora_inicio,
    r.hora_fin,
    r.motivo,
    r.estado as estado_reserva,
    r.observaciones as observaciones_reserva,
    r.fecha_entrega,
    r.fecha_devolucion,
    e.nombre as nombre_equipo,
    e.tipo as tipo_equipo,
    e.marca,
    e.modelo,
    e.ubicacion,
    e.estado as estado_equipo,
    emp.nombre as nombre_empleado,
    emp.apellido as apellido_empleado,
    emp.numero_legajo,
    p.nombre as puesto_empleado,
    s.nombre as sector_empleado
FROM reservas_equipos r
JOIN equipos_prestamo e ON r.equipo_id = e.id
JOIN empleados emp ON r.empleado_id = emp.id
LEFT JOIN puestos p ON emp.puesto_id = p.id
LEFT JOIN sectores s ON emp.sector_id = s.id
ORDER BY r.fecha_inicio DESC;

-- Comentarios para documentación
COMMENT ON TABLE equipos_prestamo IS 'Catálogo de equipos disponibles para préstamo (notebooks, proyectores, etc.)';
COMMENT ON TABLE reservas_equipos IS 'Registro de todas las reservas de equipos realizadas por el personal';
COMMENT ON TABLE historial_equipos IS 'Historial completo de movimientos y acciones sobre los equipos';
COMMENT ON VIEW vista_reservas_completa IS 'Vista con información completa de reservas incluyendo datos del equipo y empleado';
