
/* =====================================
   RACHA DE LECTURA BÍBLICA - 20 DÍAS
   SISTEMA DE PARTICIPANTES
===================================== */

// =====================================
// CONEXIÓN CON SUPABASE
// =====================================

const SUPABASE_URL = "https://ppohujzfmupyfoswrykw.supabase.co";
const SUPABASE_KEY = "sb_publishable_9JvmaFGEOixLjhncpC9-Mg_i0QxlgrN";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =====================================
// CONFIGURACIÓN
// =====================================

const TOTAL_DIAS = 20;
const FECHA_INICIO = "2026-11-09";

const TABLA_PARTICIPANTES = "participants";
const TABLA_LECTURAS = "readings_20dias";

// =====================================
// VARIABLES GLOBALES
// =====================================

let participantes = [];
let registros = [];

let diaSeleccionado = 1;
let modoAdministrador = false;
let guardando = false;

// =====================================
// ELEMENTOS HTML
// =====================================

const calendario = document.getElementById("days-grid");
const listaParticipantes = document.getElementById("participants-list");

const participantesBanner = document.getElementById("banner-participants");

const tituloDia = document.getElementById("selected-day-title");
const fechaDia = document.getElementById("selected-day-date");

const totalLecturasDia = document.getElementById("day-reading-total");
const mensajeDatos = document.getElementById("data-message");

const formularioLogin = document.getElementById("login-form");
const correoAdmin = document.getElementById("admin-email");
const passwordAdmin = document.getElementById("admin-password");
const mensajeLogin = document.getElementById("login-message");

const estadoAdmin = document.getElementById("admin-status");
const sesionAdmin = document.getElementById("admin-session");
const formularioSesion = document.getElementById("login-form");
const correoAdminLabel = document.getElementById("admin-email-label");
const botonCerrarSesion = document.getElementById("logout-btn");

// =====================================
// INICIAR SISTEMA
// =====================================

document.addEventListener("DOMContentLoaded", async () => {

    generarCalendario();
    configurarLogin();
    configurarCerrarSesion();

    await cargarDatos();
    await verificarSesion();

});

// =====================================
// FORMATO DE FECHAS
// =====================================

function obtenerFecha(dia) {

    const fecha = new Date(FECHA_INICIO + "T00:00:00");

    fecha.setDate(fecha.getDate() + dia - 1);

    return fecha.toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

}

// =====================================
// GENERAR CALENDARIO
// =====================================

function generarCalendario() {

    if (!calendario) return;

    calendario.innerHTML = "";

    for (let dia = 1; dia <= TOTAL_DIAS; dia++) {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "day-button";
        boton.dataset.dia = dia;

        const numero = document.createElement("strong");
        numero.textContent = String(dia).padStart(2, "0");

        const fecha = document.createElement("span");

        const fechaCompleta = new Date(FECHA_INICIO + "T00:00:00");
        fechaCompleta.setDate(fechaCompleta.getDate() + dia - 1);

        fecha.textContent = fechaCompleta.toLocaleDateString("es-GT", {
            day: "2-digit",
            month: "2-digit"
        });

        boton.appendChild(numero);
        boton.appendChild(fecha);

        if (dia === diaSeleccionado) {
            boton.classList.add("active");
        }

        boton.addEventListener("click", () => {

            diaSeleccionado = dia;

            generarCalendario();
            mostrarDiaSeleccionado();
            mostrarParticipantes();

        });

        calendario.appendChild(boton);

    }

    mostrarDiaSeleccionado();
}

// =====================================
// MOSTRAR DÍA SELECCIONADO
// =====================================

function mostrarDiaSeleccionado() {

    if (tituloDia) {
        tituloDia.textContent =
            `Día ${String(diaSeleccionado).padStart(2, "0")}`;
    }

    if (fechaDia) {
        fechaDia.textContent = obtenerFecha(diaSeleccionado);
    }

}

// =====================================
// CARGAR PARTICIPANTES Y LECTURAS
// =====================================

