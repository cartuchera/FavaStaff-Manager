import React, { useState, useEffect } from 'react';
import './CalendarioReservas.css';

function CalendarioReservas({ reservas, onFechaSeleccionada, fechaSeleccionada }) {
  const [mesActual, setMesActual] = useState(new Date());
  const [diasDelMes, setDiasDelMes] = useState([]);

  useEffect(() => {
    generarDiasDelMes();
  }, [mesActual, reservas]);

  const generarDiasDelMes = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(año, mes, 1);
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const diaSemanaInicio = primerDia.getDay();
    
    // Días del mes anterior para completar la primera semana
    const diasMesAnterior = [];
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      diasMesAnterior.push({
        dia: ultimoDiaMesAnterior - i,
        fecha: new Date(año, mes - 1, ultimoDiaMesAnterior - i),
        esDelMesActual: false,
        reservas: []
      });
    }
    
    // Días del mes actual
    const diasMesActual = [];
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(año, mes, dia);
      const fechaString = fecha.toISOString().split('T')[0];
      
      // Filtrar reservas para este día (excluyendo canceladas)
      const reservasDelDia = reservas.filter(reserva => {
        const fechaInicio = new Date(reserva.fecha_inicio).toISOString().split('T')[0];
        const fechaFin = new Date(reserva.fecha_fin).toISOString().split('T')[0];
        return fechaString >= fechaInicio && 
               fechaString <= fechaFin && 
               reserva.estado !== 'cancelada';
      });
      
      diasMesActual.push({
        dia,
        fecha,
        esDelMesActual: true,
        reservas: reservasDelDia
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const diasMesSiguiente = [];
    const totalDias = diasMesAnterior.length + diasMesActual.length;
    const diasParaCompletar = 42 - totalDias; // 6 semanas × 7 días = 42
    
    for (let dia = 1; dia <= diasParaCompletar; dia++) {
      diasMesSiguiente.push({
        dia,
        fecha: new Date(año, mes + 1, dia),
        esDelMesActual: false,
        reservas: []
      });
    }
    
    setDiasDelMes([...diasMesAnterior, ...diasMesActual, ...diasMesSiguiente]);
  };

  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(mesActual.getMonth() + direccion);
    setMesActual(nuevoMes);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(hoy);
    onFechaSeleccionada(hoy.toISOString().split('T')[0]);
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esFechaSeleccionada = (fecha) => {
    if (!fechaSeleccionada) return false;
    return fecha.toISOString().split('T')[0] === fechaSeleccionada;
  };

  const obtenerClaseDia = (diaObj) => {
    let clases = ['calendario-dia'];
    
    if (!diaObj.esDelMesActual) {
      clases.push('otro-mes');
    }
    
    if (esHoy(diaObj.fecha)) {
      clases.push('hoy');
    }
    
    if (esFechaSeleccionada(diaObj.fecha)) {
      clases.push('seleccionado');
    }
    
    // Solo marcar con-reservas si hay reservas activas (no canceladas)
    if (diaObj.reservas.length > 0) {
      clases.push('con-reservas');
    }
    
    return clases.join(' ');
  };

  const obtenerIndicadorReservas = (reservas) => {
    // Filtrar solo reservas no canceladas
    const reservasActivas = reservas.filter(reserva => reserva.estado !== 'cancelada');
    
    if (reservasActivas.length === 0) return null;
    
    const coloresPorEstado = {
      'pendiente': '#f59e0b',
      'confirmada': '#3b82f6',
      'en_curso': '#10b981',
      'finalizada': '#6b7280'
    };
    
    return (
      <div className="indicadores-reservas">
        {reservasActivas.slice(0, 3).map((reserva, index) => (
          <div
            key={index}
            className="indicador-reserva"
            style={{ backgroundColor: coloresPorEstado[reserva.estado] || '#6b7280' }}
            title={`${reserva.equipo_nombre} - ${reserva.empleado_nombre} ${reserva.empleado_apellido}`}
          />
        ))}
        {reservasActivas.length > 3 && (
          <div className="indicador-mas">+{reservasActivas.length - 3}</div>
        )}
      </div>
    );
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="calendario-container">
      {/* Header del calendario */}
      <div className="calendario-header">
        <div className="navegacion-mes">
          <button onClick={() => cambiarMes(-1)} className="btn-nav-mes">
            ‹
          </button>
          <h2 className="mes-año">
            {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
          </h2>
          <button onClick={() => cambiarMes(1)} className="btn-nav-mes">
            ›
          </button>
        </div>
        
        <button onClick={irAHoy} className="btn-hoy">
          📅 Ir a Hoy
        </button>
      </div>

      {/* Días de la semana */}
      <div className="calendario-semana">
        {diasSemana.map(dia => (
          <div key={dia} className="dia-semana">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="calendario-grid">
        {diasDelMes.map((diaObj, index) => (
          <div
            key={index}
            className={obtenerClaseDia(diaObj)}
            onClick={() => {
              if (diaObj.esDelMesActual) {
                onFechaSeleccionada(diaObj.fecha.toISOString().split('T')[0]);
              }
            }}
          >
            <div className="numero-dia">
              {diaObj.dia}
            </div>
            
            {diaObj.esDelMesActual && (
              <>
                {obtenerIndicadorReservas(diaObj.reservas)}
                
                {(() => {
                  const reservasActivas = diaObj.reservas.filter(reserva => reserva.estado !== 'cancelada');
                  return reservasActivas.length > 0 && (
                    <div className="contador-reservas">
                      {reservasActivas.length} reserva{reservasActivas.length !== 1 ? 's' : ''} activa{reservasActivas.length !== 1 ? 's' : ''}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="calendario-leyenda">
        <div className="leyenda-item">
          <div className="indicador-reserva" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Pendiente</span>
        </div>
        <div className="leyenda-item">
          <div className="indicador-reserva" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Confirmada</span>
        </div>
        <div className="leyenda-item">
          <div className="indicador-reserva" style={{ backgroundColor: '#10b981' }}></div>
          <span>En Curso</span>
        </div>
        <div className="leyenda-item">
          <div className="indicador-reserva" style={{ backgroundColor: '#6b7280' }}></div>
          <span>Finalizada</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarioReservas;
