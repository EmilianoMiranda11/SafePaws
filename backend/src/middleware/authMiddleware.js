const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verificar que el usuario esté autenticado y activo
const verificarToken = async (req, res, next) => {
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
        return res.status(401).json({
            mensaje: 'No se proporcionó un token de autenticación'
        });
    }

    const token = encabezado.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Consultar el estado y rol actual del usuario
        const resultado = await pool.query(
            `SELECT u.id, u.activo, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1`,
            [decoded.id]
        );

        if (resultado.rowCount === 0 || !resultado.rows[0].activo) {
            return res.status(401).json({
                mensaje: 'El usuario no existe o su cuenta está desactivada'
            });
        }

        // Utilizar el rol actual de PostgreSQL
        req.usuario = {
            id: resultado.rows[0].id,
            rol: resultado.rows[0].rol
        };

        next();

    } catch (error) {
        console.error('Error de autenticación:', error.message);

        return res.status(401).json({
            mensaje: 'Token inválido o expirado'
        });
    }
};

// Verificar que el usuario tenga alguno de los roles permitidos
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para realizar esta operación'
            });
        }

        next();
    };
};

module.exports = {
    verificarToken,
    verificarRol
};