async function cargarDatos() {

    try {

        if (mensajeDatos) {
            mensajeDatos.textContent = "Cargando información...";
        }

        const { data: personas, error: errorPersonas } =
            await supabaseClient
                .from(TABLA_PARTICIPANTES)
                .select("id, name")
                .eq("active", true)
                .order("name");

        if (errorPersonas) throw errorPersonas;

        const { data: lecturas, error: errorLecturas } =
            await supabaseClient
                .from(TABLA_LECTURAS)
                .select("participant_id, day_number");

        if (errorLecturas) throw errorLecturas;

        participantes = personas || [];
        registros = lecturas || [];

        actualizarContadores();
        mostrarParticipantes();

        if (mensajeDatos) {
            mensajeDatos.textContent = "";
        }

    } catch (error) {

        console.error("Error cargando información:", error);

        if (listaParticipantes) {
            listaParticipantes.innerHTML = `
                <div class="empty-state">
                    No se pudo cargar la información.
                    Intenta actualizar la página.
                </div>
            `;
        }

        if (mensajeDatos) {
            mensajeDatos.textContent =
                "Error al conectar con la base de datos.";
        }

    }

}

// =====================================
// ACTUALIZAR CONTADORES
// =====================================

function actualizarContadores() {

    const total = participantes.length;

    if (participantesBanner) {
        participantesBanner.textContent = total;
    }

}

// =====================================
// VERIFICAR SI ALGUIEN LEYÓ
// =====================================

function tieneLectura(participanteId, dia) {

    return registros.some(registro =>
        registro.participant_id === participanteId &&
        Number(registro.day_number) === Number(dia)
    );

}

// =====================================
// MOSTRAR PARTICIPANTES
// =====================================

function mostrarParticipantes() {

    if (!listaParticipantes) return;

    listaParticipantes.innerHTML = "";

    let totalLeidosHoy = 0;

    participantes.forEach(persona => {

        const lecturasPersona = registros.filter(registro =>
            registro.participant_id === persona.id
        );

        const cantidad = lecturasPersona.length;

        const completoHoy = tieneLectura(
            persona.id,
            diaSeleccionado
        );

        if (completoHoy) {
            totalLeidosHoy++;
        }

        // Fila del participante
        const elemento = document.createElement("div");
        elemento.className = "participant-row";

        // Nombre
        const nombre = document.createElement("div");
        nombre.className = "participant-name";

        const nombreTexto = document.createElement("strong");
        nombreTexto.textContent = persona.name;

        nombre.appendChild(nombreTexto);

        // Progreso general
        const progreso = document.createElement("div");
        progreso.className = "participant-progress";

        const fuego = document.createElement("span");
        fuego.className = "fire-icon";
        fuego.textContent = "🔥";

        const progresoTexto = document.createElement("span");
        progresoTexto.textContent = `${cantidad} / ${TOTAL_DIAS} días`;

        progreso.appendChild(fuego);
        progreso.appendChild(progresoTexto);

        // Estado de lectura del día
        const estado = document.createElement("span");

        estado.className = completoHoy
            ? "day-status completed"
            : "day-status pending";

        estado.textContent = completoHoy
            ? "Leído ✓"
            : "Pendiente";

        // Contenedor de acciones
        const acciones = document.createElement("div");
        acciones.className = "participant-actions";

        acciones.appendChild(estado);

        // Botón exclusivo del administrador
        if (modoAdministrador) {

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "mark-button";

            boton.textContent = completoHoy
                ? "Desmarcar"
                : "Marcar";

            boton.disabled = guardando;

            boton.addEventListener("click", async () => {

                await cambiarLectura(
                    persona.id,
                    completoHoy
                );

            });

            acciones.appendChild(boton);

        }

        elemento.appendChild(nombre);
        elemento.appendChild(progreso);
        elemento.appendChild(acciones);

        listaParticipantes.appendChild(elemento);

    });

    // Contador de lecturas del día seleccionado
    if (totalLecturasDia) {

        totalLecturasDia.textContent =
            `${totalLeidosHoy} de ${participantes.length} han leído`;

    }

    // Mensaje si todavía no hay participantes
    if (participantes.length === 0) {

        listaParticipantes.innerHTML = `
            <div class="empty-state">
                Todavía no hay participantes registrados.
            </div>
        `;

    }

}

// =====================================
// MARCAR O DESMARCAR LECTURA
// =====================================

