# Sistema de Reportes de Errores - Django

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema completo de registro y visualización de reportes de errores HTTP utilizando Django. Permite registrar reportes de errores (400, 500, etc.) mediante un formulario interactivo con JavaScript y visualizarlos con estilos dinámicos según el tipo de error.

---

## 🎯 Funcionalidades Implementadas

- ✅ Registro de reportes de errores mediante formulario
- ✅ Validación de datos en backend
- ✅ Respuestas en formato JSON
- ✅ Visualización dinámica con JavaScript (fetch)
- ✅ Estilos dinámicos según tipo de error:
  - **Errores 4xx** → Fondo amarillo
  - **Errores 5xx** → Fondo rojo
- ✅ Envío de formulario con AJAX (sin recarga de página)
- ✅ Mensajes de éxito y error en tiempo real

---

## 📝 Pasos de Implementación

### **PASO 1: Crear la aplicación error_reports**

#### Comando ejecutado:
```bash
python manage.py startapp error_reports
```

Este comando crea la estructura básica de la aplicación:
```
error_reports/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── tests.py
└── views.py
```

#### Registrar la aplicación en `testing/settings.py`

**Ubicación:** `testing/settings.py` línea 33-41

**Código agregado:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'error_reports'  # ← Nueva aplicación agregada
]
```

---

### **PASO 2: Crear el modelo ErrorReport**

#### Archivo: `error_reports/models.py`

**Código completo:**
```python
from django.db import models

# Create your models here.

class ErrorReport(models.Model):
    titulo = models.CharField(max_length=150, blank=False, null=False)
    descripcion = models.TextField(blank=False, null=False)
    tipo_error = models.CharField(max_length=100, blank=False, null=False)
    url = models.URLField(blank=False, null=False)
    metodo_http = models.CharField(max_length=10, blank=False, null=False)
    ip_cliente = models.GenericIPAddressField(blank=True, null=True)
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.titulo} - {self.tipo_error}"

    class Meta:
        verbose_name = "Reporte de Error"
        verbose_name_plural = "Reportes de Errores"
        ordering = ['-fecha_reporte']
```

**Explicación de campos:**
- `titulo`: Título del error (máx. 150 caracteres, obligatorio)
- `descripcion`: Descripción detallada (obligatorio)
- `tipo_error`: Tipo de error HTTP como "404", "500" (obligatorio)
- `url`: URL donde ocurrió el error (obligatorio)
- `metodo_http`: Método HTTP usado (GET, POST, etc., obligatorio)
- `ip_cliente`: IP del cliente (opcional)
- `fecha_reporte`: Fecha automática de creación
- `activo`: Estado del reporte (por defecto True)

---

### **PASO 3: Crear el formulario ErrorReportForm**

#### Archivo: `error_reports/forms.py` (nuevo archivo)

**Código completo:**
```python
from django import forms
from .models import ErrorReport


class ErrorReportForm(forms.ModelForm):
    class Meta:
        model = ErrorReport
        fields = ['titulo', 'descripcion', 'tipo_error', 'url', 'metodo_http', 'ip_cliente']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Título del error'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Descripción detallada del error',
                'rows': 4
            }),
            'tipo_error': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 404, 500, 403'
            }),
            'url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://ejemplo.com/pagina'
            }),
            'metodo_http': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'GET, POST, PUT, DELETE'
            }),
            'ip_cliente': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '192.168.1.1 (opcional)'
            }),
        }
        labels = {
            'titulo': 'Título',
            'descripcion': 'Descripción',
            'tipo_error': 'Tipo de Error',
            'url': 'URL',
            'metodo_http': 'Método HTTP',
            'ip_cliente': 'IP del Cliente',
        }
```

**Características:**
- Excluye `fecha_reporte` y `activo` (se manejan automáticamente)
- Incluye clases de Bootstrap para estilizar campos
- Agrega placeholders para mejor UX
- Define etiquetas personalizadas en español

---

### **PASO 4: Crear las vistas**

#### Archivo: `error_reports/views.py`

**Código completo:**
```python
from django.shortcuts import render
from django.http import JsonResponse
from .forms import ErrorReportForm
from .models import ErrorReport

# Create your views here.

