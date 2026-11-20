const pool = require('../config/db');
const { registrarEvento } = require('../services/eventosService');

// Registrar una nueva solicitud de adopción
const crearSolicitud = async (req, res) => {
    let client;

    try {
        const usuario_id = req.usuario.id;
        const { animal_id, observaciones } = req.body;

        // Validar que los identificadores sean enteros positivos
        if (
            !Number.isInteger(Number(usuario_id)) ||
            Number(usuario_id) <= 0 ||
            !Number.isInteger(Number(animal_id)) ||
            Number(animal_id) <= 0
        ) {
            return res.status(400).json({
                mensaje: 'El usuario y el animal deben tener identificadores válidos'
            });
        }

        client = await pool.connect();

        await client.query('BEGIN');

        // Comprobar que el usuario exista y esté activo.
        // Bloquear al usuario para coordinar sus solicitudes simultáneas.
        const usuario = await client.query(
            `SELECT u.id, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1 AND u.activo = TRUE
             FOR UPDATE OF u`,
            [Number(usuario_id)]
        );

        if (usuario.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'El usuario no existe o está inactivo'
            });
        }

        // Solo los usuarios con el rol Adoptante pueden solicitar adopciones
        if (usuario.rows[0].rol !== 'Adoptante') {
            await client.query('ROLLBACK');

            return res.status(403).json({
                mensaje: 'Solo los usuarios con rol Adoptante pueden solicitar adopciones'
            });
        }

        // Comprobar que el animal exista y bloquear su registro
        const animal = await client.query(
            `SELECT id, estado
             FROM animales
             WHERE id = $1
             FOR UPDATE`,
            [Number(animal_id)]
        );

        if (animal.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'No se encontró el animal solicitado'
            });
        }

        // Verificar que el animal siga disponible
        if (animal.rows[0].estado !== 'Disponible') {
            await client.query('ROLLBACK');

            return res.status(409).json({
                mensaje: 'El animal no está disponible para adopción'
            });
        }

        // Verificar solicitudes duplicadas
        const solicitudDuplicada = await client.query(
            `SELECT id, estado
             FROM solicitudes_adopcion
             WHERE usuario_id = $1
               AND animal_id = $2
               AND estado IN ('En Revisión', 'Aprobada')
             LIMIT 1`,
            [Number(usuario_id), Number(animal_id)]
        );

        if (solicitudDuplicada.rowCount > 0) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                mensaje: 'Ya existe una solicitud activa para este animal'
            });
        }

        // Verificar el límite de dos solicitudes en revisión
        const solicitudesActivas = await client.query(
            `SELECT COUNT(*)::INTEGER AS total
             FROM solicitudes_adopcion
             WHERE usuario_id = $1
               AND estado = 'En Revisión'`,
            [Number(usuario_id)]
        );

        if (solicitudesActivas.rows[0].total >= 2) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                mensaje: 'El adoptante ya tiene dos solicitudes en revisión'
            });
        }

        // Registrar la solicitud
const resultado = await client.query(
    `INSERT INTO solicitudes_adopcion
        (usuario_id, animal_id, observaciones)
     VALUES ($1, $2, $3)
     RETURNING id, usuario_id, animal_id, estado,
               fecha_solicitud, observaciones`,
    [
        Number(usuario_id),
        Number(animal_id),
        observaciones ?? null
    ]
);

const solicitud = resultado.rows[0];

// Registrar evento dentro de la misma transacción
await registrarEvento(
    client,
    'SOLICITUD_CREADA',
    solicitud.id,
    {
        usuario_id: solicitud.usuario_id,
        animal_id: solicitud.animal_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud
    }
);