async function cambiarLectura(participanteId, completado) {

    if (!modoAdministrador || guardando) return;

    guardando = true;

    mostrarParticipantes();

    try {

        if (completado) {

            const { error } = await supabaseClient
                .from(TABLA_LECTURAS)
                .delete()
                .eq("participant_id", participanteId)
                .eq("day_number", diaSeleccionado);

            if (error) throw error;

        } else {

            const { error } = await supabaseClient
                .from(TABLA_LECTURAS)
                .insert({
                    participant_id: participanteId,
                    day_number: diaSeleccionado
                });

            if (error) throw error;

        }

        await cargarDatos();

    } catch (error) {

        console.error("Error actualizando lectura:", error);

        alert(
            "No se pudo actualizar la lectura. Verifica tu sesión y los permisos."
        );

    } finally {

        guardando = false;
        mostrarParticipantes();

    }

}

// =====================================
// CONFIGURAR INICIO DE SESIÓN
// =====================================

function configurarLogin() {

    if (!formularioLogin) return;

    formularioLogin.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        if (mensajeLogin) {
            mensajeLogin.textContent = "Verificando acceso...";
        }

        const email = correoAdmin.value.trim();
        const password = passwordAdmin.value;

        try {

            const { error } = await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            const esAdministrador = await verificarAdministrador();

            if (!esAdministrador) {

                await supabaseClient.auth.signOut();

                throw new Error(
                    "Tu cuenta no tiene permisos de administrador."
                );

            }

            if (mensajeLogin) {
                mensajeLogin.textContent =
                    "¡Bienvenido, administrador!";
            }

            formularioLogin.reset();

            await cargarDatos();

        } catch (error) {

            console.error("Error de acceso:", error);

            if (mensajeLogin) {
                mensajeLogin.textContent = error.message;
            }

        }

    });

}

// =====================================
// VERIFICAR ADMINISTRADOR
// =====================================

async function verificarAdministrador() {

    const { data: sesionData, error: errorSesion } =
        await supabaseClient.auth.getSession();

    if (errorSesion || !sesionData.session) {

        modoAdministrador = false;
        actualizarInterfazAdmin();

        return false;

    }

    const { data, error } =
        await supabaseClient.rpc("is_admin");

    if (error || data !== true) {

        modoAdministrador = false;
        actualizarInterfazAdmin();

        return false;

    }

    modoAdministrador = true;

    actualizarInterfazAdmin();

    return true;

}

// =====================================
// VERIFICAR SESIÓN ACTUAL
// =====================================

async function verificarSesion() {

    await verificarAdministrador();

    mostrarParticipantes();

}

// =====================================
// ACTUALIZAR INTERFAZ ADMINISTRADOR
// =====================================

function actualizarInterfazAdmin() {

    if (formularioSesion) {
        formularioSesion.hidden = modoAdministrador;
    }

    if (sesionAdmin) {
        sesionAdmin.hidden = !modoAdministrador;
    }

    if (estadoAdmin) {

        estadoAdmin.textContent = modoAdministrador
            ? "Modo administrador: puedes registrar y actualizar lecturas."
            : "Modo de consulta: puedes ver el progreso de todos.";

    }

    if (correoAdminLabel) {

        supabaseClient.auth.getUser().then(({ data }) => {

            if (data.user) {
                correoAdminLabel.textContent = data.user.email;
            }

        });

    }

    mostrarParticipantes();

}

// =====================================
// CERRAR SESIÓN
// =====================================

function configurarCerrarSesion() {

    if (!botonCerrarSesion) return;

    botonCerrarSesion.addEventListener("click", async () => {

        const { error } = await supabaseClient.auth.signOut();

        if (error) {

            console.error("Error cerrando sesión:", error);

            if (mensajeLogin) {
                mensajeLogin.textContent =
                    "No se pudo cerrar la sesión.";
            }

            return;

        }

        modoAdministrador = false;

        actualizarInterfazAdmin();

        await cargarDatos();

        if (mensajeLogin) {
            mensajeLogin.textContent = "Sesión cerrada correctamente.";
        }

    });

}

// =====================================
// ESCUCHAR CAMBIOS DE SESIÓN
// =====================================

supabaseClient.auth.onAuthStateChange((evento, sesion) => {

    if (evento === "SIGNED_OUT" || !sesion) {

        modoAdministrador = false;

        actualizarInterfazAdmin();

    }

});
