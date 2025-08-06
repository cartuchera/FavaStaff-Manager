import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './styles/Dashboard.css';
import FormularioEquipo from './components/FormularioEquipo';
import FormularioBaja from './components/FormularioBaja';
import ProgressBar1 from './components/ProgressBar1';
import DynamicProgressBars from './components/DynamicProgressBars';
import LoginForm from './components/LoginForm';

function App() {
  const [empleados, setEmpleados] = useState([]);
  const [bajas, setBajas] = useState([]);
  const [logueado, setLogueado] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState('empleados');

  // Verificar sesión al cargar la página
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('favastaff_sesion');
    if (sesionGuardada) {
      try {
        const datosUsuario = JSON.parse(sesionGuardada);
        setLogueado(true);
        setUsuarioActual(datosUsuario);
      } catch (error) {
        console.error('Error al recuperar sesión:', error);
        localStorage.removeItem('favastaff_sesion');
      }
    }
  }, []);

  useEffect(() => {
    if (logueado) {
      // Cargar empleados
      axios.get('http://localhost:3000/empleados')
        .then(res => setEmpleados(res.data))
        .catch(err => console.error(err));
      
      // Cargar bajas
      axios.get('http://localhost:3000/bajas')
        .then(res => setBajas(res.data))
        .catch(err => console.error(err));
    }
  }, [logueado]);

  const handleAddEmpleado = (nuevoEmpleado) => {
    axios.post('http://localhost:3000/empleados', nuevoEmpleado)
      .then(res => {
        console.log('Empleado creado:', res.data);
        alert(`Empleado ${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido} registrado exitosamente`);
        
        // Actualizar la lista de empleados
        axios.get('http://localhost:3000/empleados')
          .then(res => setEmpleados(res.data))
          .catch(err => console.error('Error al recargar empleados:', err));
        
        // Recargar bajas por si hay cambios
        axios.get('http://localhost:3000/bajas')
          .then(res => setBajas(res.data))
          .catch(err => console.error('Error al recargar bajas:', err));
      })
      .catch(err => {
        console.error('Error al crear empleado:', err);
        if (err.response && err.response.data && err.response.data.error) {
          alert(`Error: ${err.response.data.error}`);
        } else {
          alert('Error al registrar el empleado. Por favor intente nuevamente.');
        }
      });
  };

  const getBadgeClass = (tipoBaja) => {
    switch(tipoBaja) {
      case 'voluntaria': return 'badge voluntaria';
      case 'despido': return 'badge despido';
      case 'jubilacion': return 'badge jubilacion';
      default: return 'badge default';
    }
  };

  const handleBajaProcessed = () => {
    // Recargar empleados
    axios.get('http://localhost:3000/empleados')
      .then(res => setEmpleados(res.data))
      .catch(err => console.error(err));
    
    // Recargar bajas
    axios.get('http://localhost:3000/bajas')
      .then(res => setBajas(res.data))
      .catch(err => console.error(err));
  };

  // Función para manejar login exitoso
  const handleLogin = (datosUsuario) => {
    setLogueado(true);
    setUsuarioActual(datosUsuario);
    
    // Guardar sesión en localStorage
    localStorage.setItem('favastaff_sesion', JSON.stringify(datosUsuario));
  };

  // Función para manejar logout
  const handleLogout = () => {
    setLogueado(false);
    setUsuarioActual(null);
    
    // Limpiar sesión del localStorage
    localStorage.removeItem('favastaff_sesion');
  };

  // Si NO está logueado, solo muestra el login
  if (!logueado) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Si está logueado, muestra el resto de la app
  return (
    <div className="App">
      {/* Header profesional */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">⚕️</div>
            <div className="brand-text">
              <h1>FavaStaff Manager</h1>
              <p>Sistema Integral de Gestión Hospitalaria</p>
            </div>
          </div>
          <div className="user-info">
            <div className="system-status">
              <span style={{color: '#4ade80', fontSize: '0.8rem'}}>● Sistema en Linea</span>
            </div>
            <div className="user-details">
              <span className="welcome-text">
                👤 {usuarioActual?.nombre || 'Usuario'} {usuarioActual?.apellido || ''}
              </span>
              <span className="user-role" style={{fontSize: '0.8rem', opacity: 0.8}}>
                {usuarioActual?.puesto || 'Administrador'}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard principal */}
      <main className="dashboard">
        {/* Navegación por pestañas */}
        <nav className="tab-navigation">
          <button 
            onClick={() => setPestanaActiva('empleados')}
            className={`tab-button ${pestanaActiva === 'empleados' ? 'active' : ''}`}
          >
            <span style={{fontSize: '1.2rem'}}>👥</span>
            Personal Activo
          </button>
          <button 
            onClick={() => setPestanaActiva('bajas')}
            className={`tab-button ${pestanaActiva === 'bajas' ? 'active' : ''}`}
          >
            <span style={{fontSize: '1.2rem'}}>📋</span>
            Gestión de Bajas
          </button>
          <button 
            onClick={() => setPestanaActiva('otros')}
            className={`tab-button ${pestanaActiva === 'otros' ? 'active' : ''}`}
          >
            <span style={{fontSize: '1.2rem'}}>📊</span>
            Reportes
          </button>
        </nav>

        {/* Contenido según pestaña activa */}
        <div className="content-container">
          {pestanaActiva === 'empleados' && (
            <div className="content-section">
              <div className="section-header">
                <h2><span style={{fontSize: '2rem'}}>👥</span> Personal del Hospital</h2>
                <p>Gestión integral del personal hospitalario activo</p>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">👨‍⚕️</div>
                  <div className="stat-info">
                    <h3>{empleados.length}</h3>
                    <p>Total Registrados</p>
                  </div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{empleados.filter(e => e.activo).length}</h3>
                    <p>Personal Activo</p>
                  </div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-info">
                    <h3>{empleados.filter(e => !e.activo).length}</h3>
                    <p>Personal Inactivo</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{bajas.filter(b => new Date(b.fecha_baja).getMonth() === new Date().getMonth()).length}</h3>
                    <p>Bajas Este Mes</p>
                  </div>
                </div>
              </div>
              
              <div className="table-container">
                <h3>📋 Lista de Personal Hospitalario</h3>
                <div style={{marginBottom: '1rem', color: '#718096', fontSize: '0.9rem'}}>
                  Total de registros: {empleados.length} empleados
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Legajo</th>
                      <th>Nombre</th>
                      <th>DNI</th>
                      <th>Puesto</th>
                      <th>Sector</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map(empleado => (
                      <tr key={empleado.id}>
                        <td>{empleado.numero_legajo}</td>
                        <td>{empleado.nombre} {empleado.apellido}</td>
                        <td>{empleado.dni}</td>
                        <td>{empleado.puesto || 'Sin asignar'}</td>
                        <td>{empleado.sector}</td>
                        <td>
                          <span className={empleado.activo ? 'status-active' : 'status-inactive'}>
                            {empleado.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-section">
                <h3><span style={{fontSize: '1.2rem'}}>➕</span> Registrar Nuevo Empleado</h3>
                <p style={{margin: '0 0 1.5rem 0', color: '#718096'}}>
                  Complete el formulario para agregar un nuevo miembro al personal hospitalario
                </p>
                <FormularioEquipo onAdd={handleAddEmpleado} />
              </div>
            </div>
          )}

          {pestanaActiva === 'bajas' && (
            <div className="content-section">
              <div className="section-header">
                <h2><span style={{fontSize: '2rem'}}>📋</span> Gestión de Bajas</h2>
                <p>Control y registro de bajas del personal hospitalario</p>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card warning">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{bajas.length}</h3>
                    <p>Total de Bajas</p>
                  </div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{bajas.filter(b => new Date(b.fecha_baja).getMonth() === new Date().getMonth()).length}</h3>
                    <p>Bajas Este Mes</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔄</div>
                  <div className="stat-info">
                    <h3>{bajas.filter(b => b.tipo_baja === 'voluntaria').length}</h3>
                    <p>Bajas Voluntarias</p>
                  </div>
                </div>
              </div>
              
              <div className="table-container">
                <h3>📋 Historial Completo de Bajas</h3>
                <div style={{marginBottom: '1rem', color: '#718096', fontSize: '0.9rem'}}>
                  Registro histórico de todas las bajas del personal
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Legajo</th>
                      <th>Empleado</th>
                      <th>Puesto</th>
                      <th>Sector</th>
                      <th>Fecha Baja</th>
                      <th>Tipo</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bajas.map(baja => (
                      <tr key={baja.baja_id}>
                        <td>{baja.numero_legajo}</td>
                        <td>{baja.nombre} {baja.apellido}</td>
                        <td>{baja.puesto}</td>
                        <td>{baja.sector}</td>
                        <td>{new Date(baja.fecha_baja).toLocaleDateString('es-ES')}</td>
                        <td>
                          <span className={getBadgeClass(baja.tipo_baja)}>
                            {baja.tipo_baja}
                          </span>
                        </td>
                        <td>{baja.motivo}</td>
                      </tr>
                    ))}
                    {bajas.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-message">
                          No hay bajas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Formulario para procesar bajas */}
              <FormularioBaja onBajaProcessed={handleBajaProcessed} />
            </div>
          )}

          {pestanaActiva === 'otros' && (
            <div className="content-section">
              <div className="section-header">
                <h2><span style={{fontSize: '2rem'}}>📊</span> Reportes y Análisis</h2>
                <p>Métricas detalladas y análisis del sistema de gestión</p>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <h3>{empleados.length > 0 ? Math.round((empleados.filter(e => e.activo).length / empleados.length) * 100) : 0}%</h3>
                    <p>Tasa de Retención</p>
                  </div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-info">
                    <h3>{bajas.filter(b => b.tipo_baja === 'despido').length}</h3>
                    <p>Despidos Totales</p>
                  </div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-info">
                    <h3>{bajas.filter(b => b.tipo_baja === 'jubilacion').length}</h3>
                    <p>Jubilaciones</p>
                  </div>
                </div>
              </div>
              
              <div className="reports-grid">
                <div className="report-card">
                  <h3><span style={{fontSize: '1.2rem'}}>📈</span> Progreso del Sistema</h3>
                  <p style={{color: '#718096', marginBottom: '1rem'}}>
                    Métricas de rendimiento predefinidas
                  </p>
                  <ProgressBar1 values={[50, 75, 90]} />
                </div>
                
                <div className="report-card">
                  <h3><span style={{fontSize: '1.2rem'}}>📊</span> Métricas Dinámicas</h3>
                  <p style={{color: '#718096', marginBottom: '1rem'}}>
                    Análisis en tiempo real del personal
                  </p>
                  <DynamicProgressBars />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

//npm run dev    backend
//npm start      frontend
//npm run build  frontend (para producción)
//npm run deploy frontend (para desplegar en Vercel)
//npm run deploy-backend backend (para desplegar en Railway)

