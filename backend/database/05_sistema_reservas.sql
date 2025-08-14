-- ============================================
-- SCRIPT PARA SISTEMA DE RESERVAS DE EQUIPOS
-- Hospital FavaStaff - Ejecutar en pgAdmin 4
-- ============================================

-- 1. Tabla de tipos de equipos (notebooks, proyectores, etc.)
CREATE TABLE tipos_equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50) DEFAULT '💻',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de equipos disponibles para préstamo
CREATE TABLE equipos_prestamo (
    id SERIAL PRIMARY KEY,
    codigo_equipo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    tipo_equipo_id INTEGER REFERENCES tipos_equipos(id),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'en_uso', 'mantenimiento', 'fuera_servicio')),
    ubicacion_actual VARCHAR(200),
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_adquisicion DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla principal de reservas
CREATE TABLE reservas_equipos (
    id SERIAL PRIMARY KEY,
    equipo_id INTEGER NOT NULL REFERENCES equipos_prestamo(id),
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    usuario_reserva_id INTEGER REFERENCES usuarios(id), -- quien hizo la reserva
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME DEFAULT '08:00',
    hora_fin TIME DEFAULT '17:00',
    motivo VARCHAR(500) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'en_curso', 'finalizada', 'cancelada')),
    fecha_entrega TIMESTAMP,
    fecha_devolucion TIMESTAMP,
    usuario_entrega_id INTEGER REFERENCES usuarios(id),
    usuario_devolucion_id INTEGER REFERENCES usuarios(id),
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    comentarios_finales TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de historial de estados de reservas (auditoría)
CREATE TABLE historial_reservas (
    id SERIAL PRIMARY KEY,
    reserva_id INTEGER NOT NULL REFERENCES reservas_equipos(id),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    usuario_cambio_id INTEGER REFERENCES usuarios(id),
    motivo_cambio TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insertar tipos de equipos básicos
INSERT INTO tipos_equipos (nombre, descripcion, icono) VALUES
('Notebook', 'Computadoras portátiles para trabajo móvil', '💻'),
('Proyector', 'Equipos de proyección para presentaciones', '📽️'),
('Tablet', 'Dispositivos tablet para consultas móviles', '📱'),
('Monitor', 'Monitores adicionales para workstations', '🖥️'),
('Impresora Portátil', 'Impresoras móviles para reportes', '🖨️'),
('Cámara', 'Cámaras para documentación médica', '📷'),
('Micrófono', 'Equipos de audio para conferencias', '🎤'),
('Router Portátil', 'Equipos de conectividad móvil', '📡');

-- 6. Insertar los equipos reales del hospital
INSERT INTO equipos_prestamo (codigo_equipo, nombre, tipo_equipo_id, marca, modelo, descripcion, ubicacion_actual) VALUES
('NB001', 'Notebook Bangho Hospital', 1, 'Bangho', 'Max', 'Notebook principal del hospital', 'Depósito IT'),
('PRY001', 'Proyector Hospital', 2, 'Genérico', 'Proyector', 'Proyector para presentaciones y capacitaciones', 'Depósito IT'),
('CAM001', 'Cámara Hospital', 6, 'Canon', 'EOS', 'Cámara para documentación médica y eventos', 'Depósito IT');

-- 7. Crear índices para optimizar consultas
CREATE INDEX idx_reservas_fechas ON reservas_equipos(fecha_inicio, fecha_fin);
CREATE INDEX idx_reservas_empleado ON reservas_equipos(empleado_id);
CREATE INDEX idx_reservas_equipo ON reservas_equipos(equipo_id);
CREATE INDEX idx_reservas_estado ON reservas_equipos(estado);
CREATE INDEX idx_equipos_estado ON equipos_prestamo(estado);
CREATE INDEX idx_equipos_tipo ON equipos_prestamo(tipo_equipo_id);

-- 8. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear triggers para actualización automática
CREATE TRIGGER trigger_actualizar_equipos
    BEFORE UPDATE ON equipos_prestamo
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_actualizar_reservas
    BEFORE UPDATE ON reservas_equipos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- 10. Crear función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado_reserva()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_reservas (reserva_id, estado_anterior, estado_nuevo, motivo_cambio)
        VALUES (NEW.id, OLD.estado, NEW.estado, 'Cambio automático de estado');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear trigger para historial automático
CREATE TRIGGER trigger_historial_estado_reserva
    AFTER UPDATE ON reservas_equipos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_estado_reserva();

-- ============================================
-- CONSULTAS DE VERIFICACIÓN (Opcional)
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('tipos_equipos', 'equipos_prestamo', 'reservas_equipos', 'historial_reservas')
ORDER BY tablename;

-- Verificar los tipos de equipos insertados
SELECT * FROM tipos_equipos ORDER BY id;

-- Verificar los equipos insertados
SELECT 
    e.codigo_equipo,
    e.nombre,
    t.nombre as tipo_equipo,
    e.marca,
    e.modelo,
    e.estado
FROM equipos_prestamo e
JOIN tipos_equipos t ON e.tipo_equipo_id = t.id
ORDER BY e.codigo_equipo;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE tipos_equipos IS 'Catálogo de tipos de equipos disponibles para préstamo';
COMMENT ON TABLE equipos_prestamo IS 'Inventario de equipos físicos disponibles para reservar';
COMMENT ON TABLE reservas_equipos IS 'Registro de reservas de equipos por empleados';
COMMENT ON TABLE historial_reservas IS 'Auditoría de cambios de estado en las reservas';

COMMENT ON COLUMN reservas_equipos.estado IS 'Estados: pendiente, confirmada, en_curso, finalizada, cancelada';
COMMENT ON COLUMN equipos_prestamo.estado IS 'Estados: disponible, reservado, en_uso, mantenimiento, fuera_servicio';
