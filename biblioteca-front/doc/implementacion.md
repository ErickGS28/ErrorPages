# Frontend React - CRUD de Libros (biblioteca-front)

## ¿Qué es este proyecto?

Frontend en React + Vite que consume la API REST de `biblioteca_drf` para hacer un CRUD completo de libros. Permite listar, crear, editar y eliminar libros desde una interfaz web.

---

## Stack tecnológico

| Herramienta | Versión | Para qué se usa |
|---|---|---|
| React | 18.x | UI declarativa con hooks |
| Vite | 5.x | Bundler y servidor de desarrollo |
| Axios | 1.7.x | Peticiones HTTP a la API |
| Bootstrap | 5.3.x | Estilos y layout (grid, cards, botones) |
| react-data-table-component | 7.6.x | Tabla con paginación y ordenamiento |
| react-hot-toast | 2.4.x | Notificaciones de éxito/error/carga |

---

## Estructura de archivos

```
biblioteca-front/
├── index.html                  # HTML base, punto de entrada
├── vite.config.js              # Configuración Vite + plugin React
├── package.json                # Dependencias del proyecto
├── .gitignore                  # Ignora node_modules y dist
├── doc/
│   └── implementacion.md       # Este archivo
├── public/
└── src/
    ├── main.jsx                # Punto de entrada React (monta <App />)
    ├── App.jsx                 # Componente raíz, renderiza <LibrosApp />
    ├── LibrosApp.jsx           # Componente principal con formulario + tabla
    ├── App.css                 # Estilos para badges de estado (Prestado/Disponible)
    ├── index.css               # Estilos globales del body
    └── services/
        └── api.js              # Funciones para llamar a la API (read, create, update, deleteLibro)
```

---

## Cómo iniciar el proyecto

### Requisitos previos
- Node.js instalado (v18 o superior recomendado)
- El backend Django corriendo en `http://localhost:8000`

### Pasos
```bash
# 1. Ir a la carpeta del frontend
cd biblioteca-front

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:5173
```

---

## Cómo funciona la API (`src/services/api.js`)

El archivo `api.js` centraliza todas las llamadas HTTP. Usa **Axios** y envía los datos como **FormData** (igual que el ejemplo de mascotas).

```js
const BASE_URL = 'http://localhost:8000/biblioteca-drf/api/libros';

read()              // GET  /libros/          → lista todos
create(data)        // POST /libros/          → crea uno nuevo
update(id, data)    // PUT  /libros/{id}/     → reemplaza completo
deleteLibro(id)     // DELETE /libros/{id}/   → elimina
```

**¿Por qué FormData?** Django REST Framework acepta tanto JSON como `multipart/form-data`. El ejemplo de referencia usa FormData, así que se mantiene el mismo patrón para consistencia.

---

## Cómo funciona el componente principal (`LibrosApp.jsx`)

### Estado (useState)

| Variable | Tipo | Para qué sirve |
|---|---|---|
| `libros` | array | Lista completa de libros de la API |
| `formData` | objeto | Valores actuales del formulario |
| `editandoId` | number/null | `null` = modo crear, número = modo editar |
| `filtro` | string | Texto de búsqueda en la tabla |
| `cargandoTabla` | boolean | Spinner en la tabla mientras carga |
| `cargandoGuardar` | boolean | Spinner en el botón Guardar |
| `erroresBackend` | objeto | Errores de validación que devuelve Django |

### Flujo de operaciones

**Listar libros (cargarLibros)**
1. Se llama al montar el componente (`useEffect`)
2. Activa `cargandoTabla = true`
3. Llama a `read()` y guarda la respuesta en `libros`
4. Si hay error, muestra toast de error

**Crear libro (handleSubmit con editandoId = null)**
1. Usuario llena el formulario y presiona "Registrar"
2. Se convierte `prestado` (boolean) a string `'true'`/`'false'` que Django acepta
3. Llama a `create(datos)` con FormData
4. Si éxito: limpia formulario, recarga tabla, muestra toast verde
5. Si error 400: muestra los mensajes por campo debajo de cada input

**Editar libro (prepararEdicion + handleSubmit)**
1. Usuario presiona "Editar" en una fila
2. `prepararEdicion()` copia los datos del libro al formulario y guarda el ID
3. El formulario cambia a modo "Editar Libro" con botón "Cancelar"
4. Al guardar llama a `update(id, datos)` en vez de `create()`

**Eliminar libro (handleEliminar)**
1. Usuario presiona "Eliminar"
2. `window.confirm()` pide confirmación
3. Muestra toast de "cargando"
4. Llama a `deleteLibro(id)`
5. Actualiza el toast a éxito o error

### Campo `prestado` (booleano)

El modelo Libro tiene un campo `prestado: BooleanField`. En el frontend se maneja como:
- Formulario: `<input type="checkbox">` → valor `true` o `false`
- Al enviar: se convierte a string `'true'`/`'false'` porque FormData serializa todo como texto
- En la tabla: se muestra como badge verde (Disponible) o rojo (Prestado)

### Búsqueda/Filtro

El filtro es **local** (no hace peticiones extra al servidor). Filtra el array `libros` por título, autor o ISBN usando `.filter()` de JavaScript.

---

## Cambios necesarios en el backend

Para que el frontend funcione, el backend necesita CORS configurado. Ver `biblioteca_drf/doc/cambios-para-front.md` para el detalle completo de qué se cambió y por qué.

---

## Endpoint API utilizado

El backend corre en `http://localhost:8000` y el endpoint de libros es:

```
GET    http://localhost:8000/biblioteca-drf/api/libros/
POST   http://localhost:8000/biblioteca-drf/api/libros/
PUT    http://localhost:8000/biblioteca-drf/api/libros/{id}/
DELETE http://localhost:8000/biblioteca-drf/api/libros/{id}/
```

Estos endpoints los genera automáticamente el `DefaultRouter` de DRF al registrar el `LibroViewSet`.
