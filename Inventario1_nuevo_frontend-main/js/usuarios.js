const API_URL = 'http://localhost:3000/api';

const formulario = document.getElementById('formUsuario');
const tablaUsuarios = document.getElementById('tablaUsuarios');

const mensajeFormulario = document.getElementById('mensajeFormulario');
const mensajeListado = document.getElementById('mensajeListado');

const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const btnActualizar = document.getElementById('btnActualizar');

const campoId = document.getElementById('id_usuario');

let usuarios = [];

function obtenerToken() {
    return localStorage.getItem('token');
}

async function consultarAPI(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${obtenerToken()}`,
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

// Consultar usuarios
async function cargarUsuarios() {
    mensajeListado.textContent = 'Cargando usuarios...';
    tablaUsuarios.replaceChildren();

    try {
        usuarios = await consultarAPI(`${API_URL}/usuarios`);
        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error(error);
        mensajeListado.textContent = error.message;
    }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(lista) {
    tablaUsuarios.replaceChildren();

    if (lista.length === 0) {
        mensajeListado.textContent = 'No hay usuarios registrados.';
        return;
    }

    mensajeListado.textContent = `Usuarios encontrados: ${lista.length}`;

    lista.forEach(usuario => {
        const fila = document.createElement('tr');

        const valores = [
            usuario.id_usuario,
            usuario.nombre,
            usuario.apellido,
            usuario.email,
            usuario.rol
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
            cargarUsuarioEnFormulario(usuario);
        });

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn-eliminar';

        btnEliminar.addEventListener('click', () => {
            eliminarUsuario(usuario.id_usuario);
        });

        celdaAcciones.append(btnEditar, btnEliminar);
        fila.appendChild(celdaAcciones);

        tablaUsuarios.appendChild(fila);
    });
}

// Cargar datos en el formulario para editar
function cargarUsuarioEnFormulario(usuario) {
    campoId.value = usuario.id_usuario;

    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('apellido').value = usuario.apellido;
    document.getElementById('email').value = usuario.email;
    document.getElementById('id_rol').value = usuario.id_rol;

    // El controlador exige una contraseña para actualizar.
    document.getElementById('contrasena').value = '';

    btnGuardar.textContent = 'Guardar cambios';
    btnCancelar.hidden = false;

    document.getElementById('tituloFormulario').textContent =
        'Modificar usuario';

    mensajeFormulario.textContent =
        `Editando usuario: ${usuario.nombre} ${usuario.apellido}`;

    formulario.scrollIntoView({ behavior: 'smooth' });
}

// Limpiar formulario
function limpiarFormulario() {
    formulario.reset();
    campoId.value = '';

    btnGuardar.textContent = 'Registrar usuario';
    btnCancelar.hidden = true;

    document.getElementById('tituloFormulario').textContent =
        'Registrar usuario';

    mensajeFormulario.textContent = '';
}

// Registrar o modificar usuario
formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    const id = campoId.value;

    const usuario = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        email: document.getElementById('email').value.trim(),
        contrasena: document.getElementById('contrasena').value,
        id_rol: Number(document.getElementById('id_rol').value)
    };

    try {
        const url = id
            ? `${API_URL}/usuarios/${id}`
            : `${API_URL}/usuarios`;

        const metodo = id ? 'PUT' : 'POST';

        await consultarAPI(url, {
            method: metodo,
            body: JSON.stringify(usuario)
        });

        mensajeFormulario.textContent = id
            ? 'Usuario actualizado correctamente.'
            : 'Usuario registrado correctamente.';

        limpiarFormulario();

        await cargarUsuarios();

    } catch (error) {
        console.error(error);
        mensajeFormulario.textContent = error.message;
    }
});

// Cancelar edición
btnCancelar.addEventListener('click', limpiarFormulario);

// Eliminar usuario
async function eliminarUsuario(id) {
    const usuarioActual = JSON.parse(
        localStorage.getItem('usuario') || 'null'
    );

    if (usuarioActual && Number(usuarioActual.id_usuario) === Number(id)) {
        mensajeListado.textContent =
            'No podés eliminar tu propia cuenta mientras estás usando el sistema.';
        return;
    }

    const confirmar = window.confirm(
        '¿Estás seguro de que querés eliminar este usuario?'
    );

    if (!confirmar) return;

    try {
        await consultarAPI(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });

        mensajeListado.textContent = 'Usuario eliminado correctamente.';

        await cargarUsuarios();

    } catch (error) {
        console.error(error);
        mensajeListado.textContent = error.message;
    }
}

// Actualizar listado
btnActualizar.addEventListener('click', cargarUsuarios);

// Iniciar pantalla
cargarUsuarios();
