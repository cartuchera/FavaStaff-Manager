import React, { useState } from 'react';

function FormularioEquipo({ onAdd }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onAdd({ nombre, tipo, estado });
    setNombre('');
    setTipo('');
    setEstado('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" required />
      <input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Tipo" required />
      <input value={estado} onChange={e => setEstado(e.target.value)} placeholder="Estado" required />
      <button type="submit">Agregar</button>
    </form>
  );
}

export default FormularioEquipo;