def reporte_error_view(request):
    """
    Vista para renderizar el formulario (GET) y procesar el registro de reportes (POST)
    """
    if request.method == 'GET':
        form = ErrorReportForm()
        return render(request, 'error_reports/reporte_error.html', {'form': form})

    elif request.method == 'POST':
        form = ErrorReportForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'status': 'ok',
                'mensaje': 'registro exitoso'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'mensaje': 'algo salio mal',
                'errors': form.errors
            }, status=400)


def obtener_reportes_view(request):
    """
    Vista para obtener todos los reportes en formato JSON
    """
    reportes = ErrorReport.objects.all().values(
        'id', 'titulo', 'descripcion', 'tipo_error',
        'url', 'metodo_http', 'ip_cliente', 'fecha_reporte', 'activo'
    )
    return JsonResponse(list(reportes), safe=False)
```

**Explicación:**

**Vista `reporte_error_view`:**
- **GET:** Renderiza el template con formulario vacío
- **POST:**
  - Valida el formulario
  - Si es válido → Guarda y retorna `{"status": "ok", "mensaje": "registro exitoso"}`
  - Si no es válido → Retorna `{"status": "error", "mensaje": "algo salio mal", "errors": {...}}`

**Vista `obtener_reportes_view`:**
- Consulta todos los reportes con `ErrorReport.objects.all()`
- Convierte a valores con `.values()`
- Retorna JSON con `JsonResponse(list(reportes), safe=False)`

---

### **PASO 5 y 6: Configurar URLs**

#### Archivo: `error_reports/urls.py` (nuevo archivo)

**Código completo:**
```python
from django.urls import path
from . import views

app_name = 'error_reports'

urlpatterns = [
    path('reportes-error/', views.reporte_error_view, name='reporte_error'),
    path('obtener-reportes/', views.obtener_reportes_view, name='obtener_reportes'),
]
```

#### Archivo: `testing/urls.py` (modificado)

**Cambios realizados:**

1. **Importar `include`:**
```python
from django.urls import path, include  # ← Se agregó include
```

2. **Agregar el include de error_reports:**
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', core_views.index, name='index'),
    path('contacto/', core_views.contacto_view, name='contacto'),
    path('', include('error_reports.urls')),  # ← Nueva línea
]
```

**Rutas resultantes:**
- `http://127.0.0.1:8000/reportes-error/` → Formulario de reportes
- `http://127.0.0.1:8000/obtener-reportes/` → API JSON de reportes

---

### **PASO 7: Crear el template HTML**

#### Comando para crear directorio:
```bash
mkdir -p error_reports/templates/error_reports
```

#### Archivo: `error_reports/templates/error_reports/reporte_error.html`

