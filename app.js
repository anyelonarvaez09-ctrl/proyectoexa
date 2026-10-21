let codigoActual = "";
let rolActual = "";
let registroSeleccionado = null;
let registrosTabla = [];

const $ = id => document.getElementById(id);

const campos = [
  "cedula", "nombre1", "nombre2",
  "apellido1", "apellido2", "telefono", "direccion"
];

function mostrarMensaje(texto, acceso = false) {
  const elemento = $(acceso ? "mensajeAcceso" : "mensaje");
  if (elemento) elemento.textContent = texto;
}

async function ejecutar(action, extra = {}) {
  if (!codigoActual) throw new Error("Primero inicia sesión.");
  return llamarServidor(codigoActual, action, extra);
}

async function iniciarSesion(evento) {
  evento.preventDefault();

  const codigo = $("codigoAcceso").value.trim();
  mostrarMensaje("Verificando código...", true);

  try {
    const respuesta = await llamarServidor(codigo, "login");

    codigoActual = codigo;
    rolActual = respuesta.role;

    $("paginaAcceso").hidden = true;
    $("paginaFormulario").hidden = false;
    $("rolUsuario").textContent =
      rolActual === "dueno" ? "Sesión del dueño" : "Sesión de usuario";

    $("zonaPropietario").hidden = rolActual !== "dueno";
    $("panelTabla").hidden = true;
    $("mostrarTabla").textContent = "Mostrar tabla";
    $("formRegistro").reset();
    registroSeleccionado = null;

    await actualizarTotal();
    mostrarMensaje("Sesión iniciada correctamente.");
  } catch (error) {
    codigoActual = "";
    rolActual = "";
    mostrarMensaje(error.message, true);
  }
}

async function cerrarSesion() {
  codigoActual = "";
  rolActual = "";
  registroSeleccionado = null;
  registrosTabla = [];

  $("formAcceso").reset();
  $("formRegistro").reset();
  $("paginaFormulario").hidden = true;
  $("paginaAcceso").hidden = false;
  $("zonaPropietario").hidden = true;
  $("panelTabla").hidden = true;
  $("cuerpoTabla").replaceChildren();

  mostrarMensaje("", true);
}

function leerFormulario() {
  return Object.fromEntries(
    campos.map(campo => [campo, $(campo).value.trim()])
  );
}

function limpiarCampos() {
  $("formRegistro").reset();
  registroSeleccionado = null;
  mostrarMensaje("");
}

