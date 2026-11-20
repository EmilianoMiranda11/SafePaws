const { randomUUID } = require('crypto');
const os = require('os');

const {
    reservarEventos,
    marcarEventoProcesado,
    registrarErrorEvento,
    liberarReservasWorker
} = require('./eventosService');

const { obtenerMongo } = require('../config/mongo');

const workerId = `${os.hostname()}-${process.pid}-${randomUUID()}`;

let procesamientoActual = null;

async function ejecutarProcesamiento() {
    try {
        const eventos = await reservarEventos(workerId, 10, 60);

        console.log(`Worker ${workerId}: ${eventos.length} eventos reservados`);

        if (eventos.length === 0) return;

        const db = obtenerMongo();
        const coleccion = db.collection('eventos_adopcion');

        for (const evento of eventos) {
            try {
                await coleccion.updateOne(
                    { _id: String(evento.id) },
                    {
                        $setOnInsert: {
                            tipo: evento.tipo,
                            solicitud_id: evento.solicitud_id,
                            payload: evento.payload,
                            fecha_evento: new Date()
                        }
                    },
                    { upsert: true }
                );

                const procesado = await marcarEventoProcesado(
                    evento.id,
                    workerId
                );

                if (procesado) {
                    console.log(`Evento ${evento.id} procesado correctamente`);
                } else {
                    console.warn(
                        `El worker perdió la reserva del evento ${evento.id}`
                    );
                }

            } catch (error) {
                try {
                    await registrarErrorEvento(
                        evento.id,
                        workerId,
                        error.message
                    );
                } catch (errorRegistro) {
                    console.error(
                        `No se pudo registrar el error del evento ${evento.id}:`,
                        errorRegistro.message
                    );
                }

                console.error(
                    `Error al procesar evento ${evento.id}:`,
                    error.message
                );
            }
        }

    } catch (error) {
        console.error('Error en el worker de eventos:', error.message);
    }
}

function procesarEventos() {
    // Evitar ejecuciones simultáneas dentro de esta instancia
    if (procesamientoActual) {
        return procesamientoActual;
    }

    procesamientoActual = ejecutarProcesamiento()
        .finally(() => {
            procesamientoActual = null;
        });

    return procesamientoActual;
}

async function detenerWorker() {
    // Esperar a que termine el procesamiento en curso
    if (procesamientoActual) {
        await procesamientoActual;
    }

    // Liberar las reservas restantes de esta instancia
    await liberarReservasWorker(workerId);

    console.log(`Reservas liberadas para ${workerId}`);
}

module.exports = {
    procesarEventos,
    detenerWorker
};