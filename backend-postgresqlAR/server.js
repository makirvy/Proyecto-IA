const express = require("express");
const cors = require("cors");
require('dotenv').config();
const pool = require('./db');

const app = express();

// Configuración de Middlewares
app.use(cors());
app.use(express.json());

/* ==========================================
   RUTAS DE LA API (Aseguramos el prefijo /api)
========================================== */

// --- RUTA DEL DASHBOARD (CONTEO TOTALES) ---
app.get("/api/dashboard", async (req, res) => {
    try {
        const v = await pool.query("SELECT COUNT(*) FROM visitantes");
        const inv = await pool.query("SELECT COUNT(*) FROM inventario");
        const t = await pool.query("SELECT COUNT(*) FROM tareas");
        const inc = await pool.query("SELECT COUNT(*) FROM incidencias");
        
        res.json({
            visitantes: parseInt(v.rows[0].count),
            inventario: parseInt(inv.rows[0].count),
            tareas: parseInt(t.rows[0].count),
            incidencias: parseInt(inc.rows[0].count)
        });
    } catch (err) {
        console.error("Error en Dashboard:", err.message);
        res.status(500).json({ error: "Error en los contadores" });
    }
});

// --- ENTRADAS Y SALIDAS DE VISITANTES ---
app.get("/api/visitantes", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM visitantes ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { 
        console.error(err.message); 
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/visitantes", async (req, res) => {
    try {
        const { nombre, cantidad_personas, tipo_visita } = req.body;
        const result = await pool.query(
            "INSERT INTO visitantes (nombre, cantidad_personas, tipo_visita) VALUES ($1, $2, $3) RETURNING *",
            [nombre, cantidad_personas, tipo_visita]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        console.error("Error al insertar visitante:", err.message); 
        res.status(500).send(err.message); 
    }
});

// --- GESTIÓN DE INVENTARIO ---
app.get("/api/inventario", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM inventario ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { console.error(err.message); res.status(500).end(); }
});

app.post("/api/inventario", async (req, res) => {
    try {
        const { producto, categoria, stock } = req.body;
        const result = await pool.query(
            "INSERT INTO inventario (producto, categoria, stock) VALUES ($1, $2, $3) RETURNING *",
            [producto, categoria, stock]
        );
        res.json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).send("Error al guardar"); }
});

app.put("/api/inventario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { producto, categoria, stock } = req.body;
        await pool.query("UPDATE inventario SET producto=$1, categoria=$2, stock=$3 WHERE id=$4", [producto, categoria, stock, id]);
        res.send("Actualizado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

app.delete("/api/inventario/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM inventario WHERE id = $1", [req.params.id]);
        res.send("Eliminado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

// --- CONTROL DE TAREAS ---
app.get("/api/tareas", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tareas ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { console.error(err.message); res.status(500).end(); }
});

app.post("/api/tareas", async (req, res) => {
    try {
        const { titulo, responsable, estado } = req.body;
        const result = await pool.query(
            "INSERT INTO tareas (titulo, responsable, estado) VALUES ($1, $2, $3) RETURNING *",
            [titulo, responsable, estado]
        );
        res.json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).send("Error al guardar"); }
});

app.put("/api/tareas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, responsable, estado } = req.body;
        await pool.query("UPDATE tareas SET titulo=$1, responsable=$2, estado=$3 WHERE id=$4", [titulo, responsable, estado, id]);
        res.send("Actualizado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

app.delete("/api/tareas/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM tareas WHERE id = $1", [req.params.id]);
        res.send("Eliminado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

// --- REPORTE DE INCIDENCIAS ---
app.get("/api/incidencias", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM incidencias ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { console.error(err.message); res.status(500).end(); }
});

app.post("/api/incidencias", async (req, res) => {
    try {
        const { descripcion, ubicacion, prioridad } = req.body;
        const result = await pool.query(
            "INSERT INTO incidencias (descripcion, ubicacion, prioridad) VALUES ($1, $2, $3) RETURNING *",
            [descripcion, ubicacion, prioridad]
        );
        res.json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).send("Error al guardar"); }
});

app.put("/api/incidencias/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, ubicacion, prioridad } = req.body;
        await pool.query("UPDATE incidencias SET descripcion=$1, ubicacion=$2, prioridad=$3 WHERE id=$4", [descripcion, ubicacion, prioridad, id]);
        res.send("Actualizado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

app.delete("/api/incidencias/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM incidencias WHERE id = $1", [req.params.id]);
        res.send("Eliminado");
    } catch (err) { console.error(err.message); res.status(500).send("Error"); }
});

// Captura de rutas no encontradas (Para evitar respuestas HTML vacías)
app.use((req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
});

/* ==========================================
   ENCENDIDO
========================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});