CREATE TABLE visitantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    cantidad_personas INTEGER,
    tipo_visita VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    producto VARCHAR(100),
    categoria VARCHAR(100),
    stock INTEGER
);

CREATE TABLE tareas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150),
    responsable VARCHAR(100),
    estado VARCHAR(50)
);

CREATE TABLE incidencias (
    id SERIAL PRIMARY KEY,
    descripcion TEXT,
    ubicacion VARCHAR(100),
    prioridad VARCHAR(50)
);