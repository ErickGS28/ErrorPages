# Cambios en el backend para el frontend React

## Contexto

El backend `biblioteca_drf` ya tenía un CRUD completo funcionando con Django REST Framework. Para que el frontend React (corriendo en `http://localhost:5173`) pudiera hacer peticiones HTTP al backend (corriendo en `http://localhost:8000`), fue necesario configurar **CORS**.

---

## ¿Qué es CORS y por qué es necesario?

**CORS** (Cross-Origin Resource Sharing) es un mecanismo de seguridad del navegador. Cuando un script en `http://localhost:5173` intenta hacer una petición a `http://localhost:8000`, el navegador bloquea la respuesta porque los dos orígenes son **distintos** (diferente puerto = diferente origen).

Sin CORS configurado:
- El backend recibe y procesa la petición normalmente
- Pero el **navegador rechaza la respuesta** antes de que el código JavaScript la vea
- El error en consola sería: `Access to XMLHttpRequest has been blocked by CORS policy`

Django por defecto **no incluye** los headers de CORS. Hay que agregarlos explícitamente.

---

## Cambios realizados

### 1. Instalación de `django-cors-headers`

```bash
pip install django-cors-headers
```

Este paquete agrega los headers HTTP necesarios (`Access-Control-Allow-Origin`, etc.) a las respuestas de Django, permitiendo al navegador aceptarlas desde otros orígenes.

---

### 2. Cambios en `testing/settings.py`

#### a) INSTALLED_APPS — agregar `corsheaders`

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',          # <-- AGREGADO
    'core',
    'error_reports',
    'biblioteca',
    'biblioteca_drf',
]
```

**Por qué:** Django necesita saber que la app `corsheaders` existe para cargar su middleware.

---

#### b) MIDDLEWARE — agregar `CorsMiddleware` al inicio

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',    # <-- AGREGADO (debe ir antes de CommonMiddleware)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]
```

**Por qué va primero (casi):** El middleware de Django se ejecuta en orden. `CorsMiddleware` debe procesar la petición **antes** que `CommonMiddleware` para poder agregar los headers de CORS a la respuesta. Si va después, algunas peticiones de tipo `OPTIONS` (preflight) podrían no recibir los headers correctos.

---

#### c) CORS_ALLOWED_ORIGINS — definir orígenes permitidos

```python
# Al final de settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",    # Vite dev server (localhost)
    "http://127.0.0.1:5173",   # Vite dev server (127.0.0.1)
]
```

**Por qué estos dos?** El navegador puede resolver el frontend como `localhost` o como `127.0.0.1`. Aunque son equivalentes en la práctica, para CORS son **orígenes distintos**, así que se permiten ambos.

**¿Por qué no `CORS_ALLOW_ALL_ORIGINS = True`?** Porque permitir todos los orígenes es un riesgo de seguridad. En desarrollo con `CORS_ALLOWED_ORIGINS` ya es suficiente y más correcto.

---

## Resumen de archivos modificados

| Archivo | Qué se cambió |
|---|---|
| `testing/settings.py` | `corsheaders` en `INSTALLED_APPS`, `CorsMiddleware` en `MIDDLEWARE`, `CORS_ALLOWED_ORIGINS` al final |

No se modificó ningún archivo de `biblioteca_drf` (models, views, serializers, urls) porque la API ya funcionaba correctamente. Solo se necesitaba habilitar CORS a nivel del proyecto Django.

---

## Cómo verificar que funciona

1. Iniciar el backend: `python manage.py runserver`
2. Iniciar el frontend: `npm run dev` dentro de `biblioteca-front/`
3. Abrir `http://localhost:5173` en el navegador
4. La tabla de libros debe cargar sin errores de CORS en la consola

Si hay errores de CORS, verificar:
- Que `corsheaders` esté instalado (`pip show django-cors-headers`)
- Que `CorsMiddleware` esté en `MIDDLEWARE` y antes de `CommonMiddleware`
- Que `CORS_ALLOWED_ORIGINS` incluya exactamente el origen del frontend (con protocolo y puerto)
