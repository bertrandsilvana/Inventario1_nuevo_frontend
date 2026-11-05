# Inventario1

Frontend web para consultar y administrar el inventario de un laboratorio escolar. La interfaz está hecha con HTML, CSS y JavaScript nativo, y se comunica con una API REST externa.

> Este repositorio contiene únicamente el frontend. El servidor API y la base de datos PostgreSQL deben ejecutarse por separado.

## Contenido

- [Requisitos](#requisitos)
- [Ejecución local](#ejecución-local)
- [Pantallas y funciones](#pantallas-y-funciones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Integración con la API](#integración-con-la-api)
- [Sesión y permisos](#sesión-y-permisos)
- [Estilos e interacción](#estilos-e-interacción)
- [Estado y limitaciones](#estado-y-limitaciones)
- [Pruebas y compilación](#pruebas-y-compilación)

## Requisitos

- Un navegador moderno.
- Un servidor web estático para servir los archivos del frontend. En desarrollo se recomienda la extensión **Live Server** de Visual Studio Code.
- El backend de Inventario1 disponible en `http://localhost:3000`.
- PostgreSQL y la base de datos que utiliza ese backend.
- El backend debe aceptar solicitudes desde el origen del frontend, por ejemplo `http://localhost:5501` (configuración de CORS).

El proyecto no incluye `package.json`, dependencias npm, backend, esquema SQL ni credenciales de prueba. No hace falta ejecutar `npm install` para servir este frontend.

## Ejecución local

1. Abre en Visual Studio Code la carpeta del frontend, donde están `index.html`, `login.html`, `css/` y `js/`.
2. Inicia el backend por separado y confirma que responde en `http://localhost:3000` y que puede conectarse a PostgreSQL.
3. Inicia Live Server desde `index.html`. El puerto configurado para Live Server es `5501`.
4. Abre `http://localhost:5501/`. `index.html` redirige a la pantalla de inicio de sesión.
5. Ingresa con una cuenta que exista en el backend. La aplicación no define usuarios ni contraseñas predeterminados.

Conviene servir la aplicación por HTTP y no abrir los HTML directamente con `file://`: el navegador puede bloquear las solicitudes a la API por CORS u origen local.

La URL base de la API está escrita directamente en los archivos JavaScript. Si el backend utiliza otro host o puerto, actualiza las constantes correspondientes en `js/login.js`, `js/docente.js`, `js/materiales.js`, `js/usuarios.js` y `js/solicitudes-docente.js`.

## Pantallas y funciones

| Archivo | Descripción |
| --- | --- |
| `index.html` | Entrada del sitio; redirige a `login.html`. |
| `login.html` | Autentica al usuario y lo dirige al panel correspondiente a su rol. |
| `administrador.html` | Panel principal con accesos a módulos e indicadores ilustrativos. |
| `docente.html` | Consulta y busca materiales; permite preparar y enviar solicitudes de insumos. |
| `materiales.html` | Alta, consulta, edición y eliminación de materiales. Carga categorías y ubicaciones desde la API. |
| `usuarios.html` | Alta, consulta, edición y eliminación de cuentas. |
| `solicitudes.html` | Interfaz administrativa inicial para solicitudes; el listado todavía no está conectado a la API. |

Los formularios requieren que el backend exponga los recursos indicados más abajo. Los indicadores del panel principal no están conectados a datos reales.

## Estructura del proyecto

```text
.
├── index.html
├── login.html
├── administrador.html
├── docente.html
├── materiales.html
├── usuarios.html
├── solicitudes.html
├── css/
│   ├── administrador.css
│   ├── docente.css
│   ├── login.css
│   ├── materiales.css
│   └── solicitudes.css
├── js/
│   ├── app.js
│   ├── login.js
│   ├── docente.js
│   ├── materiales.js
│   ├── usuarios.js
│   └── solicitudes-docente.js
└── .vscode/
    └── settings.json
```

`app.js` comprueba la sesión y maneja el cierre de sesión. Cada pantalla incluye su propio CSS y carga el JavaScript que controla su formulario o listado.

## Integración con la API

La URL base usada por el frontend es `http://localhost:3000/api`. Las peticiones protegidas envían el token guardado en la sesión así:

```http
Authorization: Bearer <token>
```

### Rutas utilizadas

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Iniciar sesión. |
| `GET` | `/api/materiales` | Consultar materiales en las vistas de docente y administrador. |
| `POST` | `/api/materiales` | Registrar un material. |
| `PUT` | `/api/materiales/:id` | Actualizar un material. |
| `DELETE` | `/api/materiales/:id` | Eliminar un material. |
| `GET` | `/api/categorias` | Poblar el selector de categorías del formulario de materiales. |
| `GET` | `/api/ubicaciones` | Poblar el selector de ubicaciones del formulario de materiales. |
| `GET` | `/api/usuarios` | Consultar usuarios. |
| `POST` | `/api/usuarios` | Registrar un usuario. |
| `PUT` | `/api/usuarios/:id` | Actualizar un usuario. |
| `DELETE` | `/api/usuarios/:id` | Eliminar un usuario. |
| `POST` | `/api/solicitudes` | Crear la solicitud del docente. |
| `POST` | `/api/detalles-solicitud` | Asociar cada material solicitado a la solicitud creada. |

Las rutas de consulta de materiales, categorías, ubicaciones y usuarios deben devolver arreglos JSON, ya que el frontend los recorre directamente.

### Datos esperados

Inicio de sesión, `POST /api/auth/login`:

```json
{
  "email": "docente@escuela.edu",
  "contrasena": "contraseña"
}
```

La respuesta exitosa debe incluir `token` y `usuario`. El objeto `usuario` debe incluir `rol`, con el valor exacto `Administrador` o `Docente`; la aplicación utiliza ese valor para elegir la pantalla de destino.

Crear o actualizar un material:

```json
{
  "nombre": "Microscopio",
  "descripcion": "Microscopio óptico",
  "cantidad": 4,
  "estado": "Disponible",
  "id_categoria": 1,
  "id_ubicacion": 1
}
```

La interfaz muestra también `id_material` y los valores `categoria`/`ubicacion` si la API los incluye. Para los selectores, las categorías y ubicaciones deben incluir sus identificadores (`id_categoria`, `id_ubicacion`) y `nombre`.

Crear un usuario:

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "email": "ana@escuela.edu",
  "contrasena": "contraseña-segura",
  "id_rol": 2
}
```

El formulario presenta los roles con ID `1` para Administrador y `2` para Docente. La respuesta del login, además, debe entregar el nombre de rol en `usuario.rol`.

Crear una solicitud y sus detalles:

```json
{
  "estado": "Pendiente",
  "observaciones": "Material necesario para la clase"
}
```

La respuesta de `POST /api/solicitudes` debe incluir `id_solicitud`. Después se envía un `POST /api/detalles-solicitud` por cada material:

```json
{
  "id_solicitud": 25,
  "id_material": 8,
  "cantidad_solicitada": 2,
  "cantidad_entregada": 0
}
```

Los nombres y formatos anteriores describen lo que consume el frontend; el backend debe implementar y validar estos contratos.

## Sesión y permisos

- Tras iniciar sesión, `js/login.js` guarda `token` y `usuario` en `localStorage`.
- `js/app.js` redirige al login cuando falta la sesión y permite cerrar sesión eliminando ambos valores.
- La comprobación de rol en el frontend redirige al docente fuera de `administrador.html` y al administrador fuera de `docente.html`.
- Los datos enviados a la API incluyen el token Bearer cuando corresponde.
- El frontend no sustituye la autorización del servidor. El backend debe validar el token y comprobar permisos en cada endpoint; también debe proteger las pantallas y operaciones administrativas.

## Estilos e interacción

Las hojas CSS definen una interfaz responsive con transiciones en tarjetas, botones, iconos y navegación, estados de foco visibles para teclado y consideración de `prefers-reduced-motion`. No se utilizan librerías visuales externas.

## Estado y limitaciones

- La gestión administrativa de solicitudes no tiene un script que consulte o actualice el listado. `solicitudes.html` muestra este estado de forma explícita.
- El panel de administración presenta indicadores ilustrativos, no métricas cargadas desde la API.
- El menú del administrador incluye enlaces a `categorias.html`, `ubicaciones.html` y `reportes.html`, pero esos archivos no están incluidos en este frontend.
- Las solicitudes del docente se guardan en dos pasos: primero la solicitud y luego cada detalle. Si falla el segundo paso, la solicitud principal podría haberse creado ya; el backend debería ofrecer una operación transaccional para evitar datos parciales.
- La dirección de la API está codificada en JavaScript; no existe configuración por entorno.
- Los roles y el formato de respuesta deben coincidir con las expectativas descritas en [Integración con la API](#integración-con-la-api).

## Pruebas y compilación

El repositorio no incluye un sistema de compilación, gestor de paquetes, pruebas automatizadas ni linter configurado. Los archivos se ejecutan directamente desde un servidor estático. Para validar una instalación, inicia sesión con cuentas de ambos roles y comprueba la conexión del navegador con el backend y PostgreSQL.