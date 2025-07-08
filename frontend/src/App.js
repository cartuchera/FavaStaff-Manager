import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import FormularioEquipo from './components/FormularioEquipo';
import ProgressBar1 from './components/ProgressBar1';
import DynamicProgressBars from './components/DynamicProgressBars';
import LoginForm from './components/LoginForm';

function App() {
  const [equipos, setEquipos] = useState([]);
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    if (logueado) {
      axios.get('http://localhost:3000/equipos')
        .then(res => setEquipos(res.data))
        .catch(err => console.error(err));
    }
  }, [logueado]);

  const handleAddEquipo = (nuevoEquipo) => {
    axios.post('http://localhost:3000/equipos', nuevoEquipo)
      .then(res => {
        setEquipos([...equipos, res.data]);
      })
      .catch(err => console.error(err));
  };

  // Si NO está logueado, solo muestra el login
  if (!logueado) {
    return <LoginForm onLogin={() => setLogueado(true)} />;
  }

  // Si está logueado, muestra el resto de la app
  return (
    <div className="App">
      <h1>Equipos Médicos</h1>
      
      <h2>Lista de Equipos</h2>

      <h2>Barra de Progreso Estática</h2>
      
      <ProgressBar1 values={[50, 75, 90]} />

      <h2>Equipos guardados en base de datos</h2>

      <ul>
        {equipos.map(equipo => (
          <li key={equipo.id}>
            {equipo.nombre} - {equipo.tipo} - {equipo.estado} - {equipo.ubicacion}
          </li>
        ))}
      </ul>

      {/* Barra de progreso dinámica */}
      <h2>Barra de Progreso Dinámica</h2>
      <DynamicProgressBars />

      {/* Formulario para agregar equipo */}
      <h2>Agregar Equipo</h2>
      <FormularioEquipo onAdd={handleAddEquipo} />
    </div>
  );
}

export default App;

//npm run dev    backend
//npm start      frontend
//npm run build  frontend (para producción)
//npm run deploy frontend (para desplegar en Vercel)
//npm run deploy-backend backend (para desplegar en Railway)

