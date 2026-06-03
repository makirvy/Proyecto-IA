const API_URL = "http://localhost:5000/api";

/* ==========================================
   DATOS INICIALES Y SESIÓN
========================================== */

function initializeApp() {
    checkSession();
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Login rápido simulado para no retrasar la entrega
        if (email === "admin@laiguana.com" && password === "admin123") {
            const usuario = { email, nombre: "Administrador General" };
            localStorage.setItem("currentUser", JSON.stringify(usuario));
            location.reload();
        } else {
            document.getElementById("loginMessage").innerText = "Credenciales incorrectas";
        }
    });
}

function checkSession() {
    const user = localStorage.getItem("currentUser");
    if (!user) return;

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");

    const usuario = JSON.parse(user);
    const currentUser = document.getElementById("currentUser");
    if (currentUser) {
        currentUser.innerText = usuario.nombre;
    }

    updateDashboard();
    renderVisitantes();
    renderInventario();
    renderTareas();
    renderIncidencias();
}

function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

/* ==========================================
   NAVEGACIÓN Y DASHBOARD
========================================== */

function showSection(id) {
    document.querySelectorAll(".section").forEach(section => section.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    updateDashboard();
}

async function updateDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        document.getElementById("totalVisitantes").innerText = data.visitantes;
        document.getElementById("totalInventario").innerText = data.inventario;
        document.getElementById("totalTareas").innerText = data.tareas;
        document.getElementById("totalIncidencias").innerText = data.incidencias;
    } catch (err) {
        console.error("Error al actualizar el Dashboard:", err);
    }
}

function addActivityLog(texto) {
    const lista = document.getElementById("actividadReciente");
    if (!lista) return;
    const li = document.createElement("li");
    li.innerText = `${new Date().toLocaleTimeString()} - ${texto}`;
    lista.prepend(li);
}

/* ==========================================
   MÓDULO: VISITANTES
========================================== */

document.getElementById("visitanteForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombreVisitante").value;
    const personas = Number(document.getElementById("cantidadPersonas").value);
    const tipo = document.getElementById("tipoVisita").value;

    const nuevoVisitante = {
        nombre: nombre,
        cantidad_personas: personas,
        tipo_visita: tipo
    };

    try {
        const res = await fetch(`${API_URL}/visitantes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoVisitante)
        });

        if (res.ok) {
            addActivityLog(`Nuevo visitante registrado: ${nombre}`);
            this.reset();
            renderVisitantes();
            updateDashboard();
        }
    } catch (err) {
        console.error("Error al guardar visitante:", err);
    }
});

async function renderVisitantes() {
    const tabla = document.getElementById("visitantesTable");
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/visitantes`);
        const visitantes = await res.json();
        tabla.innerHTML = "";

        visitantes.forEach(v => {
            // Mantenemos tu lógica de negocio de cálculo dinámico para la columna Total
            const precio = v.tipo_visita === "Hospedaje" ? 50 : 15;
            const totalCalculado = v.cantidad_personas * precio;

            tabla.innerHTML += `
            <tr>
                <td>${v.nombre}</td>
                <td>${v.cantidad_personas}</td>
                <td>${v.tipo_visita}</td>
                <td>$${totalCalculado}</td>
            </tr>`;
        });
    } catch (err) {
        console.error("Error al renderizar visitantes:", err);
    }
}

/* ==========================================
   MÓDULO: INVENTARIO
========================================== */

let editingInventarioId = null;

document.getElementById("inventarioForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const producto = document.getElementById("producto").value;
    const categoria = document.getElementById("categoria").value;
    const stock = parseInt(document.getElementById("stock").value);

    const datos = { producto, categoria, stock };

    try {
        if (editingInventarioId !== null) {
            // Actualizar existente
            await fetch(`${API_URL}/inventario/${editingInventarioId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Inventario actualizado: ${producto}`);
            editingInventarioId = null;
            document.querySelector("#inventarioForm button[type='submit']").innerText = "Agregar Producto";
        } else {
            // Crear uno nuevo
            await fetch(`${API_URL}/inventario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Producto agregado: ${producto}`);
        }

        this.reset();
        renderInventario();
        updateDashboard();
    } catch (err) {
        console.error(err);
    }
});

