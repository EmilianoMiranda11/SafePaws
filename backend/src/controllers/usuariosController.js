const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTRO PÚBLICO DE ADOPTANTES
const registrarUsuario = async (req, res) => {
try {
const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({
            mensaje: 'Todos los campos son obligatorios'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            mensaje: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    const usuarioExistente = await pool.query(
        'SELECT id FROM usuarios WHERE correo = $1',
        [correo]
    );

    if (usuarioExistente.rowCount > 0) {
        return res.status(409).json({
            mensaje: 'El correo ya está registrado'
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
        `INSERT INTO usuarios (nombre, correo, password_hash, rol_id)
         VALUES ($1, $2, $3, 3)
         RETURNING id, nombre, correo, rol_id, activo, fecha_creacion`,
        [nombre, correo, passwordHash]
    );

    return res.status(201).json({
        mensaje: 'Usuario registrado correctamente',
        usuario: resultado.rows[0]
    });

} catch (error) {
    console.error('Error al registrar usuario:', error.message);

    return res.status(500).json({
        mensaje: 'Error interno del servidor'
    });
}


};

// INICIO DE SESIÓN
const iniciarSesion = async (req, res) => {
try {
const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({
            mensaje: 'Correo y contraseña son obligatorios'
        });
    }

    const resultado = await pool.query(
        `SELECT u.id, u.nombre, u.correo, u.password_hash,
                u.rol_id, r.nombre AS rol, u.activo
         FROM usuarios u
         INNER JOIN roles r ON r.id = u.rol_id
         WHERE u.correo = $1`,
        [correo]
    );

    if (resultado.rowCount === 0) {
        return res.status(401).json({
            mensaje: 'Credenciales incorrectas'
        });
    }

    const usuario = resultado.rows[0];

   if (!usuario.activo) {
    return res.status(401).json({
        mensaje: 'La cuenta está desactivada'
    });
}

    const passwordValida = await bcrypt.compare(
        password,
        usuario.password_hash
    );

    if (!passwordValida) {
        return res.status(401).json({
            mensaje: 'Credenciales incorrectas'
        });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado');
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        }
    });

} catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    return res.status(500).json({
        mensaje: 'Error interno del servidor'
    });
}

};

