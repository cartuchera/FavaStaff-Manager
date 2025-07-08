// Importar librerías
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Crear la app
const app = express();
app.use(cors());
app.use(express.json());

// Ruta simple de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
});

// Conectar a MongoDB y arrancar servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB exitosa');
    app.listen(3000, () => {
      console.log('Servidor corriendo en http://localhost:3000');
    });
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));