async function renderInventario() {
    const tabla = document.getElementById("inventarioTable");
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/inventario`);
        const inventario = await res.json();
        tabla.innerHTML = "";

        inventario.forEach(item => {
            tabla.innerHTML += `
            <tr>
                <td>${item.producto}</td>
                <td>${item.categoria}</td>
                <td>${item.stock}</td>
                <td>
                    <button class="btn-edit" onclick="startEditInventario(${item.id}, '${item.producto}', '${item.categoria}', ${item.stock})">Editar</button>
                    <button class="btn-delete" onclick="deleteInventario(${item.id})">Eliminar</button>
                </td>
            </tr>`;
        });
    } catch (err) { console.error(err); }
}

function startEditInventario(id, producto, categoria, stock) {
    editingInventarioId = id;
    document.getElementById("producto").value = producto;
    document.getElementById("categoria").value = categoria;
    document.getElementById("stock").value = stock;
    document.querySelector("#inventarioForm button[type='submit']").innerText = "Actualizar Producto";
}

async function deleteInventario(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
        await fetch(`${API_URL}/inventario/${id}`, { method: "DELETE" });
        renderInventario();
        updateDashboard();
    } catch (err) { console.error(err); }
}

/* ==========================================
   MÓDULO: TAREAS
========================================== */

let editingTareaId = null;

document.getElementById("tareaForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const titulo = document.getElementById("tituloTarea").value;
    const responsable = document.getElementById("responsable").value;
    const estado = document.getElementById("estadoTarea").value;

    const datos = { titulo, responsable, estado };

    try {
        if (editingTareaId !== null) {
            await fetch(`${API_URL}/tareas/${editingTareaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Tarea actualizada: ${titulo}`);
            editingTareaId = null;
            document.querySelector("#tareaForm button[type='submit']").innerText = "Crear Tarea";
        } else {
            await fetch(`${API_URL}/tareas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Nueva tarea: ${titulo}`);
        }

        this.reset();
        renderTareas();
        updateDashboard();
    } catch (err) { console.error(err); }
});

async function renderTareas() {
    const tabla = document.getElementById("tareasTable");
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/tareas`);
        const tareas = await res.json();
        tabla.innerHTML = "";

        tareas.forEach(t => {
            tabla.innerHTML += `
            <tr>
                <td>${t.titulo}</td>
                <td>${t.responsable}</td>
                <td>${t.estado}</td>
                <td>
                    <button class="btn-edit" onclick="startEditTarea(${t.id}, '${t.titulo}', '${t.responsable}', '${t.estado}')">Editar</button>
                    <button class="btn-delete" onclick="deleteTarea(${t.id})">Eliminar</button>
                </td>
            </tr>`;
        });
    } catch (err) { console.error(err); }
}

function startEditTarea(id, titulo, responsable, estado) {
    editingTareaId = id;
    document.getElementById("tituloTarea").value = titulo;
    document.getElementById("responsable").value = responsable;
    document.getElementById("estadoTarea").value = estado;
    document.querySelector("#tareaForm button[type='submit']").innerText = "Actualizar Tarea";
}

async function deleteTarea(id) {
    if (!confirm("¿Deseas eliminar esta tarea?")) return;
    try {
        await fetch(`${API_URL}/tareas/${id}`, { method: "DELETE" });
        renderTareas();
        updateDashboard();
    } catch (err) { console.error(err); }
}

/* ==========================================
   MÓDULO: INCIDENCIAS
========================================== */

let editingIncidenciaId = null;

document.getElementById("incidenciaForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const descripcion = document.getElementById("descripcionIncidencia").value;
    const ubicacion = document.getElementById("ubicacionIncidencia").value;
    const prioridad = document.getElementById("prioridad").value;

    const datos = { descripcion, ubicacion, prioridad };

    try {
        if (editingIncidenciaId !== null) {
            await fetch(`${API_URL}/incidencias/${editingIncidenciaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Incidencia actualizada: ${descripcion}`);
            editingIncidenciaId = null;
            document.querySelector("#incidenciaForm button[type='submit']").innerText = "Registrar Incidencia";
        } else {
            await fetch(`${API_URL}/incidencias`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });
            addActivityLog(`Incidencia registrada: ${descripcion}`);
        }

        this.reset();
        renderIncidencias();
        updateDashboard();
    } catch (err) { console.error(err); }
});

async function renderIncidencias() {
    const tabla = document.getElementById("incidenciasTable");
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/incidencias`);
        const incidencias = await res.json();
        tabla.innerHTML = "";

        incidencias.forEach(i => {
            tabla.innerHTML += `
            <tr>
                <td>${i.descripcion}</td>
                <td>${i.ubicacion}</td>
                <td>${i.prioridad}</td>
                <td>
                    <button class="btn-edit" onclick="startEditIncidencia(${i.id}, '${i.descripcion}', '${i.ubicacion}', '${i.prioridad}')">Editar</button>
                    <button class="btn-delete" onclick="deleteIncidencia(${i.id})">Eliminar</button>
                </td>
            </tr>`;
        });
    } catch (err) { console.error(err); }
}

function startEditIncidencia(id, descripcion, ubicacion, prioridad) {
    editingIncidenciaId = id;
    document.getElementById("descripcionIncidencia").value = descripcion;
    document.getElementById("ubicacionIncidencia").value = ubicacion;
    document.getElementById("prioridad").value = prioridad;
    document.querySelector("#incidenciaForm button[type='submit']").innerText = "Actualizar Incidencia";
}

async function deleteIncidencia(id) {
    if (!confirm("¿Deseas eliminar este reporte de incidencia?")) return;
    try {
        await fetch(`${API_URL}/incidencias/${id}`, { method: "DELETE" });
        renderIncidencias();
        updateDashboard();
    } catch (err) { console.error(err); }
}

/* ==========================================
   INICIO
========================================== */
initializeApp();