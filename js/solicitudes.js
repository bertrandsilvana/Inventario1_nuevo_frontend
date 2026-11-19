
const API_SOLICITUDES = 'http://localhost:3000/api/solicitudes';
const API_DETALLES = 'http://localhost:3000/api/detalles-solicitud';

const tablaSolicitudes = document.getElementById('tablaSolicitudes');
const tablaDetalles = document.getElementById('tablaDetalles');

const mensaje = document.getElementById('mensaje');
const mensajeDetalle = document.getElementById('mensajeDetalle');

const btnActualizar = document.getElementById('btnActualizar');
const filtroEstado = document.getElementById('filtroEstado');

let solicitudes = [];

async function cargarSolicitudes() {
    mensaje.textContent = 'Cargando solicitudes...';
    tablaSolicitudes.replaceChildren();

    try {
        const token = localStorage.getItem('token');

        const respuesta = await fetch(API_SOLICITUDES, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        solicitudes = await respuesta.json();

        mostrarSolicitudes(solicitudes);

    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        mensaje.textContent = 'No se pudieron cargar las solicitudes.';
    }
}

function mostrarSolicitudes(lista) {
    tablaSolicitudes.replaceChildren();

    if (lista.length === 0) {
        mensaje.textContent = 'No hay solicitudes para mostrar.';
        return;
    }

    mensaje.textContent = `Solicitudes encontradas: ${lista.length}`;

    lista.forEach(solicitud => {
        const fila = document.createElement('tr');

        const valores = [
            solicitud.id_solicitud,
            solicitud.fecha
                ? new Date(solicitud.fecha).toLocaleString('es-AR')
                : '-',
            solicitud.usuario ?? solicitud.id_usuario,
            solicitud.estado,
            solicitud.observaciones || '-'
        ];

        valores.forEach(valor => {
            const celda = document.createElement('td');
            celda.textContent = valor ?? '-';
            fila.appendChild(celda);
        });

        const celdaAccion = document.createElement('td');

        // Botón para consultar el detalle
        const botonVer = document.createElement('button');
        botonVer.type = 'button';
        botonVer.textContent = 'Ver detalle';
        botonVer.addEventListener('click', () => {
            cargarDetalles(solicitud.id_solicitud);
        });
        celdaAccion.appendChild(botonVer);

        // Botones para aprobar o rechazar
        if (solicitud.estado === 'Pendiente') {
            const botonAprobar = document.createElement('button');
            botonAprobar.type = 'button';
            botonAprobar.textContent = 'Aprobar';
            botonAprobar.addEventListener('click', () => {
                cambiarEstado(solicitud, 'Aprobada');
            });
            celdaAccion.appendChild(botonAprobar);

            const botonRechazar = document.createElement('button');
            botonRechazar.type = 'button';
            botonRechazar.textContent = 'Rechazar';
            botonRechazar.addEventListener('click', () => {
                cambiarEstado(solicitud, 'Rechazada');
            });
            celdaAccion.appendChild(botonRechazar);
        }

        fila.appendChild(celdaAccion);
        tablaSolicitudes.appendChild(fila);
    });
}

async function cargarDetalles(id_solicitud) {
    mensajeDetalle.textContent = 'Cargando detalles...';
    tablaDetalles.replaceChildren();

    try {
        const token = localStorage.getItem('token');

        const respuesta = await fetch(
            `${API_DETALLES}/solicitud/${id_solicitud}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const detalles = await respuesta.json();

        if (detalles.length === 0) {
            mensajeDetalle.textContent =
                'Esta solicitud no tiene detalles registrados.';
            return;
        }

        mensajeDetalle.textContent =
            `Detalles de la solicitud N.º ${id_solicitud}`;

        // Encabezados de la tabla
        const encabezados = [
            'ID detalle',
            'Material',
            'Cantidad solicitada',
            'Cantidad entregada'
        ];

        const filaEncabezado = document.createElement('tr');

        encabezados.forEach(texto => {
            const th = document.createElement('th');
            th.textContent = texto;
            filaEncabezado.appendChild(th);
        });

        tablaDetalles.appendChild(filaEncabezado);

        // Mostrar los detalles
        detalles.forEach(detalle => {
            const fila = document.createElement('tr');

            const valores = [
                detalle.id_detalle,
                detalle.material,
                detalle.cantidad_solicitada,
                detalle.cantidad_entregada
            ];

            valores.forEach(valor => {
                const celda = document.createElement('td');
                celda.textContent = valor ?? '-';
                fila.appendChild(celda);
            });

            tablaDetalles.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mensajeDetalle.textContent =
            'No se pudieron cargar los detalles de la solicitud.';
    }
}


async function cambiarEstado(solicitud, nuevoEstado) {
    const confirmar = confirm(
        `¿Estás segura de que querés ${nuevoEstado.toLowerCase()} la solicitud N.º ${solicitud.id_solicitud}?`
    );

    if (!confirmar) return;

    try {
        const token = localStorage.getItem('token');

        const respuesta = await fetch(
            `${API_SOLICITUDES}/${solicitud.id_solicitud}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    estado: nuevoEstado,
                    observaciones: solicitud.observaciones || null
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || resultado.error || 'No se pudo modificar la solicitud.');
        }

        alert(`La solicitud fue ${nuevoEstado.toLowerCase()} correctamente.`);
        await cargarSolicitudes();

    } catch (error) {
        console.error('Error al cambiar el estado:', error);
        alert(error.message);
    }
}

filtroEstado.addEventListener('change', () => {
    const estadoSeleccionado = filtroEstado.value;

    const filtradas = estadoSeleccionado
        ? solicitudes.filter(s => s.estado === estadoSeleccionado)
        : solicitudes;

    mostrarSolicitudes(filtradas);
});

btnActualizar.addEventListener('click', cargarSolicitudes);

cargarSolicitudes();
