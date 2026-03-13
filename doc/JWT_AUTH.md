# Autenticación JWT en el Proyecto Biblioteca

## ¿Qué es JWT y por qué lo usamos?

JWT (JSON Web Token) es un estándar para transmitir información de identidad de forma segura entre el frontend y el backend. La librería utilizada es **djangorestframework-simplejwt**.

Maneja dos tipos de tokens:

- **Access Token**: Vida corta (15 minutos). Es el que React envía en cada petición a la API en el header `Authorization: Bearer <token>`.
- **Refresh Token**: Vida larga (1 día). Solo se usa para obtener un nuevo Access Token cuando el anterior expira, sin que el usuario tenga que volver a iniciar sesión.

---

## Archivos modificados y creados

### Backend (Django)

#### `testing/settings.py`
Se agregaron tres bloques:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}
```
Esto hace que **todas** las rutas de la API requieran un token válido por defecto. El `LibroViewSet` queda protegido automáticamente sin cambiar su código.

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,      # Cada refresh genera un nuevo refresh token
    'BLACKLIST_AFTER_ROTATION': True,   # El refresh token viejo queda invalidado
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

```python
AUTH_USER_MODEL = 'usuarios.MiUsuario'
```
Le dice a Django que reemplace su modelo de usuario por defecto con el modelo personalizado de la app `usuarios`.

---

#### `testing/urls.py`
Se agregaron tres endpoints de autenticación:

| Método | URL | Qué hace |
|--------|-----|----------|
| `POST` | `/api/login/` | Recibe `email` + `password`, devuelve `access` + `refresh` tokens |
| `POST` | `/api/token/refresh/` | Recibe `refresh` token, devuelve nuevo `access` token |
| `POST` | `/api/registro/` | Crea un nuevo usuario con contraseña encriptada |

`TokenObtainPairView` y `TokenRefreshView` son vistas incluidas en simplejwt, no hay que escribirlas.

---

#### `usuarios/models.py` — Modelo personalizado de usuario

Se creó la app `usuarios` con un modelo `MiUsuario` que extiende `AbstractBaseUser` + `PermissionsMixin`.

**¿Por qué un modelo personalizado?**
El usuario de Django por defecto usa `username` para el login. Aquí usamos `email`.

```python
class MiUsuario(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)   # Campo de login
    nombre_completo = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']
```

`MiUsuarioManager` define cómo crear usuarios. El método `create_user` llama a `set_password()` que **encripta la contraseña** antes de guardarla en la base de datos.

> **Importante:** Este cambio requiere hacer las migraciones desde cero (`python manage.py makemigrations` + `python manage.py migrate`) porque Django vincula muchas tablas internas al modelo de usuario en la primera migración.

---

#### `usuarios/serializers.py`

```python
User = get_user_model()  # Obtiene MiUsuario dinámicamente desde settings.py

class RegistroSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'nombre_completo', 'password', 'telefono')
        extra_kwargs = {'password': {'write_only': True}}  # El password nunca se devuelve en respuestas

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)  # Encripta el password via el Manager
        return user
```

Se usa `get_user_model()` en vez de importar `MiUsuario` directamente — es la práctica recomendada por Django para modelos de usuario intercambiables.

---

#### `usuarios/views.py`

```python
class RegistroView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # Endpoint público — no requiere token
    serializer_class = RegistroSerializer
