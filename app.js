"use strict";

// ======================================
// CONFIGURACIÓN
// ======================================

const USUARIO_NORMAL = "martina@usuario";
const CONTRASENA_NORMAL = "Contraseña@12";

const USUARIO_DUENO = "anyelo@dueño";
const CONTRASENA_DUENO = "Contraseña@19";

const CLAVE_REGISTROS = "registros";

const campo = id => document.getElementById(id);

let rolSesion = "";
let registros = obtenerRegistros();
let registroSeleccionado = null;
let editando = false;


// ======================================
// ALMACENAMIENTO
// ======================================

function obtenerRegistros() {
    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_REGISTROS) || "[]"
        );

        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("Error leyendo registros:", error);
        return [];
    }
}

function guardarEnNavegador() {
    try {
        localStorage.setItem(
            CLAVE_REGISTROS,
            JSON.stringify(registros)
        );

        return true;
    } catch (error) {
        console.error("Error guardando registros:", error);

        alert("No se pudieron guardar los registros en el navegador.");
        return false;
    }
}


// ======================================
// INICIO DE SESIÓN CON USUARIO Y CONTRASEÑA
// ======================================

campo("formularioAcceso").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const usuario = campo("usuarioAcceso").value.trim();
    const contrasena = campo("contrasenaAcceso").value;

    if (
        usuario === USUARIO_DUENO &&
        contrasena === CONTRASENA_DUENO
    ) {
        rolSesion = "dueno";
    } else if (
        usuario === USUARIO_NORMAL &&
        contrasena === CONTRASENA_NORMAL
    ) {
        rolSesion = "usuario";
    } else {
        campo("errorAcceso").hidden = false;
        campo("usuarioAcceso").focus();
        return;
    }

    campo("errorAcceso").hidden = true;
    campo("paginaAcceso").hidden = true;
    campo("sistema").hidden = false;

    campo("rolActual").textContent =
        rolSesion === "dueno"
            ? "Sesión del dueño"
            : "Sesión de usuario";

    campo("zonaPropietario").hidden = rolSesion !== "dueno";

    campo("activar").checked = false;
    activarFormulario();

    campo("panelTabla").hidden = true;
    campo("mostrarTabla").textContent = "▤ Mostrar tabla";
    campo("buscarTabla").value = "";

    campo("usuarioAcceso").value = "";
    campo("contrasenaAcceso").value = "";

    limpiarFormulario();

    registros = obtenerRegistros();
    actualizarInterfaz();
});


// ======================================
// CERRAR SESIÓN
// ======================================

campo("cerrarSesion").addEventListener("click", function () {
    rolSesion = "";
    registroSeleccionado = null;
    editando = false;

    campo("activar").checked = false;
    activarFormulario();
    limpiarFormulario();

    campo("panelTabla").hidden = true;
    campo("mostrarTabla").textContent = "▤ Mostrar tabla";
    campo("buscarTabla").value = "";

    campo("zonaPropietario").hidden = true;
    campo("sistema").hidden = true;
    campo("paginaAcceso").hidden = false;

    campo("usuarioAcceso").value = "";
    campo("contrasenaAcceso").value = "";
    campo("errorAcceso").hidden = true;
    campo("usuarioAcceso").focus();
});


// ======================================
// ACTIVAR FORMULARIO
// ======================================

function activarFormulario() {
    const activo = campo("activar").checked;

    [
        "cedula",
        "nombre1",
        "nombre2",
        "apellido1",
        "apellido2",
        "telefono",
        "direccion"
    ].forEach(id => {
        campo(id).disabled = !activo;
    });

    [
        "guardar",
        "consultar",
        "editar",
        "eliminar",
        "limpiar"
    ].forEach(id => {
        campo(id).disabled = !activo;
    });

    mostrarMensaje(
        activo
            ? "Formulario activado. Ya puedes trabajar."
            : "Activa el formulario para comenzar.",
        ""
    );
}

campo("activar").addEventListener("change", activarFormulario);


// ======================================
// DATOS Y VALIDACIÓN
// ======================================

function obtenerDatosFormulario() {
    return {
        cedula: campo("cedula").value.trim(),
        nombre1: campo("nombre1").value.trim(),
        nombre2: campo("nombre2").value.trim(),
        apellido1: campo("apellido1").value.trim(),
        apellido2: campo("apellido2").value.trim(),
        telefono: campo("telefono").value.trim(),
        direccion: campo("direccion").value.trim()
    };
}

function validarFormulario() {
    if (!campo("formularioRegistro").reportValidity()) {
        return false;
    }

    const datos = obtenerDatosFormulario();

    if (
        !datos.cedula ||
        !datos.nombre1 ||
        !datos.apellido1 ||
        !datos.telefono ||
        !datos.direccion
    ) {
        mostrarMensaje("Completa todos los campos obligatorios.", "error");
        return false;
    }

    return true;
}


