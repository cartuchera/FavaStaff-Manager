const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { nombre, contraseña } = req.body;
  console.log('Login attempt:', { nombre, contraseña }); // Debug log
  
  try {
    // Busca el usuario en la base de datos con información adicional
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.contraseña,
        e.apellido,
        p.nombre as puesto
      FROM usuarios u
      LEFT JOIN empleados e ON u.nombre = e.nombre
      LEFT JOIN puestos p ON e.puesto_id = p.id
      WHERE u.nombre = $1
    `, [nombre]);
    
    console.log('Database result:', result.rows); // Debug log
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const usuario = result.rows[0];
    console.log('Password comparison:', { received: contraseña, stored: usuario.contraseña }); // Debug log
    
    // Comparación de contraseña en texto plano
    if (contraseña !== usuario.contraseña) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Devolver información del usuario (sin la contraseña)
    res.json({ 
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido || '',
        puesto: usuario.puesto || 'Administrador'
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;