```

`AllowAny` sobreescribe el `IsAuthenticated` global solo para esta vista, permitiendo que usuarios no autenticados puedan registrarse.

---

### Manejo de Secretos — `python-decouple`

Para no subir contraseñas ni el `SECRET_KEY` a Git, se usó la librería **python-decouple**.

**Archivos involucrados:**

| Archivo | Se sube a Git | Descripción |
|---------|--------------|-------------|
| `.env` | ❌ NO | Contiene los valores reales (SECRET_KEY, DB_PASSWORD, etc.) |
| `.env.example` | ✅ SÍ | Plantilla vacía para que otros desarrolladores sepan qué variables configurar |
| `.gitignore` | ✅ SÍ | Incluye `.env` para que Git lo ignore |

En `settings.py` los valores hardcodeados se reemplazaron por:
```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
# Y en DATABASES:
'NAME': config('DB_NAME'),
'USER': config('DB_USER'),
'PASSWORD': config('DB_PASSWORD'),
```

---

### Frontend (React)

#### `services/api.js` — Instancia de Axios con interceptores

Se reemplazó el `axios` directo por una **instancia configurada**:

```js
const api = axios.create({ baseURL: 'http://localhost:8000' });
```

**Interceptor de solicitud:** antes de cada petición, agrega automáticamente el token del localStorage al header:
```js
config.headers['Authorization'] = `Bearer ${token}`;
```

**Interceptor de respuesta:** cuando el servidor devuelve un `401 Unauthorized` (token expirado):
1. Usa el `refresh_token` del localStorage para pedir un nuevo `access_token` a `/api/token/refresh/`
2. Guarda el nuevo token en localStorage
3. Reintenta la petición original con el nuevo token
4. Si el refresh también falla (expiró), limpia el localStorage y redirige al login

Todas las funciones CRUD (`read`, `create`, `update`, `deleteLibro`) ahora usan `api.get/post/put/delete` en vez de `axios.get/post/put/delete`, por lo que todas las peticiones pasan por los interceptores automáticamente.

---

#### `Login.jsx`

Usa **axios puro** (no la instancia `api`) para evitar que el interceptor de respuesta interfiera con un error 401 de credenciales incorrectas. Flujo:

1. `POST /api/login/` con `{ email, password }`
2. Guarda `access_token` y `refresh_token` en `localStorage`
3. Llama `onLoginSuccess()` → App.jsx cambia la pantalla a `LibrosApp`

---

#### `Register.jsx`

También usa **axios puro**. Flujo:

1. Valida en el frontend que las contraseñas coincidan
2. `POST /api/registro/` con `{ email, nombre_completo, password, telefono }`
3. Si hay errores del backend (ej. email duplicado), los muestra como toasts
4. En éxito llama `onRegisterSuccess()` → App.jsx regresa al login

---

#### `App.jsx` — Control de autenticación

Maneja dos estados:
- `isAuthenticated`: si hay `access_token` en localStorage
- `showRegister`: si mostrar el formulario de registro

Renderizado condicional:
```
¿Autenticado?  → LibrosApp (con botón logout)
¿showRegister? → Register
Por defecto    → Login
```

Al hacer logout, borra `access_token` y `refresh_token` del localStorage y regresa al Login.

---

#### `LibrosApp.jsx`

Recibe la prop `onLogout` desde `App.jsx` y la conecta al botón "Cerrar Sesión" en el encabezado.

---

## Flujo completo resumido

```
1. Usuario abre la app
   └─ App.jsx revisa localStorage → sin token → muestra Login

2. Usuario inicia sesión
   └─ Login → POST /api/login/ → guarda access + refresh en localStorage
   └─ App.jsx → isAuthenticated = true → muestra LibrosApp

3. Usuario hace operaciones CRUD
   └─ api.js interceptor agrega "Authorization: Bearer <access_token>" a cada petición
   └─ Django valida el token → permite o rechaza

4. Token expira (15 min)
   └─ Django devuelve 401
   └─ Interceptor de respuesta toma el refresh_token → POST /api/token/refresh/
   └─ Guarda nuevo access_token → reintenta la petición original → transparente para el usuario

5. Refresh token expira (1 día sin actividad)
   └─ Interceptor no puede renovar → limpia localStorage → redirige al login

6. Usuario cierra sesión manualmente
   └─ handleLogout() → borra tokens de localStorage → App.jsx muestra Login
```

---

## Comandos para arrancar

```bash
# Backend — instalar dependencias
pip install -r requirements.txt

# Crear migraciones (primera vez o tras cambiar AUTH_USER_MODEL)
python manage.py makemigrations usuarios
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Correr servidor
python manage.py runserver
```

```bash
# Frontend
cd biblioteca-front
npm install
npm run dev
```
