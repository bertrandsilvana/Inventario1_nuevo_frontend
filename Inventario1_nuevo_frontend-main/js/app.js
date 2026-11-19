
const token = localStorage.getItem('token');
const usuarioGuardado = localStorage.getItem('usuario');

let usuario = null;

try {
    usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
} catch (error) {
    usuario = null;
}

// Si no hay sesión válida, vuelve al login.
if (!token || !usuario || !usuario.rol) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.replace('login.html');
} else {
    const pagina = window.location.pathname.split('/').pop();

    // El docente no puede acceder al panel del administrador.
    if (pagina === 'administrador.html' && usuario.rol !== 'Administrador') {
        window.location.replace('docente.html');
    }

    // El administrador no debe ingresar al panel del docente.
    if (pagina === 'docente.html' && usuario.rol !== 'Docente') {
        window.location.replace('administrador.html');
    }
}
// Cerrar sesión
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', function () {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        window.location.replace('login.html');
    });
}
