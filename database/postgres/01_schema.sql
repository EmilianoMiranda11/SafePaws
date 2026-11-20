-- Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL,
    descripcion VARCHAR(150)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de animales
CREATE TABLE animales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(30) NOT NULL,
    raza VARCHAR(80),
    sexo VARCHAR(20),
    fecha_nacimiento DATE,
    descripcion TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Rescatado',
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_animales_especie
        CHECK (especie IN ('Perro', 'Gato', 'Otro')),

    CONSTRAINT chk_animales_sexo
        CHECK (sexo IS NULL OR sexo IN ('Macho', 'Hembra', 'Desconocido')),

    CONSTRAINT chk_animales_estado
        CHECK (estado IN (
            'Rescatado',
            'En Cuarentena',
            'Disponible',
            'En Trámite',
            'Adoptado'
        ))
);

-- Tabla de solicitudes de adopcion
CREATE TABLE solicitudes_adopcion (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    animal_id INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'En Revisión',
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,

    CONSTRAINT solicitudes_estado_check
        CHECK (estado IN (
            'En Revisión',
            'Aprobada',
            'Rechazada',
            'Cancelada'
        )),

    CONSTRAINT solicitudes_usuario_fk
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT solicitudes_animal_fk
        FOREIGN KEY (animal_id) REFERENCES animales(id)
);