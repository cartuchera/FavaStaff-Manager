import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FormularioBaja({ onBajaProcessed }) {
  const [empleadosActivos, setEmpleadosActivos] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo_baja: 'voluntaria',
    fecha_baja: new Date().toISOString().split('T')[0], // Fecha de hoy
    motivo: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  // Cargar empleados activos al montar el componente
  useEffect(() => {
    axios.get('http://localhost:3000/bajas/empleados-activos')
      .then(res => {
        setEmpleadosActivos(res.data);
        setEmpleadosFiltrados(res.data);
      })
      .catch(err => {
        console.error('Error cargando empleados activos:', err);
      });
  }, []);

  // Filtrar empleados según búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setEmpleadosFiltrados(empleadosActivos);
    } else {
      const filtrados = empleadosActivos.filter(empleado => {
        const nombre = empleado.nombre || '';
        const apellido = empleado.apellido || '';
        const legajo = empleado.numero_legajo || '';
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        
        return nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
               apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
               legajo.toLowerCase().includes(busqueda.toLowerCase()) ||
               nombreCompleto.toLowerCase().includes(busqueda.toLowerCase());
      });
      setEmpleadosFiltrados(filtrados);
    }
  }, [busqueda, empleadosActivos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia el empleado seleccionado, buscar sus datos
    if (name === 'empleado_id' && value) {
      const empleado = empleadosActivos.find(emp => emp.id === parseInt(value));
      setSelectedEmpleado(empleado);
    }
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.empleado_id) {
      alert('Por favor selecciona un empleado');
      return;
    }
    if (!formData.motivo.trim()) {
      alert('Por favor ingresa el motivo de la baja');
      return;
    }

    // Mostrar confirmación
    setShowConfirmation(true);
  };

  const confirmarBaja = () => {
    setLoading(true);
    
    axios.post('http://localhost:3000/bajas', formData)
      .then(res => {
        alert('Baja procesada exitosamente');
        
        // Limpiar formulario
        setFormData({
          empleado_id: '',
          tipo_baja: 'voluntaria',
          fecha_baja: new Date().toISOString().split('T')[0],
          motivo: '',
          observaciones: ''
        });
        setSelectedEmpleado(null);
        setShowConfirmation(false);
        
        // Recargar empleados activos
        axios.get('http://localhost:3000/bajas/empleados-activos')
          .then(res => {
            setEmpleadosActivos(res.data);
            setEmpleadosFiltrados(res.data);
          })
          .catch(err => console.error(err));
        
        // Notificar al componente padre para refrescar datos
        if (onBajaProcessed) {
          onBajaProcessed();
        }
      })
      .catch(err => {
        console.error('Error procesando baja:', err);
        alert('Error al procesar la baja. Por favor intenta nuevamente.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const cancelarConfirmacion = () => {
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="confirmation-modal">
        <div className="confirmation-content">
          <h3>Confirmar Baja de Empleado</h3>
          <div className="confirmation-details">
            <p><strong>Empleado:</strong> {selectedEmpleado?.nombre} {selectedEmpleado?.apellido}</p>
            <p><strong>Legajo:</strong> {selectedEmpleado?.numero_legajo}</p>
            <p><strong>Puesto:</strong> {selectedEmpleado?.puesto}</p>
            <p><strong>Sector:</strong> {selectedEmpleado?.sector}</p>
            <p><strong>Tipo de baja:</strong> {formData.tipo_baja}</p>
            <p><strong>Fecha:</strong> {new Date(formData.fecha_baja).toLocaleDateString('es-ES')}</p>
            <p><strong>Motivo:</strong> {formData.motivo}</p>
            {formData.observaciones && (
              <p><strong>Observaciones:</strong> {formData.observaciones}</p>
            )}
          </div>
          <div className="confirmation-buttons">
            <button 
              onClick={confirmarBaja} 
              disabled={loading}
              className="btn-confirm"
            >
              {loading ? 'Procesando...' : 'Confirmar Baja'}
            </button>
            <button 
              onClick={cancelarConfirmacion} 
              disabled={loading}
              className="btn-cancel"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="formulario-baja">
      <h3>Procesar Nueva Baja</h3>
      
      <form onSubmit={handleSubmit} className="baja-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="busqueda">Buscar empleado:</label>
            <input
              type="text"
              id="busqueda"
              name="busqueda"
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar por nombre, apellido o legajo..."
              className="search-input"
            />
            <small className="search-help">
              {empleadosFiltrados.length} empleado(s) encontrado(s)
            </small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="empleado_id">Empleado a dar de baja:</label>
            <select
              id="empleado_id"
              name="empleado_id"
              value={formData.empleado_id}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Seleccionar empleado --</option>
              {empleadosFiltrados.map(empleado => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido} (Legajo: {empleado.numero_legajo}) - {empleado.puesto}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tipo_baja">Tipo de baja:</label>
            <select
              id="tipo_baja"
              name="tipo_baja"
              value={formData.tipo_baja}
              onChange={handleInputChange}
              required
            >
              <option value="voluntaria">Renuncia Voluntaria</option>
              <option value="despido">Despido</option>
              <option value="jubilacion">Jubilación</option>
              <option value="vencimiento">Fin de Contrato</option>
              <option value="abandono">Abandono de Trabajo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha_baja">Fecha de baja:</label>
            <input
              type="date"
              id="fecha_baja"
              name="fecha_baja"
              value={formData.fecha_baja}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motivo">Motivo:</label>
            <input
              type="text"
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              placeholder="Ej: Renuncia por motivos personales"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="observaciones">Observaciones (opcional):</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Detalles adicionales sobre la baja..."
            rows="3"
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            Procesar Baja
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setFormData({
                empleado_id: '',
                tipo_baja: 'voluntaria',
                fecha_baja: new Date().toISOString().split('T')[0],
                motivo: '',
                observaciones: ''
              });
              setSelectedEmpleado(null);
              setBusqueda('');
            }}
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioBaja;
