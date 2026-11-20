const pool = require('../config/db');

const obtenerAnimales = async (req, res) => {
try {
const resultado = await pool.query(
`SELECT id, nombre, especie, raza, sexo, fecha_nacimiento,
                    descripcion, estado, fecha_ingreso
             FROM animales
             ORDER BY id`
);

    res.status(200).json({
        total: resultado.rows.length,
        animales: resultado.rows
    });
} catch (error) {
    console.error('Error al consultar animales:', error.message);

    res.status(500).json({
        mensaje: 'Error al obtener los animales'
    });
}


};

const crearAnimal = async (req, res) => {
    try {
        const {
            nombre,
            especie,
            raza,
            sexo,
            fecha_nacimiento,
            descripcion,
            estado
        } = req.body;

        // Validar tipos de datos obligatorios
        if (
            typeof nombre !== 'string' ||
            typeof especie !== 'string'
        ) {
            return res.status(400).json({
                mensaje: 'El nombre y la especie son obligatorios y deben ser texto'
            });
        }

        // Normalizar campos obligatorios
        const nombreNormalizado = nombre.trim();
        const especieNormalizada = especie.trim();

        if (!nombreNormalizado || !especieNormalizada) {
            return res.status(400).json({
                mensaje: 'El nombre y la especie no pueden estar vacíos'
            });
        }

        // Validar longitud
        if (nombreNormalizado.length > 100) {
            return res.status(400).json({
                mensaje: 'El nombre no puede superar los 100 caracteres'
            });
        }

        if (especieNormalizada.length > 30) {
            return res.status(400).json({
                mensaje: 'La especie no puede superar los 30 caracteres'
            });
        }

        // Normalizar campos opcionales de texto
        const razaNormalizada =
            typeof raza === 'string' && raza.trim() ? raza.trim() : null;

        const descripcionNormalizada =
            typeof descripcion === 'string' && descripcion.trim()
                ? descripcion.trim()
                : null;

        const resultado = await pool.query(
            `INSERT INTO animales
                (nombre, especie, raza, sexo, fecha_nacimiento, descripcion, estado)
             VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Rescatado'))
             RETURNING id, nombre, especie, raza, sexo, fecha_nacimiento,
                       descripcion, estado, fecha_ingreso`,
            [
                nombreNormalizado,
                especieNormalizada,
                razaNormalizada,
                sexo ?? null,
                fecha_nacimiento ?? null,
                descripcionNormalizada,
                estado ?? null
            ]
        );

        res.status(201).json({
            mensaje: 'Animal registrado correctamente',
            animal: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar animal:', error.message);

        if (['23514', '23502', '22001', '22007'].includes(error.code)) {
            return res.status(400).json({
                mensaje: 'Los datos proporcionados no son válidos'
            });
        }

        res.status(500).json({
            mensaje: 'Error al registrar el animal'
        });
    }
};

const actualizarAnimal = async (req, res) => {
try {
const { id } = req.params;
    const {
        nombre,
        especie,
        raza,
        sexo,
        fecha_nacimiento,
        descripcion,
        estado
    } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: 'El ID del animal no es válido'
        });
    }

    if (
        typeof nombre !== 'string' ||
        typeof especie !== 'string'
    ) {
        return res.status(400).json({
            mensaje: 'El nombre y la especie son obligatorios y deben ser texto'
        });
    }

    const nombreNormalizado = nombre.trim();
    const especieNormalizada = especie.trim();

    if (!nombreNormalizado || !especieNormalizada) {
        return res.status(400).json({
            mensaje: 'El nombre y la especie no pueden estar vacíos'
        });
    }

    if (nombreNormalizado.length > 100) {
        return res.status(400).json({
            mensaje: 'El nombre no puede superar los 100 caracteres'
        });
    }

    if (especieNormalizada.length > 30) {
        return res.status(400).json({
            mensaje: 'La especie no puede superar los 30 caracteres'
        });
    }

    const razaNormalizada =
        typeof raza === 'string' && raza.trim() ? raza.trim() : null;

    const descripcionNormalizada =
        typeof descripcion === 'string' && descripcion.trim()
            ? descripcion.trim()
            : null;
        
        console.log('Estado recibido:', estado);
        console.log('Estado enviado a SQL:', estado ?? null);

    const resultado = await pool.query(
        `UPDATE animales
         SET nombre = $1,
             especie = $2,
             raza = $3,
             sexo = $4,
             fecha_nacimiento = $5,
             descripcion = $6,
             estado = COALESCE($7, estado)
         WHERE id = $8
         RETURNING id, nombre, especie, raza, sexo, fecha_nacimiento,
                   descripcion, estado, fecha_ingreso`,
        [
            nombreNormalizado,
            especieNormalizada,
            razaNormalizada,
            sexo ?? null,
            fecha_nacimiento ?? null,
            descripcionNormalizada,
            estado ?? null,
            Number(id)
        ]
    );

    if (resultado.rowCount === 0) {
        return res.status(404).json({
            mensaje: 'No se encontró un animal con ese ID'
        });
    }

    res.status(200).json({
        mensaje: 'Animal actualizado correctamente',
        animal: resultado.rows[0]
    });

} catch (error) {
    console.error('Error al actualizar animal:', error.message);

    if (['23514', '23502', '22001', '22007', '22P02'].includes(error.code)) {
        return res.status(400).json({
            mensaje: 'Los datos proporcionados no son válidos'
        });
    }

    res.status(500).json({
        mensaje: 'Error al actualizar el animal'
    });
}

};


const eliminarAnimal = async (req, res) => {
try {
const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: 'El ID del animal no es válido'
        });
    }

    const resultado = await pool.query(
        `DELETE FROM animales
         WHERE id = $1
           AND estado <> 'Adoptado'
         RETURNING id, nombre, especie, estado`,
        [Number(id)]
    );

    if (resultado.rowCount === 0) {
        const consulta = await pool.query(
            'SELECT id, estado FROM animales WHERE id = $1',
            [Number(id)]
        );

        if (consulta.rowCount === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró un animal con ese ID'
            });
        }

        return res.status(409).json({
            mensaje: 'No se puede eliminar un animal que ya está adoptado'
        });
    }

    res.status(200).json({
        mensaje: 'Animal eliminado correctamente',
        animal: resultado.rows[0]
    });

} catch (error) {
console.error('Error al eliminar animal:', error.message);

if (error.code === '23503') {
    return res.status(409).json({
        mensaje: 'No se puede eliminar el animal porque tiene solicitudes de adopción relacionadas'
    });
}

return res.status(500).json({
    mensaje: 'Error al eliminar el animal'
});

}

};

module.exports = {
obtenerAnimales,
crearAnimal,
actualizarAnimal,
eliminarAnimal
};
