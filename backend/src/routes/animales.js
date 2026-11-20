const express = require('express');
const router = express.Router();

const animalesController = require('../controllers/animalesController');

const {
verificarToken,
verificarRol
} = require('../middleware/authMiddleware');

// Consultar animales: cualquier usuario autenticado
router.get(
'/',
verificarToken,
animalesController.obtenerAnimales
);

// Registrar animales: Administrador y Veterinario
router.post(
'/',
verificarToken,
verificarRol('Administrador', 'Veterinario'),
animalesController.crearAnimal
);

// Actualizar animales: Administrador y Veterinario
router.put(
'/:id',
verificarToken,
verificarRol('Administrador', 'Veterinario'),
animalesController.actualizarAnimal
);

// Eliminar animales: solamente Administrador
router.delete(
'/:id',
verificarToken,
verificarRol('Administrador'),
animalesController.eliminarAnimal
);

module.exports = router;
