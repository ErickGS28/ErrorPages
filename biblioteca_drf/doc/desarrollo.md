# Desarrollo de biblioteca_drf — CRUD con Django REST Framework y MySQL

Guía paso a paso para replicar esta app desde cero.

---

## Requisitos previos

- Python instalado con entorno virtual activo
- Django instalado en el proyecto
- MySQL corriendo en `localhost:3306`

---

## Paso 1 — Instalar dependencias

```bash
pip install djangorestframework
pip install mysqlclient
```

- **djangorestframework**: provee serializers, ViewSets y routers para construir APIs REST.
- **mysqlclient**: conector para que Django pueda hablar con MySQL.

---

## Paso 2 — Crear la base de datos y el usuario en MySQL

Abre MySQL (desde terminal o Workbench) con el usuario root y ejecuta:

```sql
CREATE DATABASE biblioteca_drf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'biblioteca_user'@'localhost' IDENTIFIED BY 'biblioteca_pass';

GRANT ALL PRIVILEGES ON biblioteca_drf.* TO 'biblioteca_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## Paso 3 — Configurar settings.py

En `testing/settings.py` hacer dos cambios:

### 3.1 — Agregar apps a INSTALLED_APPS

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',    # <-- agregar DRF
    'core',
    'error_reports',
    'biblioteca',
    'biblioteca_drf',    # <-- agregar la nueva app
]
```

### 3.2 — Cambiar la base de datos default a MySQL

Reemplazar el bloque `DATABASES` completo:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'biblioteca_drf',
        'USER': 'biblioteca_user',
        'PASSWORD': 'biblioteca_pass',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

> MySQL queda como la base de datos por defecto del proyecto. Todo el proyecto (todas las apps) usará MySQL a partir de este punto.

---

## Paso 4 — Crear la app Django

```bash
python manage.py startapp biblioteca_drf
```

Esto genera la estructura base. Además hay que crear manualmente:
- `serializers.py`
- `urls.py`
- `doc/`

---

## Paso 5 — Definir el modelo (models.py)

`biblioteca_drf/models.py`:

```python
from django.db import models


class Libro(models.Model):
    titulo    = models.CharField(max_length=200)
    autor     = models.CharField(max_length=200)
    isbn      = models.CharField(max_length=20)
    paginas   = models.PositiveIntegerField()
    editorial = models.CharField(max_length=200)
    prestado  = models.BooleanField(default=False)

    def prestar(self):
        self.prestado = True
        self.save()

    def devolver(self):
        self.prestado = False
        self.save()

    def __str__(self):
        return f"{self.titulo} ({self.autor})"
```

---

## Paso 6 — Crear el Serializer (serializers.py)

Crear el archivo `biblioteca_drf/serializers.py`:

```python
from rest_framework import serializers
from .models import Libro


class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = '__all__'
```

El serializer convierte instancias del modelo `Libro` a JSON y viceversa, y valida los datos automáticamente.

---

## Paso 7 — Crear el ViewSet (views.py)

`biblioteca_drf/views.py`:

```python
from rest_framework import viewsets
from .models import Libro
from .serializers import LibroSerializer


class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
```

`ModelViewSet` genera automáticamente los 6 métodos del CRUD:

| Método HTTP | Acción           | URL                     |
|-------------|------------------|-------------------------|
| GET         | Listar todos     | `/biblioteca-drf/api/libros/`      |
| POST        | Crear            | `/biblioteca-drf/api/libros/`      |
| GET         | Obtener uno      | `/biblioteca-drf/api/libros/{id}/` |
| PUT         | Actualizar total | `/biblioteca-drf/api/libros/{id}/` |
| PATCH       | Actualizar parcial | `/biblioteca-drf/api/libros/{id}/` |
| DELETE      | Eliminar         | `/biblioteca-drf/api/libros/{id}/` |

---

## Paso 8 — Configurar las URLs (urls.py)

Crear `biblioteca_drf/urls.py`:

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

El `DefaultRouter` genera todas las rutas automáticamente y además expone una **API navegable** en `/biblioteca-drf/api/`.

---

## Paso 9 — Registrar las URLs en el proyecto

En `testing/urls.py` agregar:

```python
path('biblioteca-drf/', include('biblioteca_drf.urls')),
```

Resultado final de `testing/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from core import views as core_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', core_views.index, name='index'),
    path('contacto/', core_views.contacto_view, name='contacto'),
    path('', include('error_reports.urls')),
    path('', include('biblioteca.urls')),
    path('biblioteca-drf/', include('biblioteca_drf.urls')),  # <-- agregar
]
```

---

## Paso 10 — Ejecutar migraciones

```bash
python manage.py makemigrations biblioteca_drf
python manage.py migrate
```

Esto crea todas las tablas necesarias en MySQL (incluyendo las tablas internas de Django como auth, sessions, etc.).

---

## Paso 11 — Verificar

Iniciar el servidor:

```bash
python manage.py runserver
```

Abrir en el navegador:

```
http://127.0.0.1:8000/biblioteca-drf/api/
```

DRF muestra una interfaz navegable. Desde ahí o desde Postman se pueden probar todos los endpoints.

**Ejemplos con Postman:**

```
# Listar libros
GET http://127.0.0.1:8000/biblioteca-drf/api/libros/

# Crear libro (form-data o JSON)
POST http://127.0.0.1:8000/biblioteca-drf/api/libros/

# Ver libro
GET http://127.0.0.1:8000/biblioteca-drf/api/libros/1/

# Actualizar libro
PUT http://127.0.0.1:8000/biblioteca-drf/api/libros/1/

# Actualizar campo suelto
PATCH http://127.0.0.1:8000/biblioteca-drf/api/libros/1/

# Eliminar libro
DELETE http://127.0.0.1:8000/biblioteca-drf/api/libros/1/
```

---

## Estructura final de la app

```
biblioteca_drf/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── tests.py
├── migrations/
│   └── __init__.py
└── doc/
    ├── desarrollo.md
    └── cambios.md
```
