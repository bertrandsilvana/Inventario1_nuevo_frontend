
const API_URL = 'http://localhost:3000/api/auth/login';

const formulario = document.getElementById('formLogin');
const mensaje = document.getElementById('mensaje');

formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    mensaje.textContent = 'Verificando datos...';

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                contrasena
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Credenciales incorrectas.');
        }

        // Guardamos el token y los datos del usuario.
        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario));

        // Redirigimos según el rol.
        if (datos.usuario.rol === 'Administrador') {
            window.location.href = 'administrador.html';

        } else if (datos.usuario.rol === 'Docente') {
            window.location.href = 'docente.html';

        } else {
            throw new Error('El usuario no tiene un rol reconocido.');
        }

    } catch (error) {
        console.error('Error en el login:', error);
        mensaje.textContent = error.message;
    }
});
