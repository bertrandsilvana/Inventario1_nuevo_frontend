(() => {
const API_URL = 'http://localhost:3000/api';

const token = localStorage.getItem('token');
const usuarioGuardado = localStorage.getItem('usuario');

let usuario = null;
let reportes = [];

try {
    usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
} catch (error) {
    usuario = null;
}

// Verificar sesión
if (!token || !usuario || !usuario.rol) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

const esAdministrador = usuario?.rol === 'Administrador';

const menu = document.getElementById('menuNavegacion');

// Menú según el rol
function cargarMenu() {
    const enlaces = esAdministrador
        ? [
            ['▦', 'Panel principal', 'administrador.html'],
            ['▤', 'Materiales', 'materiales.html'],
            ['▧', 'Categorías', 'categorias.html'],
            ['⌖', 'Ubicaciones', 'ubicaciones.html'],
            ['⇄', 'Solicitudes', 'solicitudes.html'],
            ['▥', 'Reportes', 'reportes.html'],
            ['♙', 'Usuarios', 'usuarios.html']
        ]
        : [
            ['▦', 'Panel principal', 'docente.html'],
            ['▤', 'Materiales', 'materiales.html'],
            ['⇄', 'Solicitudes', 'solicitudes.html'],
            ['▥', 'Reportes', 'reportes.html']
        ];

    menu.innerHTML = enlaces.map(enlace => `
        <a class="nav-link ${enlace[2] === 'reportes.html' ? 'activo' : ''}"
           href="${enlace[2]}">
            <span>${enlace[0]}</span> ${enlace[1]}
        </a>
    `).join('');

    document.getElementById('linkInicio').href =
        esAdministrador ? 'administrador.html' : 'docente.html';
}

// Datos del usuario
document.getElementById('nombreUsuario').textContent =
    usuario?.nombre || 'Usuario';

document.getElementById('rolUsuario').textContent =
    usuario?.rol || '';

document.getElementById('avatarUsuario').textContent =
    (usuario?.nombre || 'U').charAt(0).toUpperCase();

cargarMenu();

// Cerrar sesión
document.getElementById('btnCerrarSesion').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
});

// Elementos
const formReporte = document.getElementById('formReporte');
const tablaReportes = document.getElementById('tablaReportes');
const filtroEstado = document.getElementById('filtroEstado');
const mensajeFormulario = document.getElementById('mensajeFormulario');
const mensajeTabla = document.getElementById('mensajeTabla');

// Peticiones HTTP
async function peticion(url, opciones = {}) {
    const respuesta = await fetch(`${API_URL}${url}`, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...opciones.headers
        }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || datos.error || 'Error en la operación');
    }

    return datos;
}

// Cargar materiales para el formulario
async function cargarMateriales() {
    const selectMaterial = document.getElementById('id_material');

    try {
        const datos = await peticion('/materiales');

        const materiales = Array.isArray(datos)
            ? datos
            : datos.materiales || datos.data || [];

        selectMaterial.innerHTML =
            '<option value="">Seleccionar material</option>';

        materiales.forEach(material => {
            const opcion = document.createElement('option');
            opcion.value = material.id_material;
            opcion.textContent = material.nombre;
            selectMaterial.appendChild(opcion);
        });

    } catch (error) {
        selectMaterial.innerHTML =
            '<option value="">No se pudieron cargar los materiales</option>';

        console.error('Error al cargar materiales:', error);
    }
}

// Registrar reporte
formReporte.addEventListener('submit', async (e) => {
    e.preventDefault();

    mensajeFormulario.textContent = '';
    mensajeFormulario.className = 'mensaje';

    const reporte = {
        tipo_problema: document.getElementById('tipo_problema').value,
        descripcion: document.getElementById('descripcion').value.trim(),
        estado: 'Pendiente',
        id_material: Number(document.getElementById('id_material').value)
    };

    if (!reporte.tipo_problema || !reporte.descripcion || !reporte.id_material) {
        mensajeFormulario.textContent = 'Completá todos los campos.';
        mensajeFormulario.classList.add('error');
        return;
    }

    try {
        await peticion('/reportes', {
            method: 'POST',
            body: JSON.stringify(reporte)
        });

        mensajeFormulario.textContent = 'Reporte registrado correctamente.';
        mensajeFormulario.classList.add('exito');

        formReporte.reset();

        await cargarReportes();

    } catch (error) {
        mensajeFormulario.textContent = error.message;
        mensajeFormulario.classList.add('error');
    }
});

// Consultar reportes
async function cargarReportes() {
    tablaReportes.innerHTML = `
        <tr><td colspan="7">Cargando reportes...</td></tr>
    `;

    try {
        const datos = await peticion('/reportes');

        reportes = Array.isArray(datos)
            ? datos
            : datos.reportes || datos.data || [];

        mostrarReportes();

    } catch (error) {
        tablaReportes.innerHTML = `
            <tr><td colspan="7">No se pudieron cargar los reportes.</td></tr>
        `;

        mensajeTabla.textContent = error.message;
        mensajeTabla.className = 'mensaje error';
    }
}