// Confirmar todas las operaciones
await client.query('COMMIT');

        return res.status(201).json({
            mensaje: 'Solicitud de adopción registrada correctamente',
            solicitud: resultado.rows[0]
        });

    } catch (error) {

        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Error al revertir la transacción:', rollbackError.message);
            }
        }

        console.error('Error al registrar la solicitud:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al registrar la solicitud'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Consultar solicitudes de adopción
const obtenerSolicitudes = async (req, res) => {
try {
let consulta = `             SELECT
                s.id,
                s.usuario_id,
                u.nombre AS nombre_adoptante,
                s.animal_id,
                a.nombre AS nombre_animal,
                s.estado,
                s.fecha_solicitud,
                s.observaciones
            FROM solicitudes_adopcion s
            INNER JOIN usuarios u ON u.id = s.usuario_id
            INNER JOIN animales a ON a.id = s.animal_id
        `;

    const parametros = [];

    // Los adoptantes solamente pueden consultar sus solicitudes
    if (req.usuario.rol === 'Adoptante') {
        consulta += ' WHERE s.usuario_id = $1';
        parametros.push(req.usuario.id);
    }

    consulta += ' ORDER BY s.fecha_solicitud DESC';

    const resultado = await pool.query(consulta, parametros);

    return res.status(200).json({
        total: resultado.rows.length,
        solicitudes: resultado.rows
    });

} catch (error) {
    console.error('Error al consultar las solicitudes:', error.message);

    return res.status(500).json({
        mensaje: 'Error al obtener las solicitudes'
    });
}

};

// Actualizar el estado de una solicitud de adopción
const actualizarSolicitud = async (req, res) => {
let client;

try {
    const id = Number(req.params.id);
    const { estado, observaciones } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El ID de la solicitud no es válido'
        });
    }

    const estadosPermitidos = [
        'Aprobada',
        'Rechazada',
    ];

    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            mensaje: 'El estado solicitado no es válido'
        });
    }

    client = await pool.connect();

    await client.query('BEGIN');

    // Obtener el animal relacionado con la solicitud
    const solicitudInicial = await client.query(
        `SELECT animal_id
         FROM solicitudes_adopcion
         WHERE id = $1`,
        [id]
    );

    if (solicitudInicial.rowCount === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
            mensaje: 'No se encontró la solicitud'
        });
    }

    const animalId = solicitudInicial.rows[0].animal_id;

    // Bloquear el animal para evitar aprobaciones simultáneas
    if (estado === 'Aprobada') {
        const animal = await client.query(
            `SELECT id, estado
             FROM animales
             WHERE id = $1
             FOR UPDATE`,
            [animalId]
        );

        if (
            animal.rowCount === 0 ||
            animal.rows[0].estado !== 'Disponible'
        ) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                mensaje: 'El animal ya no está disponible para adopción'
            });
        }
    }

    // Bloquear y consultar nuevamente la solicitud
    const solicitud = await client.query(
        `SELECT id, usuario_id, animal_id, estado
         FROM solicitudes_adopcion
         WHERE id = $1
         FOR UPDATE`,
        [id]
    );

    const solicitudActual = solicitud.rows[0];

    // Solo se pueden modificar solicitudes en revisión
    if (solicitudActual.estado !== 'En Revisión') {
        await client.query('ROLLBACK');

        return res.status(409).json({
            mensaje: 'Solo se pueden actualizar solicitudes en revisión'
        });
    }

    // Si se aprueba la solicitud
    if (estado === 'Aprobada') {

        // Cambiar el estado del animal
        await client.query(
            `UPDATE animales
             SET estado = 'En Trámite'
             WHERE id = $1`,
            [animalId]
        );

      // Cancelar las demás solicitudes pendientes del animal
const canceladas = await client.query(
    `UPDATE solicitudes_adopcion
     SET estado = 'Cancelada',
         observaciones = CONCAT(
             COALESCE(observaciones || ' | ', ''),
             'Cancelada automáticamente porque otra solicitud fue aprobada'
         )
     WHERE animal_id = $1
       AND id <> $2
       AND estado = 'En Revisión'
     RETURNING id, usuario_id, animal_id, estado`,
    [animalId, id]
);

// Registrar un evento por cada solicitud cancelada
for (const solicitudCancelada of canceladas.rows) {
    await registrarEvento(
        client,
        'SOLICITUD_CANCELADA_AUTOMATICAMENTE',
        solicitudCancelada.id,
        {
            usuario_id: solicitudCancelada.usuario_id,
            animal_id: solicitudCancelada.animal_id,
            estado: solicitudCancelada.estado,
            motivo: 'Otra solicitud del mismo animal fue aprobada'
        }
    );
}
    }

    // Actualizar la solicitud principal
    const resultado = await client.query(
        `UPDATE solicitudes_adopcion
         SET estado = $1,
             observaciones = COALESCE($2, observaciones)
         WHERE id = $3
         RETURNING id, usuario_id, animal_id, estado,
                   fecha_solicitud, observaciones`,
        [estado, observaciones ?? null, id]
    );

    const solicitudActualizada = resultado.rows[0];

