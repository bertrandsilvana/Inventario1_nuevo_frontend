const API_MATERIALES = 'http://localhost:3000/api/materiales';

const selectMaterial = document.getElementById('materialSolicitud');
const inputCantidad = document.getElementById('cantidadSolicitud');
const tablaDetalle = document.getElementById('tablaDetalleSolicitud');
const mensajeSolicitud = document.getElementById('mensajeSolicitud');
const formSolicitud = document.getElementById('formSolicitud');

let materialesSolicitud = [];
let detallesSolicitud = [];

async function cargarMaterialesParaSolicitud() {
    try {
        const token = localStorage.getItem('token');

        const respuesta = await fetch(API_MATERIALES, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        materialesSolicitud = await respuesta.json();

        selectMaterial.replaceChildren();

        const opcionInicial = document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent = 'Seleccioná un material';
        selectMaterial.appendChild(opcionInicial);

        materialesSolicitud.forEach(material => {
            const opcion = document.createElement('option');
            opcion.value = material.id_material;
            opcion.textContent =
                `${material.nombre} — Stock disponible: ${material.cantidad}`;

            selectMaterial.appendChild(opcion);
        });

    } catch (error) {
        console.error('Error al cargar materiales:', error);
        mensajeSolicitud.textContent = 'No se pudieron cargar los materiales.';
    }
}

function mostrarDetallesSolicitud() {
    tablaDetalle.replaceChildren();

    detallesSolicitud.forEach((detalle, indice) => {
        const fila = document.createElement('tr');

        [
            detalle.nombre,
            detalle.stock,
            detalle.cantidad
        ].forEach(valor => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const celdaAccion = document.createElement('td');
        const botonEliminar = document.createElement('button');

        botonEliminar.type = 'button';
        botonEliminar.textContent = 'Quitar';

        botonEliminar.addEventListener('click', () => {
            detallesSolicitud.splice(indice, 1);
            mostrarDetallesSolicitud();
        });

        celdaAccion.appendChild(botonEliminar);
        fila.appendChild(celdaAccion);

        tablaDetalle.appendChild(fila);
    });
}

formSolicitud.addEventListener('submit', function (event) {
    event.preventDefault();

    const idMaterial = Number(selectMaterial.value);
    const cantidad = Number(inputCantidad.value);

    const material = materialesSolicitud.find(
        item => item.id_material === idMaterial
    );

    if (!material) {
        mensajeSolicitud.textContent = 'Seleccioná un material.';
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        mensajeSolicitud.textContent = 'Ingresá una cantidad válida.';
        return;
    }

    const detalleExistente = detallesSolicitud.find(
        item => item.id_material === idMaterial
    );

    const cantidadTotal = detalleExistente
        ? detalleExistente.cantidad + cantidad
        : cantidad;

    if (cantidadTotal > material.cantidad) {
        mensajeSolicitud.textContent =
            'La cantidad solicitada supera el stock disponible.';
        return;
    }

    if (detalleExistente) {
        detalleExistente.cantidad = cantidadTotal;
    } else {
        detallesSolicitud.push({
            id_material: idMaterial,
            nombre: material.nombre,
            stock: material.cantidad,
            cantidad: cantidad
        });
    }

    mostrarDetallesSolicitud();
    formSolicitud.reset();

    mensajeSolicitud.textContent = 'Material agregado a la solicitud.';
});

cargarMaterialesParaSolicitud();
const API_SOLICITUDES = 'http://localhost:3000/api/solicitudes';
const API_DETALLES = 'http://localhost:3000/api/detalles-solicitud';

const btnEnviarSolicitud = document.getElementById('btnEnviarSolicitud');
const observacionesSolicitud = document.getElementById('observacionesSolicitud');

btnEnviarSolicitud.addEventListener('click', async function () {

    if (detallesSolicitud.length === 0) {
        mensajeSolicitud.textContent =
            'Primero agregá al menos un material.';
        return;
    }

    const token = localStorage.getItem('token');

    btnEnviarSolicitud.disabled = true;
    mensajeSolicitud.textContent = 'Enviando solicitud...';

    try {
        // 1. Crear la solicitud principal.
        const respuestaSolicitud = await fetch(API_SOLICITUDES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                estado: 'Pendiente',
                observaciones: observacionesSolicitud.value.trim()
            })
        });

        if (!respuestaSolicitud.ok) {
            throw new Error('No se pudo crear la solicitud.');
        }

        const solicitudCreada = await respuestaSolicitud.json();

        // 2. Guardar los materiales asociados a la solicitud.
        for (const detalle of detallesSolicitud) {

            const respuestaDetalle = await fetch(API_DETALLES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_solicitud: solicitudCreada.id_solicitud,
                    id_material: detalle.id_material,
                    cantidad_solicitada: detalle.cantidad,
                    cantidad_entregada: 0
                })
            });

            if (!respuestaDetalle.ok) {
                throw new Error(
                    'La solicitud se creó, pero no se pudieron guardar todos sus materiales.'
                );
            }
        }

        // 3. Limpiar el formulario después de guardar todo.
        detallesSolicitud = [];
        mostrarDetallesSolicitud();
        formSolicitud.reset();
        observacionesSolicitud.value = '';

        mensajeSolicitud.textContent =
            `¡Solicitud N.º ${solicitudCreada.id_solicitud} enviada correctamente!`;

    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        mensajeSolicitud.textContent = error.message;
    } finally {
        btnEnviarSolicitud.disabled = false;
    }
});