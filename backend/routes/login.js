const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { nombre, contrasena } = req.body;
  try {
    // Busca el usuario en la base de datos
    const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const usuario = result.rows[0];
    // Comparación de contraseña en texto plano
    if (contrasena !== usuario.contrasena) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    res.json({ mensaje: 'Login exitoso' });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;