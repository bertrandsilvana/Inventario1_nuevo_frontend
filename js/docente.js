
const API_URL = 'http://localhost:3000/api/materiales';

const tablaMateriales = document.getElementById('tablaMateriales');
const campoBusqueda = document.getElementById('buscarMaterial');
const mensaje = document.getElementById('mensaje');
const btnActualizar = document.getElementById('btnActualizar');

let materiales = [];

async function cargarMateriales() {
    mensaje.textContent = 'Cargando materiales...';
    tablaMateriales.replaceChildren();

    try {
        const token = localStorage.getItem('token');

        const respuesta = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        materiales = await respuesta.json();

        mostrarMateriales(materiales);
    } catch (error) {
        console.error('Error al cargar materiales:', error);
        mensaje.textContent =
            'No se pudieron cargar los materiales. Verificá que el backend y PostgreSQL estén funcionando.';
    }
}

function mostrarMateriales(lista) {
    tablaMateriales.replaceChildren();

    if (lista.length === 0) {
        mensaje.textContent = 'No se encontraron materiales.';
        return;
    }

    mensaje.textContent = `Materiales encontrados: ${lista.length}`;

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

        tablaMateriales.appendChild(fila);
    });
}



campoBusqueda.addEventListener('input', () => {
    const termino = campoBusqueda.value.trim().toLowerCase();

    const filtrados = materiales.filter(material => {
        const nombre = String(material.nombre ?? '').toLowerCase();
        const categoria = String(material.categoria ?? '').toLowerCase();
        const descripcion = String(material.descripcion ?? '').toLowerCase();

        return nombre.includes(termino) ||
               categoria.includes(termino) ||
               descripcion.includes(termino);
    });

    mostrarMateriales(filtrados);
});


btnActualizar.addEventListener('click', cargarMateriales);

cargarMateriales();