// ======================================
// GUARDAR Y EDITAR
// ======================================

campo("guardar").addEventListener("click", function () {
    if (!validarFormulario()) return;

    registros = obtenerRegistros();

    const datos = obtenerDatosFormulario();
    const estabaEditando = editando;

    const indiceExistente = registros.findIndex(
        registro => registro.cedula === datos.cedula
    );

    if (!estabaEditando && indiceExistente !== -1) {
        mostrarMensaje(
            "Ya existe un registro con esa cédula. Usa Consultar.",
            "error"
        );
        return;
    }

    if (
        estabaEditando &&
        indiceExistente !== -1 &&
        datos.cedula !== registroSeleccionado
    ) {
        mostrarMensaje("Esa cédula pertenece a otro registro.", "error");
        return;
    }

    const anteriores = registros.map(registro => ({ ...registro }));

    if (estabaEditando) {
        const indiceOriginal = registros.findIndex(
            registro => registro.cedula === registroSeleccionado
        );

        if (indiceOriginal === -1) {
            mostrarMensaje(
                "No se encontró el registro que vas a editar.",
                "error"
            );
            return;
        }

        registros[indiceOriginal] = datos;
    } else {
        registros.push(datos);
    }

    if (!guardarEnNavegador()) {
        registros = anteriores;
        actualizarInterfaz();
        return;
    }

    limpiarFormulario();
    actualizarInterfaz();

    mostrarMensaje(
        estabaEditando
            ? "Registro actualizado correctamente."
            : "Registro guardado correctamente.",
        "exito"
    );
});


// ======================================
// CONSULTAR
// ======================================

campo("consultar").addEventListener("click", function () {
    const cedula = campo("cedula").value.trim();

    if (!cedula) {
        mostrarMensaje("Escribe una cédula para consultar.", "error");
        campo("cedula").focus();
        return;
    }

    registros = obtenerRegistros();

    const registro = registros.find(
        persona => persona.cedula === cedula
    );

    if (!registro) {
        registroSeleccionado = null;
        editando = false;

        mostrarMensaje(
            "No se encontró un registro con esa cédula.",
            "error"
        );
        return;
    }

    cargarRegistroEnFormulario(registro);
    registroSeleccionado = registro.cedula;
    editando = false;

    mostrarMensaje("Registro encontrado.", "exito");
});


// ======================================
// CARGAR DATOS EN EL FORMULARIO
// ======================================

function cargarRegistroEnFormulario(registro) {
    campo("cedula").value = registro.cedula || "";
    campo("nombre1").value = registro.nombre1 || "";
    campo("nombre2").value = registro.nombre2 || "";
    campo("apellido1").value = registro.apellido1 || "";
    campo("apellido2").value = registro.apellido2 || "";
    campo("telefono").value = registro.telefono || "";
    campo("direccion").value = registro.direccion || "";
}


// ======================================
// PREPARAR EDICIÓN
// ======================================

campo("editar").addEventListener("click", function () {
    registros = obtenerRegistros();

    const cedula = campo("cedula").value.trim();

    const registro = registros.find(
        persona => persona.cedula === cedula
    );

    if (!registro) {
        mostrarMensaje(
            "Consulta primero un registro existente.",
            "error"
        );
        return;
    }

    registroSeleccionado = registro.cedula;
    editando = true;

    mostrarMensaje(
        "Modifica los datos y pulsa Guardar para confirmar.",
        "exito"
    );
});


// ======================================
// ELIMINAR DESDE EL FORMULARIO
// ======================================

campo("eliminar").addEventListener("click", function () {
    const cedula = campo("cedula").value.trim();

    if (!cedula) {
        mostrarMensaje(
            "Escribe la cédula que deseas eliminar.",
            "error"
        );
        return;
    }

    eliminarRegistro(cedula);
});


// ======================================
// LIMPIAR FORMULARIO
// ======================================

campo("limpiar").addEventListener("click", function () {
    limpiarFormulario();
    mostrarMensaje("Campos limpiados correctamente.", "exito");
});

function limpiarFormulario() {
    campo("formularioRegistro").reset();
    registroSeleccionado = null;
    editando = false;
}


// ======================================
// MENSAJES
// ======================================

function mostrarMensaje(texto, tipo) {
    const mensaje = campo("mensaje");

    mensaje.textContent = texto;
    mensaje.className = "mensaje";

    if (tipo) {
        mensaje.classList.add(tipo);
    }
}


// ======================================
// ACTUALIZAR INTERFAZ
// ======================================

function actualizarInterfaz() {
    registros = obtenerRegistros();

    campo("total").textContent = registros.length;

    dibujarTabla();
}


// ======================================
// MOSTRAR / OCULTAR TABLA
// ======================================

