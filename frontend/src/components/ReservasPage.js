import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarioReservas from './CalendarioReservas';
import ToastNotification from './ToastNotification';
import useNotifications from '../hooks/useNotifications';
import './ReservasPage.css';

function ReservasPage({ usuarioActual, onVolver }) {
  const [reservas, setReservas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Hook de notificaciones
  const {
    notifications,
    removeNotification,
    notifyReservaCreada,
    notifyEstadoReserva,
    notifyValidationError,
    notifyConflictoReserva,
    showSuccess,
    showError,
    showWarning
  } = useNotifications();

  // Ref para el formulario
  const formularioRef = React.useRef(null);

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '08:00',
    hora_fin: '17:00',
    motivo: '',
    observaciones: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [reservasRes, equiposRes, empleadosRes, estadisticasRes] = await Promise.all([
        axios.get('http://localhost:3000/reservas'),
        axios.get('http://localhost:3000/reservas/equipos'),
        axios.get('http://localhost:3000/reservas/empleados'),
        axios.get('http://localhost:3000/reservas/estadisticas')
      ]);

      setReservas(reservasRes.data);
      setEquipos(equiposRes.data);
      setEmpleados(empleadosRes.data);
      setEstadisticas(estadisticasRes.data);
      
      // Debug temporal - mostrar reservas en consola
      console.log('Reservas cargadas:', reservasRes.data);
      console.log('Total de reservas:', reservasRes.data.length);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError(
        'Error al cargar datos', 
        'No se pudieron cargar los datos del sistema de reservas. Verifique la conexión.'
      );
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    const camposRequeridos = [];
    if (!formData.equipo_id) camposRequeridos.push('Equipo');
    if (!formData.empleado_id) camposRequeridos.push('Empleado');
    if (!formData.fecha_inicio) camposRequeridos.push('Fecha inicio');
    if (!formData.fecha_fin) camposRequeridos.push('Fecha fin');
    if (!formData.motivo) camposRequeridos.push('Motivo');

    if (camposRequeridos.length > 0) {
      notifyValidationError(camposRequeridos);
      return;
    }

    if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      showError(
        'Error en fechas',
        'La fecha de fin no puede ser anterior a la fecha de inicio'
      );
      return;
    }

    try {
      const reservaData = {
        ...formData,
        usuario_reserva_id: usuarioActual?.id
      };

      await axios.post('http://localhost:3000/reservas', reservaData);
      
      // Obtener nombres para la notificación
      const equipoSeleccionado = equipos.find(eq => eq.id === parseInt(formData.equipo_id));
      const empleadoSeleccionado = empleados.find(emp => emp.id === parseInt(formData.empleado_id));
      
      notifyReservaCreada(
        equipoSeleccionado?.nombre || 'Equipo',
        `${empleadoSeleccionado?.nombre || ''} ${empleadoSeleccionado?.apellido || ''}`.trim()
      );
      
      setMostrarFormulario(false);
      setFormData({
        equipo_id: '',
        empleado_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '08:00',
        hora_fin: '17:00',
        motivo: '',
        observaciones: ''
      });
      
      cargarDatos();
    } catch (error) {
      console.error('Error al crear reserva:', error);
      if (error.response?.data?.error) {
        showError('Error al crear reserva', error.response.data.error);
      } else {
        showError(
          'Error al crear reserva',
          'No se pudo crear la reserva. Por favor intente nuevamente.'
        );
      }
    }
  };

  const cambiarEstadoReserva = async (reservaId, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:3000/reservas/${reservaId}/estado`, {
        estado: nuevoEstado,
        usuario_id: usuarioActual?.id,
        motivo_cambio: `Cambio de estado a ${nuevoEstado}`
      });
      
      // Encontrar la reserva para obtener el nombre del equipo
      const reserva = reservas.find(r => r.id === reservaId);
      notifyEstadoReserva(nuevoEstado, reserva?.equipo_nombre || 'Equipo');
      
      cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showError(
        'Error al cambiar estado',
        'No se pudo cambiar el estado de la reserva. Intente nuevamente.'
      );
    }
  };

  // Función para manejar mostrar/ocultar formulario con auto-scroll
  const toggleFormulario = () => {
    if (!mostrarFormulario) {
      // Si estamos abriendo el formulario
      setMostrarFormulario(true);
      // Hacer scroll suave al formulario después de un pequeño delay
      setTimeout(() => {
        formularioRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest' 
        });
      }, 100);
    } else {
      // Si estamos cerrando el formulario
      setMostrarFormulario(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    const reserva = reservas.find(r => r.id === reservaId);
    
    if (!window.confirm(`¿Está seguro de cancelar la reserva de ${reserva?.equipo_nombre || 'este equipo'}?`)) {
      return;
    }
    
    const motivo = prompt('Motivo de cancelación (opcional):');
    
    try {
      await axios.delete(`http://localhost:3000/reservas/${reservaId}`, {
        data: {
          motivo_cancelacion: motivo || 'Sin motivo especificado',
          usuario_id: usuarioActual?.id
        }
      });
      
      showSuccess(
        'Reserva cancelada',
        `La reserva de ${reserva?.equipo_nombre || 'equipo'} ha sido cancelada exitosamente`
      );
      cargarDatos();
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      showError(
        'Error al cancelar',
        'No se pudo cancelar la reserva. Intente nuevamente.'
      );
    }
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      'pendiente': 'badge-warning',
      'confirmada': 'badge-info',
      'en_curso': 'badge-success',
      'finalizada': 'badge-secondary',
      'cancelada': 'badge-danger'
    };
    return `estado-badge ${clases[estado] || 'badge-default'}`;
  };

  const reservasDelDia = reservas.filter(reserva => {
    const fechaReserva = new Date(reserva.fecha_inicio).toISOString().split('T')[0];
    return fechaReserva <= fechaSeleccionada && 
           new Date(reserva.fecha_fin).toISOString().split('T')[0] >= fechaSeleccionada &&
           reserva.estado !== 'cancelada';
  });

  if (cargando) {
    return (
      <div className="reservas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando sistema de reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reservas-page">
      {/* Header de la página de reservas */}
      <header className="reservas-header">
        {/* Fila superior: Navegación y usuario */}
        <div className="header-nav">
          <button className="btn-volver" onClick={onVolver}>
            ← Volver al Dashboard
          </button>
          
          <div className="user-info-small">
            <span>👤 {usuarioActual?.nombre} {usuarioActual?.apellido}</span>
          </div>
        </div>

        {/* Separador visual */}
        <div className="header-divider"></div>
        
        {/* Fila principal: Título y acciones */}
        <div className="header-main">
          <div className="page-title">
            <h1>📅 Sistema de Reservas de Equipos</h1>
            <p>Gestión y control de préstamos de notebooks, proyectores y cámaras</p>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn-primary btn-nueva-reserva"
              onClick={toggleFormulario}
            >
              {mostrarFormulario ? '❌ Cancelar' : '➕ Nueva Reserva'}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard de estadísticas */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{estadisticas.total_reservas || 0}</h3>
              <p>Total Reservas</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{estadisticas.en_curso || 0}</h3>
              <p>En Curso</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{estadisticas.pendientes || 0}</h3>
              <p>Pendientes</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{estadisticas.hoy || 0}</h3>
              <p>Reservas Hoy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección principal */}
      <div className="main-content">
        {/* Panel de control */}
        <div className="control-panel">
          <div className="panel-info">
            <h3>📅 Calendario de Reservas</h3>
            <p>Selecciona una fecha en el calendario para ver las reservas del día</p>
          </div>
        </div>

        {/* Calendario grande */}
        <CalendarioReservas 
          reservas={reservas}
          onFechaSeleccionada={setFechaSeleccionada}
          fechaSeleccionada={fechaSeleccionada}
        />

        {/* Formulario de nueva reserva */}
        {mostrarFormulario && (
          <div ref={formularioRef} className="form-container">
            <h3>📝 Nueva Reserva de Equipo</h3>
            <form onSubmit={handleSubmit} className="reserva-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Equipo *</label>
                  <select
                    name="equipo_id"
                    value={formData.equipo_id}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {equipos.filter(eq => eq.estado === 'disponible').map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.icono} {equipo.codigo_equipo} - {equipo.nombre} ({equipo.marca})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Empleado *</label>
                  <select
                    name="empleado_id"
                    value={formData.empleado_id}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {empleados.map(empleado => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.numero_legajo} - {empleado.apellido}, {empleado.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin *</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleInputChange}
                    required
                    min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin</label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo del préstamo *</label>
                <input
                  type="text"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  placeholder="Ej: Presentación en sala de conferencias, trabajo en terreno..."
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  placeholder="Información adicional..."
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-success">
                  💾 Crear Reserva
                </button>
                <button 
                  type="button" 
                  onClick={toggleFormulario}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de reservas del día seleccionado */}
        <div className="reservas-container">
          <div className="reservas-header">
            <h3>📋 Reservas del {new Date(fechaSeleccionada).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h3>
            {reservasDelDia.length > 0 && (
              <div className="resumen-reservas">
                <span className="total-reservas">{reservasDelDia.length} reserva{reservasDelDia.length !== 1 ? 's' : ''}</span>
                <div className="estados-resumen">
                  {['pendiente', 'confirmada', 'en_curso'].map(estado => {
                    const count = reservasDelDia.filter(r => r.estado === estado).length;
                    if (count > 0) {
                      return (
                        <span key={estado} className={`estado-count ${estado}`}>
                          {count} {estado}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
          
          {reservasDelDia.length === 0 ? (
            <div className="empty-state">
              <p>📅 No hay reservas para este día</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasDelDia.map(reserva => (
                <div key={reserva.id} className="reserva-card">
                  <div className="card-header">
                    <div className="equipo-info">
                      <span className="equipo-icon">{reserva.icono}</span>
                      <div>
                        <h4>{reserva.equipo_nombre}</h4>
                        <p>{reserva.codigo_equipo} - {reserva.marca} {reserva.modelo}</p>
                      </div>
                    </div>
                    <span className={getEstadoBadge(reserva.estado)}>
                      {reserva.estado}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <div className="empleado-info">
                      <p><strong>👤 Empleado:</strong> {reserva.empleado_nombre} {reserva.empleado_apellido}</p>
                      <p><strong>🏷️ Legajo:</strong> {reserva.numero_legajo}</p>
                    </div>
                    
                    <div className="fecha-info">
                      <p><strong>📅 Período:</strong> {new Date(reserva.fecha_inicio).toLocaleDateString()} - {new Date(reserva.fecha_fin).toLocaleDateString()}</p>
                      <p><strong>🕒 Horario:</strong> {reserva.hora_inicio} - {reserva.hora_fin}</p>
                    </div>
                    
                    <div className="motivo-info">
                      <p><strong>📝 Motivo:</strong> {reserva.motivo}</p>
                      {reserva.observaciones && (
                        <p><strong>📋 Observaciones:</strong> {reserva.observaciones}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    {reserva.estado === 'pendiente' && (
                      <button 
                        onClick={() => cambiarEstadoReserva(reserva.id, 'confirmada')}
                        className="btn-confirm"
                      >
                        ✅ Confirmar
                      </button>
                    )}
                    
                    {reserva.estado === 'confirmada' && (
                      <button 
                        onClick={() => cambiarEstadoReserva(reserva.id, 'en_curso')}
                        className="btn-start"
                      >
                        🚀 Iniciar
                      </button>
                    )}
                    
                    {reserva.estado === 'en_curso' && (
                      <button 
                        onClick={() => cambiarEstadoReserva(reserva.id, 'finalizada')}
                        className="btn-finish"
                      >
                        ✅ Finalizar
                      </button>
                    )}
                    
                    {['pendiente', 'confirmada'].includes(reserva.estado) && (
                      <button 
                        onClick={() => cancelarReserva(reserva.id)}
                        className="btn-cancel"
                      >
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista completa de equipos */}
        <div className="equipos-container">
          <h3>💻 Estado Actual de Equipos</h3>
          <div className="equipos-grid">
            {equipos.map(equipo => (
              <div key={equipo.id} className={`equipo-card ${equipo.estado}`}>
                <div className="equipo-header">
                  <span className="equipo-icon">{equipo.icono}</span>
                  <div className="equipo-details">
                    <h4>{equipo.nombre}</h4>
                    <p>{equipo.codigo_equipo}</p>
                  </div>
                  <span className={`estado-badge ${equipo.estado}`}>
                    {equipo.estado}
                  </span>
                </div>
                <div className="equipo-info">
                  <p><strong>Marca:</strong> {equipo.marca}</p>
                  <p><strong>Modelo:</strong> {equipo.modelo}</p>
                  <p><strong>Ubicación:</strong> {equipo.ubicacion_actual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Componente de notificaciones toast */}
      <ToastNotification 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default ReservasPage;
