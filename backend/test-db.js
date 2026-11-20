const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
path: path.resolve(__dirname, '../.env'),
override: true
});

console.log('Configuración cargada:');
console.log('Usuario:', process.env.POSTGRES_USER);
console.log('Base de datos:', process.env.POSTGRES_DB);
console.log('Contraseña definida:', Boolean(process.env.POSTGRES_PASSWORD));
console.log('Longitud de contraseña:', process.env.POSTGRES_PASSWORD?.length);

const pool = require('./src/config/db');

async function probarConexion() {
try {
const resultado = await pool.query(
'SELECT current_database() AS base_datos, current_user AS usuario'
);

    console.log('\n¡Conexión exitosa con PostgreSQL!');
    console.log('Base de datos:', resultado.rows[0].base_datos);
    console.log('Usuario:', resultado.rows[0].usuario);
} catch (error) {
    console.error('\nError de conexión:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
} finally {
    await pool.end();
}

}

probarConexion();
