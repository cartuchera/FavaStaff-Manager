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

// Puerto y arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