// Mostrar reportes en la tabla
function mostrarReportes() {
    const estadoSeleccionado = filtroEstado.value;

    const filtrados = reportes.filter(reporte => {
        return !estadoSeleccionado ||
            reporte.estado === estadoSeleccionado;
    });

    tablaReportes.innerHTML = '';

    if (filtrados.length === 0) {
        tablaReportes.innerHTML = `
            <tr>
                <td colspan="7">No hay reportes para mostrar.</td>
            </tr>
        `;
        return;
    }

    filtrados.forEach(reporte => {
        const fila = document.createElement('tr');

        const fecha = reporte.fecha
            ? new Date(reporte.fecha).toLocaleDateString('es-AR')
            : '—';

        const estadoClase = claseEstado(reporte.estado);

        fila.innerHTML = `
            <td>${reporte.id_reporte}</td>
            <td>${fecha}</td>
            <td>${escaparHTML(reporte.tipo_problema)}</td>
            <td>${escaparHTML(reporte.material || '—')}</td>
            <td>${escaparHTML(reporte.usuario || '—')}</td>
            <td>
                <span class="estado ${estadoClase}">
                    ${escaparHTML(reporte.estado || 'Sin estado')}
                </span>
            </td>
            <td>
                <button class="btn-tabla btn-ver"
                    data-accion="ver"
                    data-id="${reporte.id_reporte}">
                    Ver
                </button>

                ${esAdministrador ? `
                    <button class="btn-tabla btn-estado"
                        data-accion="estado"
                        data-id="${reporte.id_reporte}">
                        Estado
                    </button>

                    <button class="btn-tabla btn-eliminar"
                        data-accion="eliminar"
                        data-id="${reporte.id_reporte}"
                        aria-label="Eliminar reporte"
                        title="Eliminar reporte">
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4h8v2"/>
                            <path d="m19 6-1 14H6L5 6"/>
                            <path d="M10 11v5"/>
                            <path d="M14 11v5"/>
                        </svg>
                    </button>
                ` : ''}
            </td>
        `;

        tablaReportes.appendChild(fila);
    });
}

// Evitar insertar contenido de la API como HTML ejecutable
function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[caracter]);
}

// Clase visual según estado
function claseEstado(estado) {
    const normalizado = String(estado || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

    if (normalizado === 'pendiente') return 'estado-pendiente';
    if (normalizado === 'en-revision') return 'estado-en-revision';
    if (normalizado === 'resuelto') return 'estado-resuelto';

    return '';
}

// Acciones de los botones
tablaReportes.addEventListener('click', async (e) => {
    const boton = e.target.closest('button[data-accion]');

    if (!boton) return;

    const id = boton.dataset.id;
    const accion = boton.dataset.accion;

    const reporte = reportes.find(r =>
        String(r.id_reporte) === String(id)
    );

    if (!reporte) return;

    if (accion === 'ver') {
        alert(
            `REPORTE N.º ${reporte.id_reporte}\n\n` +
            `Tipo: ${reporte.tipo_problema}\n` +
            `Material: ${reporte.material || '—'}\n` +
            `Usuario: ${reporte.usuario || '—'}\n` +
            `Fecha: ${reporte.fecha ? new Date(reporte.fecha).toLocaleDateString('es-AR') : '—'}\n` +
            `Estado: ${reporte.estado}\n\n` +
            `Descripción:\n${reporte.descripcion}`
        );
    }

    if (accion === 'estado') {
        const nuevoEstado = prompt(
            'Ingresá el nuevo estado:\n' +
            'Pendiente\nEn revisión\nResuelto',
            reporte.estado
        );

        if (!nuevoEstado) return;

        const estadosValidos = ['Pendiente', 'En revisión', 'Resuelto'];

        if (!estadosValidos.includes(nuevoEstado)) {
            alert('El estado ingresado no es válido.');
            return;
        }

        try {
            await peticion(`/reportes/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    tipo_problema: reporte.tipo_problema,
                    descripcion: reporte.descripcion,
                    estado: nuevoEstado
                })
            });

            await cargarReportes();

        } catch (error) {
            alert(error.message);
        }
    }

    if (accion === 'eliminar') {
        const confirmar = confirm(
            `¿Estás seguro de eliminar el reporte N.º ${id}?`
        );

        if (!confirmar) return;

        try {
            await peticion(`/reportes/${id}`, {
                method: 'DELETE'
            });

            await cargarReportes();

        } catch (error) {
            alert(error.message);
        }
    }
});

// Filtro
filtroEstado.addEventListener('change', mostrarReportes);

// Inicio
cargarMateriales();
cargarReportes();
})();