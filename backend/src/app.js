const express = require('express');
const router = require('./routes');
const animalesRouter = require('./routes/animales');
const solicitudesRouter = require('./routes/solicitudes');
const usuariosRouter = require('./routes/usuarios');

const app = express();

app.use(express.json());

app.use('/', router); // Rutas generales
app.use('/api/animales', animalesRouter);// Rutas de animales
app.use('/api/solicitudes', solicitudesRouter); // Rutas de solicitudes
app.use('/api/usuarios', usuariosRouter); // Rutas de usuarios

module.exports = app;