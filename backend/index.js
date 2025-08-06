const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();


// Middleware
app.use(cors());
app.use(express.json());

// Rutas
const equiposRoutes = require('./routes/equipos');
app.use('/equipos', equiposRoutes);

const loginRoutes = require('./routes/login');
app.use('/login', loginRoutes);

// Nueva ruta para empleados
const empleadosRoutes = require('./routes/empleados');
app.use('/empleados', empleadosRoutes);

// Nueva ruta para bajas
const bajasRoutes = require('./routes/bajas');
app.use('/bajas', bajasRoutes);

// Nueva ruta para puestos
const puestosRoutes = require('./routes/puestos');
app.use('/puestos', puestosRoutes);

// Nueva ruta para sectores  
const sectoresRoutes = require('./routes/departamentos'); // departamentos.js contiene sectores
app.use('/sectores', sectoresRoutes);

// Puerto y arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
