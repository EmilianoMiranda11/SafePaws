const express = require('express');
const router = express.Router();

const solicitudesController = require('../controllers/solicitudesController');

const {
verificarToken,
verificarRol
} = require('../middleware/authMiddleware');

// Registrar solicitudes: solamente Adoptantes
router.post(
'/',
verificarToken,
verificarRol('Adoptante'),
solicitudesController.crearSolicitud
);

// Consultar solicitudes: Adoptantes y Administradores
router.get(
'/',
verificarToken,
verificarRol('Adoptante', 'Administrador'),
solicitudesController.obtenerSolicitudes
);

// Actualizar estado: solamente Administradores
router.put(
'/:id',
verificarToken,
verificarRol('Administrador'),
solicitudesController.actualizarSolicitud
);

// Cancelar solicitudes: Adoptantes y Administradores
router.delete(
'/:id',
verificarToken,
verificarRol('Adoptante', 'Administrador'),
solicitudesController.eliminarSolicitud
);

module.exports = router;
