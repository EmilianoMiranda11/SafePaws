const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri);

let database;

async function conectarMongo() {
    try {
        await client.connect();

        database = client.db(process.env.MONGO_DB || 'safepaws');

        console.log('Conexión establecida con MongoDB');

        return database;
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        throw error;
    }
}

function obtenerMongo() {
    if (!database) {
        throw new Error('MongoDB todavía no está conectado');
    }

    return database;
}

async function cerrarMongo() {
    await client.close();
    console.log('Conexión con MongoDB cerrada');
}

module.exports = {
    conectarMongo,
    obtenerMongo,
    cerrarMongo
};