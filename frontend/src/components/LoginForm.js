import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  // Estados para registro
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [registroError, setRegistroError] = useState('');
  const [registroExito, setRegistroExito] = useState('');

  // Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: usuario, contraseña }),
      });
      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
  };

  // Registro
  const handleRegistro = async (e) => {
    e.preventDefault();
    setRegistroError('');
    setRegistroExito('');
    try {
      const res = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoUsuario, contraseña: nuevaContraseña }),
      });
      if (res.ok) {
        setRegistroExito('Usuario creado con éxito. Ahora puedes iniciar sesión.');
        setNuevoUsuario('');
        setNuevaContraseña('');
      } else {
        const data = await res.json();
        setRegistroError(data.error || 'No se pudo crear el usuario.');
      }
    } catch (err) {
      setRegistroError('Error de conexión con el servidor.');
    }
  };

  if (mostrarRegistro) {
    return (
      <div className="login-bg">
        <div className="login-form">
          <h2>Registro</h2>
          <form onSubmit={handleRegistro}>
            {registroError && <div className="login-error">{registroError}</div>}
            {registroExito && <div className="login-success">{registroExito}</div>}
            <div className="input-icon">
              <i className="fas fa-user"></i>
              <input
                type="text"
                value={nuevoUsuario}
                onChange={e => setNuevoUsuario(e.target.value)}
                placeholder="Usuario"
                required
              />
            </div>
            <div className="input-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                value={nuevaContraseña}
                onChange={e => setNuevaContraseña(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
            <button type="submit">Crear usuario</button>
            <button type="button" onClick={() => setMostrarRegistro(false)} style={{marginTop: 10}}>Cancelar</button>
          </form>
        </div>
        <div className="wave-container">
          <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z"
              fill="#1976d2"
            >
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                values="
                  M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z;
                  M0,60 C400,140 1040,20 1440,60 L1440,120 L0,120 Z;
                  M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z
                "
              />
            </path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg">
      <div className="login-form">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="input-icon">
            <i className="fas fa-user"></i>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Usuario"
              required
            />
          </div>
          <div className="input-icon">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              value={contraseña}
              onChange={e => setContraseña(e.target.value)}
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit">
            Ingresar
          </button>
        </form>
       
      </div>
      <div className="wave-container">
        <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z"
            fill="#1976d2"
          >
            <animate
              attributeName="d"
              dur="6s"
              repeatCount="indefinite"
              values="
                M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z;
                M0,60 C400,140 1040,20 1440,60 L1440,120 L0,120 Z;
                M0,80 C360,160 1080,0 1440,80 L1440,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>
    </div>
  );
}

export default LoginForm;
