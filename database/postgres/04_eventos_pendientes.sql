
CREATE TABLE eventos_pendientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tipo VARCHAR(60) NOT NULL,

    solicitud_id INTEGER NOT NULL,

    payload JSONB NOT NULL,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    fecha_procesamiento TIMESTAMPTZ,

    intentos INTEGER NOT NULL DEFAULT 0,

    ultimo_error TEXT,

    reservado_por VARCHAR(150),

    reservado_hasta TIMESTAMPTZ,

    CONSTRAINT eventos_solicitud_fk
        FOREIGN KEY (solicitud_id)
        REFERENCES solicitudes_adopcion(id)
);

CREATE INDEX idx_eventos_pendientes_sin_procesar
ON eventos_pendientes(fecha_creacion)
WHERE fecha_procesamiento IS NULL;
