# Cambios respecto a la versión anterior (biblioteca → biblioteca_drf)

Comparación archivo por archivo entre la implementación artesanal (`biblioteca`) y la nueva con Django REST Framework (`biblioteca_drf`).

---

## Resumen general

| Aspecto             | `biblioteca` (original)        | `biblioteca_drf` (nuevo)              |
|---------------------|--------------------------------|---------------------------------------|
| Framework API       | Django puro (manual)           | Django REST Framework                 |
| Base de datos       | SQLite                         | MySQL                                 |
| Serialización       | `.values()` / `json.loads()`   | `ModelSerializer`                     |
| Vistas              | Funciones con `@csrf_exempt`   | Clase `ModelViewSet`                  |
| Rutas               | 4 rutas definidas a mano       | Generadas automáticamente por Router  |
| Protección CSRF     | Desactivada con decorador      | Manejada por DRF                      |
| Soporte PATCH       | No                             | Sí                                    |
| API navegable       | No                             | Sí (interfaz web de DRF)              |
| Archivo serializer  | No existe                      | `serializers.py`                      |

---

## views.py

### Antes — `biblioteca/views.py`

```python
import json
from django.http import JsonResponse, QueryDict
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Libro

def api_lista_libros(request):
    libros = Libro.objects.all().values()
    return JsonResponse(list(libros), safe=False)

@csrf_exempt
def api_crear_libro(request):
    if request.method == 'POST':
        titulo    = request.POST.get('titulo')
        autor     = request.POST.get('autor')
        isbn      = request.POST.get('isbn')
        paginas   = request.POST.get('paginas')
        editorial = request.POST.get('editorial')
        libro = Libro.objects.create(
            titulo=titulo, autor=autor, isbn=isbn,
            paginas=paginas, editorial=editorial
        )
        return JsonResponse({'mensaje': 'Libro registrado exitosamente', 'id': libro.id}, status=201)

@csrf_exempt
def api_editar_libro(request, pk):
    libro = get_object_or_404(Libro, pk=pk)
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            data = QueryDict(request.body)
        libro.titulo    = data.get('titulo', libro.titulo)
        libro.autor     = data.get('autor', libro.autor)
        libro.isbn      = data.get('isbn', libro.isbn)
        libro.paginas   = data.get('paginas', libro.paginas)
        libro.editorial = data.get('editorial', libro.editorial)
        libro.save()
        return JsonResponse({'mensaje': 'Libro actualizado exitosamente'}, status=200)

@csrf_exempt
def api_eliminar_libro(request, pk):
    if request.method == 'DELETE':
        libro = get_object_or_404(Libro, pk=pk)
        libro.delete()
        return JsonResponse({}, status=204)
```

### Después — `biblioteca_drf/views.py`

```python
from rest_framework import viewsets
from .models import Libro
from .serializers import LibroSerializer


class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
```

**Diferencias:**
- De ~50 líneas a 3 líneas de lógica.
- Una sola clase reemplaza las 4 funciones.
- Sin `@csrf_exempt`: DRF gestiona la seguridad correctamente.
- Sin parseo manual de JSON ni QueryDict: el serializer lo hace.
- Sin validación manual: el serializer valida automáticamente.
- Soporta PATCH (actualización parcial) sin código extra.

---

## urls.py

### Antes — `biblioteca/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('libros/',                   views.api_lista_libros,   name='lista_libros'),
    path('libros/nuevo/',             views.api_crear_libro,    name='crear_libro'),
    path('libros/editar/<int:pk>/',   views.api_editar_libro,   name='editar_libro'),
    path('libros/eliminar/<int:pk>/', views.api_eliminar_libro, name='eliminar_libro'),
]
```

### Después — `biblioteca_drf/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LibroViewSet

router = DefaultRouter()
router.register(r'libros', LibroViewSet, basename='libro')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

**Diferencias:**
- No se escriben rutas individuales: el `DefaultRouter` las genera todas.
- Las operaciones se distinguen por **método HTTP**, no por URL (convención REST).
- La URL `/libros/nuevo/` desaparece — POST a `/api/libros/` crea el recurso.
- La URL `/libros/eliminar/<pk>/` desaparece — DELETE a `/api/libros/{id}/` elimina.
- Se añade PATCH sin escribir nada.
- Se añade una API root navegable en `/biblioteca-drf/api/`.

---

## serializers.py

### Antes — `biblioteca/`

Este archivo **no existía**. La serialización era manual en cada vista:

```python
# Leer
libros = Libro.objects.all().values()
return JsonResponse(list(libros), safe=False)

# Escribir (POST)
titulo = request.POST.get('titulo')
...
Libro.objects.create(titulo=titulo, ...)

# Escribir (PUT) — con doble parseo
try:
    data = json.loads(request.body)
except Exception:
    data = QueryDict(request.body)
```

### Después — `biblioteca_drf/serializers.py`

```python
from rest_framework import serializers
from .models import Libro


class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = '__all__'
```

**Diferencias:**
- Archivo nuevo que centraliza toda la lógica de conversión de datos.
- `ModelSerializer` genera los campos automáticamente desde el modelo.
- Valida tipos, longitudes y campos requeridos antes de tocar la BD.
- `fields = '__all__'` expone todos los campos; se puede restringir con una lista.
- Un solo serializer sirve para todas las operaciones (GET, POST, PUT, PATCH).
- Si el modelo cambia, el serializer se actualiza solo.

---

## settings.py

### Antes

```python
INSTALLED_APPS = [
    ...
    'core',
    'error_reports',
    'biblioteca',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Después

```python
INSTALLED_APPS = [
    ...
    'rest_framework',    # <-- AGREGADO
    'core',
    'error_reports',
    'biblioteca',
    'biblioteca_drf',    # <-- AGREGADO
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',   # <-- CAMBIADO
        'NAME': 'biblioteca_drf',
        'USER': 'biblioteca_user',
        'PASSWORD': 'biblioteca_pass',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

**Diferencias:**
- Se agrega `'rest_framework'` para activar DRF.
- Se agrega `'biblioteca_drf'` para que Django reconozca la nueva app.
- El motor de base de datos cambia de **SQLite a MySQL**.
- Ya no hay dos entradas en DATABASES — MySQL es la única base de datos (`'default'`), igual que en el ejemplo de referencia `IntegradoraTest`.
- Al ser `'default'`, todo el proyecto usa MySQL sin necesidad de `.using()` ni routers.

---

## Diagrama comparativo de flujo

### Antes (artesanal)

```
HTTP Request
    │
    ▼
urls.py ──► función específica
                │
                ├── parsea request.POST / json.loads / QueryDict manualmente
                ├── llama a Libro.objects.create/save/delete directamente
                └── retorna JsonResponse construido a mano
```

### Después (DRF)

```
HTTP Request
    │
    ▼
urls.py (DefaultRouter) ──► LibroViewSet
                                  │
                                  ▼
                            LibroSerializer
                                  │
                                  ├── valida datos automáticamente
                                  ├── convierte JSON ↔ modelo
                                  └── llama al ORM
                                  │
                                  ▼
                            Response (JSON generado por DRF)
```