**Código completo (HTML + JavaScript):**
```html
{% extends 'base.html' %}

{% block tituloprueba %}Sistema de Reportes de Errores{% endblock %}

{% block contenido %}
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<div class="container mt-5">
    <div class="row">
        <!-- Formulario de Registro -->
        <div class="col-md-6">
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Registrar Nuevo Reporte</h4>
                </div>
                <div class="card-body">
                    <!-- Área de mensajes -->
                    <div id="mensaje-area"></div>

                    <form id="form-reporte">
                        {% csrf_token %}

                        <div class="mb-3">
                            <label for="{{ form.titulo.id_for_label }}" class="form-label">{{ form.titulo.label }}</label>
                            {{ form.titulo }}
                            <div class="error-field" id="error-titulo"></div>
                        </div>

                        <div class="mb-3">
                            <label for="{{ form.descripcion.id_for_label }}" class="form-label">{{ form.descripcion.label }}</label>
                            {{ form.descripcion }}
                            <div class="error-field" id="error-descripcion"></div>
                        </div>

                        <div class="mb-3">
                            <label for="{{ form.tipo_error.id_for_label }}" class="form-label">{{ form.tipo_error.label }}</label>
                            {{ form.tipo_error }}
                            <div class="error-field" id="error-tipo_error"></div>
                        </div>

                        <div class="mb-3">
                            <label for="{{ form.url.id_for_label }}" class="form-label">{{ form.url.label }}</label>
                            {{ form.url }}
                            <div class="error-field" id="error-url"></div>
                        </div>

                        <div class="mb-3">
                            <label for="{{ form.metodo_http.id_for_label }}" class="form-label">{{ form.metodo_http.label }}</label>
                            {{ form.metodo_http }}
                            <div class="error-field" id="error-metodo_http"></div>
                        </div>

                        <div class="mb-3">
                            <label for="{{ form.ip_cliente.id_for_label }}" class="form-label">{{ form.ip_cliente.label }}</label>
                            {{ form.ip_cliente }}
                            <div class="error-field" id="error-ip_cliente"></div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100">Registrar Reporte</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Lista de Reportes -->
        <div class="col-md-6">
            <div class="card shadow">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0">Reportes Registrados</h4>
                </div>
                <div class="card-body" style="max-height: 600px; overflow-y: auto;">
                    <div id="lista-reportes">
                        <p class="text-center text-muted">Cargando reportes...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Función para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    // Cargar reportes al iniciar la página
    document.addEventListener('DOMContentLoaded', function() {
        cargarReportes();
    });

    // Función para cargar y renderizar reportes
    function cargarReportes() {
        fetch('/obtener-reportes/')
            .then(response => response.json())
            .then(data => {
                const listaReportes = document.getElementById('lista-reportes');

                if (data.length === 0) {
                    listaReportes.innerHTML = '<p class="text-center text-muted">No hay reportes registrados</p>';
                    return;
                }

                let html = '';
                data.forEach(reporte => {
                    // Determinar color según el tipo de error
                    let bgColor = 'bg-light';
                    const tipoError = reporte.tipo_error.toString();

                    if (tipoError.startsWith('4')) {
                        bgColor = 'bg-warning'; // Amarillo para errores 400
                    } else if (tipoError.startsWith('5')) {
                        bgColor = 'bg-danger text-white'; // Rojo para errores 500
                    }

                    const fecha = new Date(reporte.fecha_reporte).toLocaleString('es-ES');

                    html += `
                        <div class="card mb-3 ${bgColor}">
                            <div class="card-body">
                                <h5 class="card-title">${reporte.titulo}</h5>
                                <p class="card-text">${reporte.descripcion}</p>
                                <div class="row">
                                    <div class="col-6">
                                        <strong>Tipo:</strong> ${reporte.tipo_error}<br>
                                        <strong>Método:</strong> ${reporte.metodo_http}
                                    </div>
                                    <div class="col-6">
                                        <strong>IP:</strong> ${reporte.ip_cliente || 'N/A'}<br>
                                        <strong>Fecha:</strong> ${fecha}
                                    </div>
                                </div>
                                <p class="mb-0 mt-2"><strong>URL:</strong> <a href="${reporte.url}" target="_blank" class="text-decoration-none">${reporte.url}</a></p>
                            </div>
                        </div>
                    `;
                });

                listaReportes.innerHTML = html;
            })
            .catch(error => {
                console.error('Error al cargar reportes:', error);
                document.getElementById('lista-reportes').innerHTML =
                    '<p class="text-danger text-center">Error al cargar los reportes</p>';
            });
    }

    // Manejar el envío del formulario con JavaScript
    document.getElementById('form-reporte').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir el envío tradicional

        // Limpiar mensajes de error previos
        document.querySelectorAll('.error-field').forEach(field => {
            field.innerHTML = '';
            field.style.display = 'none';
        });
        document.getElementById('mensaje-area').innerHTML = '';

        // Obtener datos del formulario
        const formData = new FormData(this);

        // Enviar datos usando fetch
        fetch('/reportes-error/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                // Mostrar mensaje de éxito
                document.getElementById('mensaje-area').innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>¡Éxito!</strong> ${data.mensaje}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                // Limpiar el formulario
                document.getElementById('form-reporte').reset();

                // Recargar la lista de reportes
                cargarReportes();

            } else if (data.status === 'error') {
                // Mostrar mensaje de error general
                document.getElementById('mensaje-area').innerHTML = `
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Error:</strong> ${data.mensaje}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                // Mostrar errores específicos de cada campo
                if (data.errors) {
                    for (const [field, errors] of Object.entries(data.errors)) {
                        const errorDiv = document.getElementById(`error-${field}`);
                        if (errorDiv) {
                            errorDiv.innerHTML = `<small class="text-danger">${errors.join(', ')}</small>`;
                            errorDiv.style.display = 'block';
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('mensaje-area').innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error:</strong> Ocurrió un error al procesar la solicitud
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        });
    });
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<style>
    .error-field {
        display: none;
        margin-top: 5px;
    }

    .card {
        transition: transform 0.2s;
    }

    .card:hover {
        transform: translateY(-5px);
    }
