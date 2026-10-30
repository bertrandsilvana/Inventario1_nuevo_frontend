
const API_URL = 'http://localhost:3000/api';

const formulario = document.getElementById('formMaterial');
const tablaMateriales = document.getElementById('tablaMateriales');

const selectCategoria = document.getElementById('id_categoria');
const selectUbicacion = document.getElementById('id_ubicacion');

const mensajeFormulario = document.getElementById('mensajeFormulario');
const mensajeListado = document.getElementById('mensajeListado');

const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const btnActualizar = document.getElementById('btnActualizar');

const campoId = document.getElementById('id_material');

let materiales = [];

// Obtener el token de la sesión.
function obtenerToken() {
    return localStorage.getItem('token');
}

// Configurar las peticiones autenticadas.
function obtenerEncabezados() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

// Realizar una petición a la API.
async function consultarAPI(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            ...obtenerEncabezados(),
            ...opciones.headers
        }
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(
            datos?.mensaje ||
            datos?.message ||
            datos?.error ||
            `Error HTTP: ${respuesta.status}`
        );
    }

    return datos;
}

// Cargar categorías.
async function cargarCategorias() {
    const categorias = await consultarAPI(`${API_URL}/categorias`);

    selectCategoria.replaceChildren();

    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = 'Seleccionar categoría';
    selectCategoria.appendChild(opcionInicial);

    categorias.forEach(categoria => {
        const opcion = document.createElement('option');
        opcion.value = categoria.id_categoria;
        opcion.textContent = categoria.nombre;
        selectCategoria.appendChild(opcion);
    });
}

// Cargar ubicaciones.
async function cargarUbicaciones() {
    const ubicaciones = await consultarAPI(`${API_URL}/ubicaciones`);

    selectUbicacion.replaceChildren();

    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = 'Seleccionar ubicación';
    selectUbicacion.appendChild(opcionInicial);

    ubicaciones.forEach(ubicacion => {
        const opcion = document.createElement('option');
        opcion.value = ubicacion.id_ubicacion;
        opcion.textContent = ubicacion.nombre;
        selectUbicacion.appendChild(opcion);
    });
}

// Consultar materiales.
async function cargarMateriales() {
    mensajeListado.textContent = 'Cargando materiales...';
    tablaMateriales.replaceChildren();

    try {
        materiales = await consultarAPI(`${API_URL}/materiales`);
        mostrarMateriales(materiales);
    } catch (error) {
        console.error(error);
        mensajeListado.textContent = error.message;
    }
}

// Mostrar materiales en la tabla.
function mostrarMateriales(lista) {
    tablaMateriales.replaceChildren();

    if (lista.length === 0) {
        mensajeListado.textContent = 'No hay materiales registrados.';
        return;
    }

    mensajeListado.textContent = `Materiales encontrados: ${lista.length}`;

    lista.forEach(material => {
        const fila = document.createElement('tr');

        const valores = [
            material.id_material,
            material.nombre,
            material.descripcion,
            material.cantidad,
            material.estado,
            material.categoria ?? material.id_categoria,
            material.ubicacion ?? material.id_ubicacion
        ];

        valores.forEach(valor => {
            const celda = document.createElement('td');
            celda.textContent = valor ?? '-';
            fila.appendChild(celda);
        });

        const celdaAcciones = document.createElement('td');

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn-editar';

        btnEditar.addEventListener('click', () => {
            cargarMaterialEnFormulario(material);
        });

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn-eliminar';

        btnEliminar.addEventListener('click', () => {
            eliminarMaterial(material.id_material);
        });

        celdaAcciones.append(btnEditar, btnEliminar);
        fila.appendChild(celdaAcciones);

        tablaMateriales.appendChild(fila);
    });
}

// Cargar un material en el formulario para editar.
function cargarMaterialEnFormulario(material) {
    campoId.value = material.id_material;
    document.getElementById('nombre').value = material.nombre;
    document.getElementById('descripcion').value = material.descripcion ?? '';
    document.getElementById('cantidad').value = material.cantidad;
    document.getElementById('estado').value = material.estado;

    selectCategoria.value = material.id_categoria;
    selectUbicacion.value = material.id_ubicacion;

    btnGuardar.textContent = 'Guardar cambios';
    btnCancelar.hidden = false;

    mensajeFormulario.textContent =
        `Editando el material: ${material.nombre}`;

    formulario.scrollIntoView({ behavior: 'smooth' });
}

// Limpiar el formulario.
function limpiarFormulario() {
    formulario.reset();
    campoId.value = '';

    btnGuardar.textContent = 'Registrar material';
    btnCancelar.hidden = true;

    mensajeFormulario.textContent = '';
}

// Registrar o editar un material.
formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    const id = campoId.value;

    const material = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        cantidad: Number(document.getElementById('cantidad').value),
        estado: document.getElementById('estado').value.trim(),
        id_categoria: Number(selectCategoria.value),
        id_ubicacion: Number(selectUbicacion.value)
    };

    try {
        const url = id
            ? `${API_URL}/materiales/${id}`
            : `${API_URL}/materiales`;

        const metodo = id ? 'PUT' : 'POST';

        await consultarAPI(url, {
            method: metodo,
            body: JSON.stringify(material)
        });

        mensajeFormulario.textContent = id
            ? 'Material actualizado correctamente.'
            : 'Material registrado correctamente.';

        limpiarFormulario();
        await cargarMateriales();

    } catch (error) {
        console.error(error);
        mensajeFormulario.textContent = error.message;
    }
});

// Cancelar una edición.
btnCancelar.addEventListener('click', limpiarFormulario);

// Eliminar un material.
async function eliminarMaterial(id) {
    const confirmar = window.confirm(
        '¿Estás seguro de que querés eliminar este material?'
    );

    if (!confirmar) return;

    try {
        await consultarAPI(`${API_URL}/materiales/${id}`, {
            method: 'DELETE'
        });

        mensajeListado.textContent = 'Material eliminado correctamente.';
        await cargarMateriales();

    } catch (error) {
        console.error(error);
        mensajeListado.textContent = error.message;
    }
}

// Actualizar el listado.
btnActualizar.addEventListener('click', cargarMateriales);

// Inicializar la pantalla.
async function iniciarPantalla() {
    try {
        await Promise.all([
            cargarCategorias(),
            cargarUbicaciones()
        ]);

        await cargarMateriales();

    } catch (error) {
        console.error(error);
        mensajeListado.textContent =
            'No se pudieron cargar las categorías o ubicaciones: ' +
            error.message;
    }
}

iniciarPantalla();

