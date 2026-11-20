const pool = require('../config/db');

// Registrar un evento dentro de una transacción PostgreSQL
async function registrarEvento(client, tipo, solicitudId, payload) {
    await client.query(
        `INSERT INTO eventos_pendientes
            (tipo, solicitud_id, payload)
         VALUES ($1, $2, $3)`,
        [tipo, solicitudId, JSON.stringify(payload)]
    );

    console.log(`Evento registrado: ${tipo} - Solicitud ${solicitudId}`);
}

// Reservar eventos pendientes para un worker específico
async function reservarEventos(workerId, limite = 10, duracionSegundos = 60) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultado = await client.query(
            `WITH eventos AS (
                SELECT id
                FROM eventos_pendientes
                WHERE fecha_procesamiento IS NULL
                  AND (
                      reservado_hasta IS NULL
                      OR reservado_hasta < CURRENT_TIMESTAMP
                  )
                ORDER BY fecha_creacion ASC
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            )
            UPDATE eventos_pendientes AS ep
            SET reservado_por = $2,
                reservado_hasta = CURRENT_TIMESTAMP
                    + ($3 * INTERVAL '1 second')
            FROM eventos
            WHERE ep.id = eventos.id
            RETURNING ep.id, ep.tipo, ep.solicitud_id, ep.payload, ep.intentos`,
            [limite, workerId, duracionSegundos]
        );

        await client.query('COMMIT');

        return resultado.rows;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
}

// Marcar evento como procesado, verificando que pertenezca al worker
async function marcarEventoProcesado(id, workerId) {
    const resultado = await pool.query(
        `UPDATE eventos_pendientes
         SET fecha_procesamiento = CURRENT_TIMESTAMP,
             ultimo_error = NULL,
             reservado_por = NULL,
             reservado_hasta = NULL
         WHERE id = $1
           AND reservado_por = $2
           AND fecha_procesamiento IS NULL`,
        [id, workerId]
    );

    return resultado.rowCount === 1;
}

// Registrar error y liberar la reserva del worker
async function registrarErrorEvento(id, workerId, error) {
    const resultado = await pool.query(
        `UPDATE eventos_pendientes
         SET intentos = intentos + 1,
             ultimo_error = $3,
             reservado_por = NULL,
             reservado_hasta = NULL
         WHERE id = $1
           AND reservado_por = $2
           AND fecha_procesamiento IS NULL`,
        [id, workerId, String(error).slice(0, 2000)]
    );

    return resultado.rowCount === 1;
}

// Liberar las reservas de un worker al detenerse
async function liberarReservasWorker(workerId) {
    await pool.query(
        `UPDATE eventos_pendientes
         SET reservado_por = NULL,
             reservado_hasta = NULL
         WHERE reservado_por = $1
           AND fecha_procesamiento IS NULL`,
        [workerId]
    );
}

module.exports = {
    registrarEvento,
    reservarEventos,
    marcarEventoProcesado,
    registrarErrorEvento,
    liberarReservasWorker
};