</style>

{% endblock %}
```

**Características del template:**
1. **Extiende base.html** usando `{% extends 'base.html' %}`
2. **Bootstrap 5.3** para estilos
3. **Formulario con JavaScript:**
   - Previene submit tradicional con `e.preventDefault()`
   - Envía datos con `fetch` y `FormData`
   - Incluye token CSRF en headers
4. **Carga dinámica de reportes:**
   - Función `cargarReportes()` que hace fetch a `/obtener-reportes/`
   - Se ejecuta al cargar la página (`DOMContentLoaded`)
5. **Colores dinámicos:**
   - Errores 4xx → `bg-warning` (amarillo)
   - Errores 5xx → `bg-danger text-white` (rojo)
6. **Manejo de respuestas:**
   - `status === 'ok'` → Muestra alerta de éxito, limpia formulario, recarga reportes
   - `status === 'error'` → Muestra alerta de error y errores específicos por campo

---

### **PASO 8: Ejecutar migraciones**

#### Comandos ejecutados:

1. **Crear archivos de migración:**
```bash
python manage.py makemigrations
```

**Salida:**
```
Migrations for 'error_reports':
  error_reports\migrations\0001_initial.py
    + Create model ErrorReport
```

2. **Aplicar migraciones:**
```bash
python manage.py migrate
```

**Salida:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, core, error_reports, sessions
Running migrations:
  Applying error_reports.0001_initial... OK
```

Esto crea la tabla `error_reports_errorreport` en la base de datos SQLite.

---

## 🔄 Flujo de Funcionamiento

### **1. Flujo de Registro de Reporte**

```
Usuario llena formulario
       ↓
Click en "Registrar Reporte"
       ↓
JavaScript captura el evento (e.preventDefault())
       ↓
Se obtiene FormData del formulario
       ↓
Fetch POST a /reportes-error/ con CSRF token
       ↓
Backend (views.reporte_error_view):
  - Valida el formulario
  - Si válido → Guarda en DB
  - Retorna JSONResponse
       ↓
JavaScript recibe respuesta:
  - Si status='ok':
    * Muestra alerta de éxito
    * Limpia formulario
    * Recarga lista de reportes
  - Si status='error':
    * Muestra alerta de error
    * Muestra errores por campo
```

### **2. Flujo de Visualización de Reportes**

```
Página carga (DOMContentLoaded)
       ↓
JavaScript ejecuta cargarReportes()
       ↓
Fetch GET a /obtener-reportes/
       ↓
Backend (views.obtener_reportes_view):
  - Consulta ErrorReport.objects.all()
  - Convierte a lista de diccionarios
  - Retorna JSONResponse
       ↓
JavaScript recibe array de reportes:
  - Itera sobre cada reporte
  - Determina color según tipo_error
  - Genera HTML dinámicamente
  - Actualiza #lista-reportes
```

### **3. Lógica de Colores**

```javascript
const tipoError = reporte.tipo_error.toString();

if (tipoError.startsWith('4')) {
    bgColor = 'bg-warning'; // Amarillo (400, 401, 403, 404, etc.)
} else if (tipoError.startsWith('5')) {
    bgColor = 'bg-danger text-white'; // Rojo (500, 502, 503, etc.)
}
```

---

## 🧪 Instrucciones para Probar

### **1. Iniciar el servidor de desarrollo**

```bash
python manage.py runserver
```

### **2. Abrir en el navegador**

```
http://127.0.0.1:8000/reportes-error/
```

### **3. Probar el registro de reportes**

#### **Caso de prueba 1: Error 404**
- **Título:** Página no encontrada
- **Descripción:** El usuario intentó acceder a /productos/123 pero no existe
- **Tipo de Error:** 404
- **URL:** https://ejemplo.com/productos/123
- **Método HTTP:** GET
- **IP Cliente:** 192.168.1.100

**Resultado esperado:** Card con fondo **amarillo**

#### **Caso de prueba 2: Error 500**
- **Título:** Error interno del servidor
- **Descripción:** Fallo en la base de datos al procesar pedido
- **Tipo de Error:** 500
- **URL:** https://ejemplo.com/checkout
- **Método HTTP:** POST
- **IP Cliente:** (dejar vacío)

**Resultado esperado:** Card con fondo **rojo**

