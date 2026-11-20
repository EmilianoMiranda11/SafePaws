
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

let server;
let apagando = false;

async function iniciarServidor() {
    try {
        // Comprobar conexión con PostgreSQL
        await pool.query('SELECT 1');
        console.log('PostgreSQL está disponible');

        // Iniciar servidor Express
        server = app.listen(PORT, HOST, () => {
            console.log(
                `Servidor SafePaws ejecutándose en ${HOST}:${PORT}`
            );
        });

        server.on('error', async (error) => {
            console.error('Error del servidor HTTP:', error.message);
            await cerrarServidor();
            process.exitCode = 1;
        });

    } catch (error) {
        console.error('Error al iniciar SafePaws:', error.message);

        await pool.end().catch(() => {});

        process.exitCode = 1;
    }
}

async function cerrarServidor() {
    if (apagando) return;

    apagando = true;

    console.log('Cerrando servidor SafePaws...');

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        // Cerrar conexiones de PostgreSQL
        await pool.end();

        console.log('Conexiones PostgreSQL cerradas');
        console.log('Servidor SafePaws detenido');

    } catch (error) {
        console.error('Error durante el cierre:', error.message);
        process.exitCode = 1;
    }
}

process.on('SIGTERM', cerrarServidor);
process.on('SIGINT', cerrarServidor);

iniciarServidor();