// CONSULTAR TODOS LOS USUARIOS (SOLO ADMINISTRADOR)
const obtenerUsuarios = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                u.id,
                u.nombre,
                u.correo,
                r.nombre AS rol,
                u.activo,
                u.fecha_creacion
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             ORDER BY u.id`
        );

        return res.status(200).json({
            usuarios: resultado.rows
        });

    } catch (error) {
        console.error('Error al consultar usuarios:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
};

const crearUsuarioAdmin = async (req, res) => {
    try {
        const { nombre, correo, password, rol_id } = req.body;

        // Validar tipos de datos
        if (
            typeof nombre !== 'string' ||
            typeof correo !== 'string' ||
            typeof password !== 'string' ||
            !Number.isInteger(Number(rol_id)) ||
            Number(rol_id) <= 0
        ){
            return res.status(400).json({
                mensaje: 'Datos inválidos'
            });
        }

        // Normalizar correo
        const correoNormalizado = correo.trim().toLowerCase();
        const nombreNormalizado = nombre.trim();

        // Validar campos obligatorios
        if (!nombreNormalizado || !correoNormalizado || !password.trim() || !rol_id) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 8) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Validar que el rol exista
        const rol = await pool.query(
            'SELECT id FROM roles WHERE id = $1',
            [rol_id]
        );

        if (rol.rowCount === 0) {
            return res.status(400).json({
                mensaje: 'El rol especificado no existe'
            });
        }

        // Comprobar si el correo ya está registrado
        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE correo = $1',
            [correoNormalizado]
        );

        if (usuarioExistente.rowCount > 0) {
            return res.status(409).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear usuario con el rol indicado
        const resultado = await pool.query(
            `INSERT INTO usuarios (nombre, correo, password_hash, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nombre, correo, rol_id, activo, fecha_creacion`,
            [nombre.trim(), correoNormalizado, passwordHash, Number(rol_id)]
        );

        return res.status(201).json({
            mensaje: 'Usuario creado correctamente',
            usuario: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al crear usuario:', error.message);

        // Correo duplicado en PostgreSQL
        if (error.code === '23505') {
            return res.status(409).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
};

const actualizarRolUsuario = async (req, res) => {
    let client;

    try {

        client = await pool.connect();

        const { id } = req.params;
        const { rol_id } = req.body;

        if (!rol_id) {
            return res.status(400).json({
                mensaje: 'Debes especificar el nuevo rol'
            });
        }

        if (Number(id) === Number(req.usuario.id)) {
            return res.status(403).json({
                mensaje: 'No puedes modificar tu propio rol'
            });
        }

        await client.query('BEGIN');

        // Serializar operaciones administrativas
        await client.query(
            'LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE'
        );

        // Verificar que el rol exista
        const rol = await client.query(
            'SELECT id FROM roles WHERE id = $1',
            [rol_id]
        );

        if (rol.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                mensaje: 'El rol especificado no existe'
            });
        }

        // Consultar usuario actual
        const usuario = await client.query(
            `SELECT u.id, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1`,
            [id]
        );

        if (usuario.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        // Comprobar si se está quitando el último rol de administrador
        if (usuario.rows[0].rol === 'Administrador') {
            const nuevoRol = await client.query(
                'SELECT nombre FROM roles WHERE id = $1',
                [rol_id]
            );

            if (nuevoRol.rows[0].nombre !== 'Administrador') {
                const administradores = await client.query(
                    `SELECT COUNT(*) AS total
                     FROM usuarios u
                     INNER JOIN roles r ON r.id = u.rol_id
                     WHERE r.nombre = 'Administrador'
                     AND u.activo = TRUE
                     AND u.id <> $1`,
                    [id]
                );

                if (Number(administradores.rows[0].total) === 0) {
                    await client.query('ROLLBACK');

                    return res.status(409).json({
                        mensaje: 'No puedes quitar el rol al último administrador activo'
                    });
                }
            }
        }

        const resultado = await client.query(
            `UPDATE usuarios
             SET rol_id = $1
             WHERE id = $2
             RETURNING id, nombre, correo, rol_id, activo`,
            [rol_id, id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            mensaje: 'Rol actualizado correctamente',
            usuario: resultado.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        console.error('Error al actualizar rol:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

const desactivarUsuario = async (req, res) => {
    let client;

    try {

        client = await pool.connect();

        const { id } = req.params;

        // Evitar que el administrador se desactive a sí mismo
        if (Number(id) === Number(req.usuario.id)) {
            return res.status(403).json({
                mensaje: 'No puedes desactivar tu propia cuenta'
            });
        }

        await client.query('BEGIN');
        // Serializar operaciones que puedan afectar a los administradores
        await client.query(
             'LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE'
        );
        // Bloquear el usuario que se desea desactivar
        const usuario = await client.query(
            `SELECT u.id, u.activo, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1
             FOR UPDATE OF u`,
            [id]
        );

        if (usuario.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        if (!usuario.rows[0].activo) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                mensaje: 'El usuario ya está desactivado'
            });
        }

        // Si es administrador, comprobar que quede otro activo
        if (usuario.rows[0].rol === 'Administrador') {
            const administradores = await client.query(
                `SELECT COUNT(*) AS total
                 FROM usuarios u
                 INNER JOIN roles r ON r.id = u.rol_id
                 WHERE r.nombre = 'Administrador'
                 AND u.activo = TRUE
                 AND u.id <> $1`,
                [id]
            );

            if (Number(administradores.rows[0].total) === 0) {
                await client.query('ROLLBACK');

                return res.status(409).json({
                    mensaje: 'No puedes desactivar al último administrador activo'
                });
            }
        }

        // Desactivar usuario
        await client.query(
            `UPDATE usuarios
             SET activo = FALSE
             WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            mensaje: 'Usuario desactivado correctamente',
            id: Number(id),
            activo: false
        });

    } catch (error) {
        if (client){
        await client.query('ROLLBACK').catch(() => {});
    }
        console.error('Error al desactivar usuario:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = {
registrarUsuario,
iniciarSesion,
obtenerUsuarios,
crearUsuarioAdmin,
actualizarRolUsuario,
desactivarUsuario
};