// Registrar el evento de aprobación o rechazo
await registrarEvento(
    client,
    estado === 'Aprobada'
        ? 'SOLICITUD_APROBADA'
        : 'SOLICITUD_RECHAZADA',
    solicitudActualizada.id,
    {
        usuario_id: solicitudActualizada.usuario_id,
        animal_id: solicitudActualizada.animal_id,
        estado: solicitudActualizada.estado,
        observaciones: solicitudActualizada.observaciones
    }
);

    await client.query('COMMIT');

    return res.status(200).json({
        mensaje: 'Solicitud actualizada correctamente',
        solicitud: resultado.rows[0]
    });

} catch (error) {

    if (client) {
       try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error al revertir la transacción:', rollbackError.message);
        }
    }
    console.error('Error al actualizar la solicitud:', error.message);

    return res.status(500).json({
        mensaje: 'Error interno al actualizar la solicitud'
    });

} finally {
    if (client) {
        client.release();
    }
}

};

// Cancelar una solicitud de adopción
const eliminarSolicitud = async (req, res) => {

    let client;

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El ID de la solicitud no es válido'
            });
        }

        client = await pool.connect();

        await client.query('BEGIN');

        let consulta = `
            UPDATE solicitudes_adopcion
            SET estado = 'Cancelada'
            WHERE id = $1
              AND estado = 'En Revisión'
        `;

        const parametros = [id];

        // El adoptante solamente puede cancelar sus propias solicitudes
        if (req.usuario.rol === 'Adoptante') {
            consulta += ' AND usuario_id = $2';
            parametros.push(req.usuario.id);
        }

        consulta += `
            RETURNING id, usuario_id, animal_id, estado
        `;

        const resultado = await client.query(consulta, parametros);

        if (resultado.rowCount === 0) {

            await client.query('ROLLBACK');

            // Comprobar si la solicitud existe
            const solicitud = await pool.query(
                'SELECT id, usuario_id, estado FROM solicitudes_adopcion WHERE id = $1',
                [id]
            );

            if (solicitud.rowCount === 0) {
                return res.status(404).json({
                    mensaje: 'No se encontró la solicitud'
                });
            }

            // Evitar revelar información de solicitudes ajenas
            if (
                req.usuario.rol === 'Adoptante' &&
                solicitud.rows[0].usuario_id !== req.usuario.id
            ) {
                return res.status(404).json({
                    mensaje: 'No se encontró la solicitud'
                });
            }

            return res.status(409).json({
                mensaje: 'Solo se pueden cancelar solicitudes en revisión'
            });
        }

        const solicitudCancelada = resultado.rows[0];

        // Registrar el evento dentro de la misma transacción
        await registrarEvento(
            client,
            'SOLICITUD_CANCELADA',
            solicitudCancelada.id,
            {
                usuario_id: solicitudCancelada.usuario_id,
                animal_id: solicitudCancelada.animal_id,
                estado: solicitudCancelada.estado
            }
        );

        await client.query('COMMIT');

        return res.status(200).json({
            mensaje: 'Solicitud cancelada correctamente',
            solicitud: solicitudCancelada
        });

    } catch (error) {

        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error(
                    'Error al revertir la transacción:',
                    rollbackError.message
                );
            }
        }

        console.error('Error al cancelar la solicitud:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al cancelar la solicitud'
        });

    } finally {

        if (client) {
            client.release();
        }

    }
};

module.exports = {
crearSolicitud,
obtenerSolicitudes,
actualizarSolicitud,
eliminarSolicitud
};
