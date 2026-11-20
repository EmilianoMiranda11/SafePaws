const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const usuariosController = require('../controllers/usuariosController');

// Registro público
router.post('/registro', usuariosController.registrarUsuario);

// Inicio de sesión
router.post('/login', usuariosController.iniciarSesion);

// Consultar todos los usuarios (solo administrador)
router.get('/usuarios', verificarToken, verificarRol('Administrador'), usuariosController.obtenerUsuarios);

// Crear usuario (solo administrador)
router.post('/', verificarToken, verificarRol('Administrador'), usuariosController.crearUsuarioAdmin);

// Actualizar rol de usuario (solo administrador)
router.put('/:id/rol', verificarToken, verificarRol('Administrador'), usuariosController.actualizarRolUsuario);

// Desactivar usuario (solo administrador)
router.put('/:id/desactivar', verificarToken, verificarRol('Administrador'), usuariosController.desactivarUsuario);

module.exports = router;