import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FormularioEquipo({ onAdd }) {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    numero_legajo: '',
    puesto_id: '',
    sector_id: '',
    fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
  });

  const [puestos, setPuestos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar puestos y sectores al montar el componente
  useEffect(() => {
    // Cargar puestos
    axios.get('http://localhost:3000/puestos')
      .then(res => setPuestos(res.data))
      .catch(err => console.error('Error cargando puestos:', err));

    // Cargar sectores  
    axios.get('http://localhost:3000/sectores')
      .then(res => setSectores(res.data))
      .catch(err => console.error('Error cargando sectores:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.dni || !formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.fecha_ingreso) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor ingrese un email válido');
      return;
    }

    // Validar DNI (solo números)
    if (!/^\d+$/.test(formData.dni)) {
      alert('El DNI debe contener solo números');
      return;
    }

    setLoading(true);

    // Preparar datos para enviar (convertir campos vacíos a null para la BD)
    const empleadoData = {
      ...formData,
      puesto_id: formData.puesto_id || null,
      sector_id: formData.sector_id || null,
      numero_legajo: formData.numero_legajo || null
    };

    onAdd(empleadoData);

    // Limpiar formulario después del envío
    setFormData({
      dni: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      numero_legajo: '',
      puesto_id: '',
      sector_id: '',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });

    setLoading(false);
  };

  return (
    <div className="formulario-empleado">
      <form onSubmit={handleSubmit} className="empleado-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dni">DNI *</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              placeholder="Ej: 12345678"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="numero_legajo">Número de Legajo</label>
            <input
              type="text"
              id="numero_legajo"
              name="numero_legajo"
              value={formData.numero_legajo}
              onChange={handleInputChange}
              placeholder="Ej: LEG001 (opcional)"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Juan"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="apellido">Apellido *</label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              placeholder="Ej: Pérez"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Ej: juan.perez@hospital.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono *</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="Ej: +54 11 1234-5678"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="puesto_id">Puesto</label>
            <select
              id="puesto_id"
              name="puesto_id"
              value={formData.puesto_id}
              onChange={handleInputChange}
            >
              <option value="">-- Seleccionar puesto --</option>
              {puestos.map(puesto => (
                <option key={puesto.id} value={puesto.id}>
                  {puesto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sector_id">Sector</label>
            <select
              id="sector_id"
              name="sector_id"
              value={formData.sector_id}
              onChange={handleInputChange}
            >
              <option value="">-- Seleccionar sector --</option>
              {sectores.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha_ingreso">Fecha de Ingreso *</label>
            <input
              type="date"
              id="fecha_ingreso"
              name="fecha_ingreso"
              value={formData.fecha_ingreso}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : '➕ Registrar Empleado'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => setFormData({
              dni: '',
              nombre: '',
              apellido: '',
              email: '',
              telefono: '',
              numero_legajo: '',
              puesto_id: '',
              sector_id: '',
              fecha_ingreso: new Date().toISOString().split('T')[0]
            })}
          >
            🗑️ Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioEquipo;