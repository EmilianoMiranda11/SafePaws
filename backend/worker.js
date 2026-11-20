
const pool = require('./src/config/db');

const {
    conectarMongo,
    cerrarMongo
} = require('./src/config/mongo');

const {
    procesarEventos,
    detenerWorker
} = require('./src/services/eventosWorker');

let intervaloEventos = null;
let apagando = false;

const INTERVALO_PROCESAMIENTO = 5000;

async function iniciarWorker() {
    try {
        // Verificar conexión con PostgreSQL
        await pool.query('SELECT 1');
        console.log('Worker: PostgreSQL está disponible');

        // Establecer conexión con MongoDB
        await conectarMongo();
        console.log('Worker: MongoDB está disponible');

        console.log('Worker de SafePaws iniciado');

        // Procesar eventos inmediatamente
        await procesarEventos();

        // Continuar procesando eventos cada 5 segundos
        intervaloEventos = setInterval(() => {
            procesarEventos();
        }, INTERVALO_PROCESAMIENTO);

    } catch (error) {
        console.error('Error al iniciar el Worker:', error.message);
        await cerrarRecursos();
        process.exit(1);
    }
}

async function cerrarRecursos() {
    if (apagando) return;

    apagando = true;

    console.log('Deteniendo Worker de SafePaws...');

    if (intervaloEventos) {
        clearInterval(intervaloEventos);
        intervaloEventos = null;
    }

    try {
        // Esperar el procesamiento actual y liberar reservas
        await detenerWorker();

        // Cerrar conexiones
        await pool.end();
        await cerrarMongo();

        console.log('Worker detenido correctamente');
    } catch (error) {
        console.error('Error durante el cierre del Worker:', error.message);
        process.exitCode = 1;
    }
}

process.on('SIGTERM', cerrarRecursos);
process.on('SIGINT', cerrarRecursos);

iniciarWorker();