async function guardarRegistro(evento) {
  evento.preventDefault();

  try {
    const registro = leerFormulario();
    const obligatorios = [
      "cedula", "nombre1", "apellido1", "telefono", "direccion"
    ];

    if (obligatorios.some(campo => !registro[campo])) {
      throw new Error("Completa los campos obligatorios.");
    }

    await ejecutar("create", { registro });

    limpiarCampos();
    mostrarMensaje("Registro guardado correctamente.");
    await actualizarTotal();
    if (rolActual === "dueno" && !$("panelTabla").hidden) {
      await cargarTabla();
    }
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

async function consultarRegistro() {
  try {
    const cedula = $("cedula").value.trim();
    if (!cedula) throw new Error("Escribe la cédula que deseas consultar.");

    const respuesta = await ejecutar("get", { cedula });

    if (!respuesta.data) {
      registroSeleccionado = null;
      throw new Error("No se encontró esa cédula.");
    }

    registroSeleccionado = respuesta.data;
    for (const campo of campos) {
      $(campo).value = respuesta.data[campo] ?? "";
    }

    mostrarMensaje("Registro encontrado.");
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

async function editarRegistro() {
  try {
    if (!registroSeleccionado) {
      throw new Error("Primero consulta o carga un registro.");
    }

    const registro = leerFormulario();
    const respuesta = await ejecutar("update", {
      id: registroSeleccionado.id,
      registro
    });

    registroSeleccionado = respuesta.data;
    mostrarMensaje("Registro actualizado correctamente.");
    await actualizarTotal();

    if (rolActual === "dueno" && !$("panelTabla").hidden) {
      await cargarTabla();
    }
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

async function eliminarRegistro() {
  try {
    if (!registroSeleccionado) {
      throw new Error("Primero consulta o carga un registro.");
    }

    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    await ejecutar("delete", { id: registroSeleccionado.id });

    limpiarCampos();
    mostrarMensaje("Registro eliminado correctamente.");
    await actualizarTotal();

    if (rolActual === "dueno" && !$("panelTabla").hidden) {
      await cargarTabla();
    }
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

async function actualizarTotal() {
  try {
    if (rolActual === "dueno") {
      const respuesta = await ejecutar("list");
      $("totalRegistros").textContent =
        `Total registrados: ${respuesta.data.length}`;
    } else {
      $("totalRegistros").textContent =
        "Registros disponibles en el sistema compartido";
    }
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

async function alternarTabla() {
  if (rolActual !== "dueno") return;

  const panel = $("panelTabla");
  panel.hidden = !panel.hidden;
  $("mostrarTabla").textContent =
    panel.hidden ? "Mostrar tabla" : "Ocultar tabla";

  if (!panel.hidden) await cargarTabla();
}

async function cargarTabla() {
  if (rolActual !== "dueno") return;

  try {
    const respuesta = await ejecutar("list");
    registrosTabla = respuesta.data || [];
    dibujarTabla();
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

function agregarCelda(fila, valor) {
  const celda = document.createElement("td");
  celda.textContent = valor ?? "";
  fila.appendChild(celda);
  return celda;
}

function dibujarTabla() {
  const cuerpo = $("cuerpoTabla");
  cuerpo.replaceChildren();

  const busqueda = $("buscarTabla").value.trim().toLowerCase();

  const filtrados = registrosTabla.filter(r =>
    campos.some(campo =>
      String(r[campo] ?? "").toLowerCase().includes(busqueda)
    )
  );

  for (const registro of filtrados) {
    const fila = document.createElement("tr");

    agregarCelda(fila, registro.cedula);
    agregarCelda(fila, [registro.nombre1, registro.nombre2].filter(Boolean).join(" "));
    agregarCelda(fila, [registro.apellido1, registro.apellido2].filter(Boolean).join(" "));
    agregarCelda(fila, registro.telefono);
    agregarCelda(fila, registro.direccion);

    const acciones = agregarCelda(fila, "");

    const cargar = document.createElement("button");
    cargar.textContent = "Cargar";
    cargar.type = "button";
    cargar.onclick = () => {
      registroSeleccionado = registro;
      for (const campo of campos) {
        $(campo).value = registro[campo] ?? "";
      }
      mostrarMensaje("Registro cargado. Puedes actualizarlo o eliminarlo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const eliminar = document.createElement("button");
    eliminar.textContent = "Eliminar";
    eliminar.type = "button";
    eliminar.className = "peligro";
    eliminar.onclick = async () => {
      registroSeleccionado = registro;
      await eliminarRegistro();
    };

    acciones.append(cargar, eliminar);
    cuerpo.appendChild(fila);
  }

  if (!filtrados.length) {
    const fila = document.createElement("tr");
    const celda = agregarCelda(fila, "No hay registros para mostrar.");
    celda.colSpan = 6;
    cuerpo.appendChild(fila);
  }
}

async function descargarExcel() {
  if (rolActual !== "dueno") {
    mostrarMensaje("Solo el dueño puede descargar Excel.");
    return;
  }

  try {
    const respuesta = await ejecutar("list");
    const registros = respuesta.data || [];

    if (!registros.length) {
      throw new Error("No hay registros para exportar.");
    }

    const filas = registros.map(r => ({
      "Cédula": r.cedula,
      "Nombre 1": r.nombre1,
      "Nombre 2": r.nombre2,
      "Apellido 1": r.apellido1,
      "Apellido 2": r.apellido2,
      "Teléfono": r.telefono,
      "Dirección": r.direccion
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Registros");
    XLSX.writeFile(libro, "Registros.xlsx");

    mostrarMensaje("Excel descargado correctamente.");
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

$("formAcceso").addEventListener("submit", iniciarSesion);
$("formRegistro").addEventListener("submit", guardarRegistro);
$("cerrarSesion").addEventListener("click", cerrarSesion);
$("consultar").addEventListener("click", consultarRegistro);
$("editar").addEventListener("click", editarRegistro);
$("eliminar").addEventListener("click", eliminarRegistro);
$("limpiar").addEventListener("click", limpiarCampos);
$("mostrarTabla").addEventListener("click", alternarTabla);
$("descargarExcel").addEventListener("click", descargarExcel);
$("buscarTabla").addEventListener("input", dibujarTabla);