#### **Caso de prueba 3: Validación (debe fallar)**
- **Título:** (dejar vacío)
- **Descripción:** Descripción de prueba
- **Tipo de Error:** 403
- **URL:** url-invalida (sin https://)
- **Método HTTP:** GET

**Resultado esperado:**
- Mensaje de error general
- Errores específicos en campos "título" y "url"

### **4. Verificar la API JSON**

Abrir en el navegador o usar curl:
```
http://127.0.0.1:8000/obtener-reportes/
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "titulo": "Página no encontrada",
    "descripcion": "El usuario intentó acceder a /productos/123 pero no existe",
    "tipo_error": "404",
    "url": "https://ejemplo.com/productos/123",
    "metodo_http": "GET",
    "ip_cliente": "192.168.1.100",
    "fecha_reporte": "2026-02-15T...",
    "activo": true
  },
  ...
]
```

### **5. Verificar en el admin de Django** (opcional)

1. Crear superusuario:
```bash
python manage.py createsuperuser
```

2. Acceder a:
```
http://127.0.0.1:8000/admin/
```

3. Verificar que aparece "Reportes de Errores" y se pueden ver/editar

---

## 📁 Estructura Final del Proyecto

```
testing/
├── core/
│   └── ...
├── error_reports/                    # ← Nueva aplicación
│   ├── migrations/
│   │   ├── __init__.py
│   │   └── 0001_initial.py          # Migración del modelo
│   ├── templates/
│   │   └── error_reports/
│   │       └── reporte_error.html   # Template principal
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py                     # Formulario ErrorReportForm
│   ├── models.py                    # Modelo ErrorReport
│   ├── urls.py                      # URLs de la app
│   ├── views.py                     # Vistas
│   └── tests.py
├── testing/
│   ├── settings.py                  # Modificado (INSTALLED_APPS)
│   ├── urls.py                      # Modificado (include)
│   └── ...
├── templates/
│   └── base.html
├── db.sqlite3
├── manage.py
└── SISTEMA_REPORTES_ERRORES.md      # ← Este archivo
```

---

## 🔧 Tecnologías Utilizadas

- **Backend:** Django 6.0.1
- **Frontend:** Bootstrap 5.3, JavaScript (Vanilla)
- **Base de datos:** SQLite
- **Comunicación:** Fetch API, JSON

---

## ✅ Checklist de Requisitos Cumplidos

- [x] Aplicación `error_reports` creada y registrada
- [x] Modelo `ErrorReport` con todos los campos solicitados
- [x] Formulario `ErrorReportForm` excluyendo `fecha_reporte` y `activo`
- [x] Vista GET que renderiza `reporte_error.html` con formulario
- [x] Vista POST que valida y retorna JSONResponse según resultado
- [x] Vista para obtener todos los reportes en JSON
- [x] URLs registradas: `/reportes-error/` y `/obtener-reportes/`
- [x] Template extiende `base.html`
- [x] Bootstrap implementado
- [x] Renderizado dinámico de reportes con fetch
- [x] Colores dinámicos (400→amarillo, 500→rojo)
- [x] Formulario con envío JavaScript (sin submit tradicional)
- [x] Manejo de respuestas JSON (éxito y error)
- [x] Migraciones ejecutadas correctamente

---

## 🎓 Conceptos Clave Aprendidos

1. **ModelForm:** Crear formularios basados en modelos automáticamente
2. **JsonResponse:** Retornar datos JSON desde Django
3. **Fetch API:** Realizar peticiones HTTP asíncronas con JavaScript
4. **CSRF Token:** Seguridad en formularios Django con JavaScript
5. **FormData:** Enviar datos de formularios mediante AJAX
6. **Event.preventDefault():** Prevenir comportamiento por defecto del navegador
7. **Template Inheritance:** Extender templates base en Django
8. **ORM Queries:** `.objects.all()`, `.values()` para consultas
9. **Dynamic Styling:** Aplicar estilos dinámicos según datos del backend
10. **Error Handling:** Manejo de errores de validación tanto en backend como frontend

---

## 📞 Soporte

Si encuentras algún problema, verifica:
1. El servidor de desarrollo está corriendo
2. Las migraciones fueron aplicadas
3. La consola del navegador (F12) para errores de JavaScript
4. Los logs del servidor Django para errores de backend

---

**Proyecto completado exitosamente ✅**

*Desarrollado con Django + JavaScript + Bootstrap*