campo("mostrarTabla").addEventListener("click", function () {
    if (rolSesion !== "dueno") return;

    const panel = campo("panelTabla");
    panel.hidden = !panel.hidden;

    campo("mostrarTabla").textContent = panel.hidden
        ? "▤ Mostrar tabla"
        : "▤ Ocultar tabla";

    if (!panel.hidden) {
        registros = obtenerRegistros();
        dibujarTabla();
    }
});


// ======================================
// DIBUJAR TABLA Y BUSCAR
// ======================================

campo("buscarTabla").addEventListener("input", dibujarTabla);

function dibujarTabla() {
    const cuerpo = campo("cuerpoTabla");
    const busqueda = campo("buscarTabla").value.trim().toLowerCase();

    registros = obtenerRegistros();

    cuerpo.replaceChildren();

    const filtrados = registros.filter(registro =>
        Object.values(registro).some(valor =>
            String(valor ?? "").toLowerCase().includes(busqueda)
        )
    );

    filtrados.forEach(registro => {
        const fila = document.createElement("tr");

        [
            "cedula",
            "nombre1",
            "nombre2",
            "apellido1",
            "apellido2",
            "telefono",
            "direccion"
        ].forEach(columna => {
            const celda = document.createElement("td");
            celda.textContent = registro[columna] || "—";
            fila.appendChild(celda);
        });

        const celdaAcciones = document.createElement("td");
        const acciones = document.createElement("div");

        acciones.className = "acciones-fila";

        const botonEditar = document.createElement("button");

        botonEditar.type = "button";
        botonEditar.className = "boton-fila";
        botonEditar.textContent = "Editar";

        botonEditar.addEventListener("click", function () {
            if (rolSesion !== "dueno") return;

            campo("activar").checked = true;
            activarFormulario();

            cargarRegistroEnFormulario(registro);

            registroSeleccionado = registro.cedula;
            editando = true;

            campo("formularioRegistro").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            mostrarMensaje(
                "Modifica los datos y pulsa Guardar.",
                "exito"
            );
        });

        const botonEliminar = document.createElement("button");

        botonEliminar.type = "button";
        botonEliminar.className = "boton-fila eliminar-fila";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function () {
            if (rolSesion !== "dueno") return;

            eliminarRegistro(registro.cedula);
        });

        acciones.append(botonEditar, botonEliminar);
        celdaAcciones.appendChild(acciones);
        fila.appendChild(celdaAcciones);
        cuerpo.appendChild(fila);
    });

    campo("tablaVacia").hidden = filtrados.length > 0;
    campo("total").textContent = registros.length;
}


// ======================================
// ELIMINAR REGISTRO
// ======================================

function eliminarRegistro(cedula) {
    registros = obtenerRegistros();

    const registro = registros.find(
        persona => persona.cedula === cedula
    );

    if (!registro) {
        mostrarMensaje("No se encontró ese registro.", "error");
        actualizarInterfaz();
        return;
    }

    if (!confirm(`¿Deseas eliminar el registro con cédula ${cedula}?`)) {
        return;
    }

    const anteriores = registros.map(
        persona => ({ ...persona })
    );

    registros = registros.filter(
        persona => persona.cedula !== cedula
    );

    if (!guardarEnNavegador()) {
        registros = anteriores;
        actualizarInterfaz();
        return;
    }

    if (registroSeleccionado === cedula) {
        limpiarFormulario();
    }

    actualizarInterfaz();

    mostrarMensaje("Registro eliminado correctamente.", "exito");
}


// ======================================
// DESCARGAR EXCEL
// ======================================

campo("descargarExcel").addEventListener("click", descargarExcel);

function descargarExcel() {
    if (rolSesion !== "dueno") {
        alert("Solo el dueño puede descargar los registros.");
        return;
    }

    registros = obtenerRegistros();

    if (registros.length === 0) {
        alert(
            "No hay registros guardados para exportar. " +
            "Primero guarda una persona en el formulario."
        );
        return;
    }

    if (typeof XLSX === "undefined") {
        alert(
            "No se pudo cargar la biblioteca de Excel. " +
            "Comprueba tu conexión a internet e inténtalo nuevamente."
        );
        return;
    }

    const datosExcel = registros.map(registro => ({
        "Cédula": registro.cedula || "",
        "Nombre 1": registro.nombre1 || "",
        "Nombre 2": registro.nombre2 || "",
        "Apellido 1": registro.apellido1 || "",
        "Apellido 2": registro.apellido2 || "",
        "Teléfono": registro.telefono || "",
        "Dirección": registro.direccion || ""
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Registros");

    XLSX.writeFile(libro, "Registros.xlsx");
}


// ======================================
// INICIALIZACIÓN
// ======================================

campo("paginaAcceso").hidden = false;
campo("sistema").hidden = true;
campo("zonaPropietario").hidden = true;
campo("panelTabla").hidden = true;

campo("activar").checked = false;

activarFormulario();
actualizarInterfaz();
