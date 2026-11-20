const express = require('express');

const router = express.Router();

// Ruta principal
router.get('/', (req, res) => {
    res.json({
        mensaje: 'Bienvenido a SafePaws',
        estado: 'Servidor funcionando'
    });
});

// Ruta de salud
router.get('/health', (req, res) => {
    res.status(200).json({
        estado: 'OK'
    });
});

module.exports = router;