# Integración de JWT en Django DRF





Para lograr proteger la API y manejar la expiración de tokens, la mejor herramienta en el ecosistema de Django es la librería *djangorestframework-simplejwt*. Esta librería maneja automáticamente dos tipos de tokens:



* Access Token (Token de acceso): Es de corta duración (ej. 5 a 15 minutos). Es el que React enviará en cada petición a la API.
* Refresh Token (Token de actualización): Es de larga duración (ej. 1 a 14 días). Se usa exclusivamente para obtener un nuevo Access Token cuando el anterior expira, evitando que el usuario tenga que iniciar sesión a cada rato si se mantiene activo.



1. ##### Primero instala la librería:



pip install djangorestframework-simplejwt





##### 2\. Configuración en settings.py



Debes decirle a DRF que use JWT como su método de autenticación por defecto y configurar los tiempos de expiración para cumplir con requerimientos de seguridad.



Agrega o modifica lo siguiente en tu archivo settings.py:



from datetime import timedelta



REST\_FRAMEWORK = {

&nbsp;   'DEFAULT\_AUTHENTICATION\_CLASSES': (

&nbsp;       'rest\_framework\_simplejwt.authentication.JWTAuthentication',

&nbsp;   ),

&nbsp;   'DEFAULT\_PERMISSION\_CLASSES': (

&nbsp;       'rest\_framework.permissions.IsAuthenticated',

&nbsp;   )

}



SIMPLE\_JWT = {

&nbsp;   'ACCESS\_TOKEN\_LIFETIME': timedelta(minutes=15), 

&nbsp;   'REFRESH\_TOKEN\_LIFETIME': timedelta(days=1),  

&nbsp;   'ROTATE\_REFRESH\_TOKENS': True, 

&nbsp;   'BLACKLIST\_AFTER\_ROTATION': True,    

&nbsp;   'ALGORITHM': 'HS256',

&nbsp;   'SIGNING\_KEY': SECRET\_KEY,     

&nbsp;   'AUTH\_HEADER\_TYPES': ('Bearer',),

&nbsp;   'USER\_ID\_FIELD': 'id',

&nbsp;   'USER\_ID\_CLAIM': 'user\_id',

}





##### 3\. Configurar los endpoints del login en urls.py



Necesitas crear las rutas para que tu frontend en React pueda enviar las credenciales y obtener los tokens.



En tu archivo urls.py principal (o el de tu aplicación de API):



from django.urls import path

from rest\_framework\_simplejwt.views import (

&nbsp;   TokenObtainPairView,

&nbsp;   TokenRefreshView,

)



urlpatterns = \[

&nbsp;   # ... tus otras rutas

&nbsp;   

&nbsp;   # Endpoint para iniciar sesión (recibe email y password, devuelve access y refresh tokens)

&nbsp;   path('api/login/', TokenObtainPairView.as\_view(), name='token\_obtain\_pair'),

&nbsp;   

&nbsp;   # Endpoint para refrescar el token (recibe el refresh token, devuelve un nuevo access token)

&nbsp;   path('api/token/refresh/', TokenRefreshView.as\_view(), name='token\_refresh'),

]







# Uso en React



¿Cómo lo usa el frontend (React)?

**Inicio de sesión:** React hace un POST a /api/login/ con {"email": "...", "password": "..."}.



**Guardado:** React recibe el access y el refresh token. (Normalmente se guardan en LocalStorage, SessionStorage o en un contexto de estado, aunque lo más seguro para ataques XSS es usar HttpOnly Cookies si tu backend y frontend comparten dominio).



**Consumo de la API:** En cada petición (usando fetch o axios), React debe enviar el token en los encabezados:



headers: {

&nbsp;   'Authorization': `Bearer ${accessToken}`

}



**Expiración:** Si la API devuelve un error 401 Unauthorized (porque pasaron los 15 minutos), React debe hacer automáticamente un POST a /api/token/refresh/ enviando el refresh token para obtener un nuevo access token y reintentar la petición original.



Para manejar el reciclado del token se debe configurar un interceptor con Axios que es la forma más limpia de manejar esto, ya que te evita tener que escribir la lógica de validación de tokens en cada una de tus llamadas a la API.



Un interceptor es básicamente un "espía" o un "filtro" que se coloca en medio de tu aplicación React y tu backend. Analiza cada petición que sale y cada respuesta que entra (se usa para validar cosas y para filtros de seguridad).



1. ##### Configurar el interceptor



En el archivo Api.js (donde tenemos las llamadas con Axios) Vamos a instanciar Axios y colocar nuestra lógica de interceptores, al mismo tiempo que mantenemos (con algunos cambios) la lógica de las mascotas:



import axios from 'axios';



// ==========================================

// 1. CONFIGURACIÓN DE LA INSTANCIA DE AXIOS

// ==========================================



// Creamos la instancia apuntando a la raíz de tu servidor

const api = axios.create({

&nbsp;   baseURL: 'http://localhost:8000'

});



// Interceptor de Solicitud (Agrega el token si existe)

api.interceptors.request.use(

&nbsp;   (config) => {

&nbsp;       const token = localStorage.getItem('access\_token');

&nbsp;       if (token) {

&nbsp;           config.headers\['Authorization'] = `Bearer ${token}`;

&nbsp;       }

&nbsp;       return config;

&nbsp;   },

&nbsp;   (error) => {

&nbsp;       return Promise.reject(error);

&nbsp;   }

);



// Interceptor de Respuesta (Maneja el error 401 y refresca el token)

api.interceptors.response.use(

&nbsp;   (response) => {

&nbsp;       return response;

&nbsp;   },

&nbsp;   async (error) => {

&nbsp;       const originalRequest = error.config;



&nbsp;       if (error.response \&\& error.response.status === 401 \&\& !originalRequest.\_retry) {

&nbsp;           originalRequest.\_retry = true;



&nbsp;           try {

&nbsp;               const refreshToken = localStorage.getItem('refresh\_token');

&nbsp;               

&nbsp;               // Usamos el axios global aquí para no disparar este mismo interceptor

&nbsp;               const response = await axios.post('http://localhost:8000/api/token/refresh/', {

&nbsp;                   refresh: refreshToken

&nbsp;               });



&nbsp;               localStorage.setItem('access\_token', response.data.access);

&nbsp;               originalRequest.headers\['Authorization'] = `Bearer ${response.data.access}`;

&nbsp;               

&nbsp;               return api(originalRequest);

&nbsp;           } catch (refreshError) {

&nbsp;               // Si el refresh token también expiró, limpiamos y mandamos al login

&nbsp;               localStorage.removeItem('access\_token');

&nbsp;               localStorage.removeItem('refresh\_token');

&nbsp;               window.location.href = '/login'; 

&nbsp;               return Promise.reject(refreshError);

&nbsp;           }

&nbsp;       }

&nbsp;       return Promise.reject(error);

&nbsp;   }

);



// ==========================================

// 2. FUNCIONES CRUD PARA MASCOTAS

// ==========================================



// Definimos la ruta específica para este grupo de funciones

const MASCOTAS\_URL = '/api/mascotas'; 



// 1. LISTAR (GET)

// Fíjate que ahora usamos "api.get" en lugar de "axios.get"

export const read = () => {

&nbsp;   return api.get(`${MASCOTAS\_URL}/`);

};



// 2. CREAR (POST)

export const create = (data) => {

&nbsp;   return api.post(`${MASCOTAS\_URL}/`, data);

};



// 3. ACTUALIZAR (PUT)

export const update = (id, data) => {

&nbsp;   return api.put(`${MASCOTAS\_URL}/${id}/`, data);

};



// 4. ELIMINAR (DELETE)

export const deleteM = (id) => {

&nbsp;   return api.delete(`${MASCOTAS\_URL}/${id}/`);

};



export default api;





Con este código anterior no se necesita hacer ningún cambio al componente de Mascotas, sin embargo si necesitaríamos implementar un login para meter los tokens en el localStorage.

##### 



##### 2\. Implementar un Login



Para implementar un login debemos usar OTRA instancia de axios ya que si usamos nuestra instancia api (la que configuramos en api.js) para hacer el login, y el usuario se equivoca en la contraseña, Django devolverá un 401 Unauthorized. Nuestro interceptor interceptaría ese 401, intentaría buscar un refresh token (que no existe), fallaría y haría un desastre.



Implementación de un login:



import { useState } from "react";

import axios from "axios"; // Importamos axios puro, no nuestra instancia 'api'

import toast, { Toaster } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";



export default function Login({ onLoginSuccess }) {

&nbsp; const \[formData, setFormData] = useState({

&nbsp;   email: "",

&nbsp;   password: "",

&nbsp; });

&nbsp; const \[cargando, setCargando] = useState(false);



&nbsp; const handleChange = (e) => {

&nbsp;   setFormData({

&nbsp;     ...formData,

&nbsp;     \[e.target.name]: e.target.value,

&nbsp;   });

&nbsp; };



&nbsp; const handleSubmit = async (e) => {

&nbsp;   e.preventDefault();

&nbsp;   setCargando(true);



&nbsp;   try {

&nbsp;     // Usamos axios puro para saltarnos los interceptores

&nbsp;     // Asegúrate de que esta URL coincida con tu urls.py en Django

&nbsp;     const response = await axios.post("http://localhost:8000/api/login/", formData);



&nbsp;     // Guardamos los tokens en el navegador

&nbsp;     localStorage.setItem("access\_token", response.data.access);

&nbsp;     localStorage.setItem("refresh\_token", response.data.refresh);



&nbsp;     toast.success("¡Bienvenido!");

&nbsp;     

&nbsp;     // Le avisamos a App.jsx que el login fue exitoso para que cambie la pantalla

&nbsp;     onLoginSuccess();

&nbsp;   } catch (error) {

&nbsp;     console.error("Error en login:", error);

&nbsp;     if (error.response \&\& error.response.status === 401) {

&nbsp;       toast.error("Usuario o contraseña incorrectos");

&nbsp;     } else {

&nbsp;       toast.error("Error al conectar con el servidor");

&nbsp;     }

&nbsp;   } finally {

&nbsp;     setCargando(false);

&nbsp;   }

&nbsp; };



&nbsp; return (

&nbsp;   <div className="container mt-5">

&nbsp;     <Toaster position="top-right" reverseOrder={false} />

&nbsp;     

&nbsp;     <div className="row justify-content-center">

&nbsp;       <div className="col-md-5">

&nbsp;         <div className="card shadow-sm mt-5">

&nbsp;           <div className="card-header bg-primary text-white text-center">

&nbsp;             <h4 className="mb-0">Iniciar Sesión</h4>

&nbsp;           </div>

&nbsp;           <div className="card-body p-4">

&nbsp;             <form onSubmit={handleSubmit}>

&nbsp;               <div className="mb-3">

&nbsp;                 <label className="form-label">Usuario</label>

&nbsp;                 <input

&nbsp;                   type="email"

&nbsp;                   name="email"

&nbsp;                   className="form-control"

&nbsp;                   value={formData.email}

&nbsp;                   onChange={handleChange}

&nbsp;                   required

&nbsp;                   disabled={cargando}

&nbsp;                 />

&nbsp;               </div>

&nbsp;               

&nbsp;               <div className="mb-4">

&nbsp;                 <label className="form-label">Contraseña</label>

&nbsp;                 <input

&nbsp;                   type="password"

&nbsp;                   name="password"

&nbsp;                   className="form-control"

&nbsp;                   value={formData.password}

&nbsp;                   onChange={handleChange}

&nbsp;                   required

&nbsp;                   disabled={cargando}

&nbsp;                 />

&nbsp;               </div>



&nbsp;               <div className="d-grid gap-2">

&nbsp;                 <button 

&nbsp;                   type="submit" 

&nbsp;                   className="btn btn-primary btn-lg"

&nbsp;                   disabled={cargando}

&nbsp;                 >

&nbsp;                   {cargando ? (

&nbsp;                     <>

&nbsp;                       <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>

&nbsp;                       Ingresando...

&nbsp;                     </>

&nbsp;                   ) : (

&nbsp;                     "Entrar al Sistema"

&nbsp;                   )}

&nbsp;                 </button>

&nbsp;               </div>

&nbsp;             </form>

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       </div>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}







En nuestro ejemplo de mascotas vamos a comenzar a mostrar el Login siempre primero antes de la vista principal de mascotas y manejando estados para saber en todo momento si existen los tokens guardados, esto el App.jsx:



import { useState, useEffect } from 'react';

import MascotasApp from './MascotasApp';

import Login from './Login';



function App() {

&nbsp; // Estado para controlar qué pantalla mostrar

&nbsp; const \[isAuthenticated, setIsAuthenticated] = useState(false);



&nbsp; useEffect(() => {

&nbsp;   // Al cargar la app, revisamos si ya hay un token

&nbsp;   const token = localStorage.getItem('access\_token');

&nbsp;   if (token) {

&nbsp;     setIsAuthenticated(true);

&nbsp;   }

&nbsp; }, \[]);



&nbsp; // Función que le pasamos al Login para que nos avise cuando termine

&nbsp; const handleLoginSuccess = () => {

&nbsp;   setIsAuthenticated(true);

&nbsp; };



&nbsp; // Función para cerrar sesión (limpiar tokens y devolver al login)

&nbsp; const handleLogout = () => {

&nbsp;   localStorage.removeItem('access\_token');

&nbsp;   localStorage.removeItem('refresh\_token');

&nbsp;   setIsAuthenticated(false);

&nbsp; };



&nbsp; return (

&nbsp;   <div>

&nbsp;     {/\* Si está autenticado mostramos la app, si no, mostramos el login \*/}

&nbsp;     {isAuthenticated ? (

&nbsp;       <MascotasApp onLogout={handleLogout} /> 

&nbsp;     ) : (

&nbsp;       <Login onLoginSuccess={handleLoginSuccess} />

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}



export default App;





Nota: Hay que modificar el componente MascotaApp.jsx para recibir la función onLogout como parametro:



export default function MascotasApp({ onLogout }) {







##### 2\. Implementar un Register



Si ya ejecutaste python manage.py migrate en tu proyecto y se crearon las tablas originales de Django, cambiar el modelo de usuario ahora requerirá que borres tu base de datos y tus archivos de migraciones para empezar de cero. Django ata muchas cosas internamente a la tabla de usuarios en la primera migración.



###### 2.1. Crear tu Modelo y Manejador de Usuario Personalizado



En tu aplicación (ej. usuarios/models.py), vas a crear dos cosas: un Manager (que le enseña a Django cómo crear a tus usuarios) y el Modelo en sí.



Supongamos que en la veterinaria, los usuarios inician sesión con su email en lugar de un username, y existen campos adicionales como teléfono. Agrega esto a models.py (de una app usuarios)



from django.db import models

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin



\# 1. El Manager: Le dice a Django cómo crear usuarios normales y superusuarios

class MiUsuarioManager(BaseUserManager):

&nbsp;   def create\_user(self, email, password=None, \*\*extra\_fields):

&nbsp;       if not email:

&nbsp;           raise ValueError('El usuario debe tener un correo electrónico')

&nbsp;       email = self.normalize\_email(email)

&nbsp;       user = self.model(email=email, \*\*extra\_fields)

&nbsp;       user.set\_password(password) # ¡Esto encripta la contraseña!

&nbsp;       user.save(using=self.\_db)

&nbsp;       return user



&nbsp;   def create\_superuser(self, email, password=None, \*\*extra\_fields):

&nbsp;       extra\_fields.setdefault('is\_staff', True)

&nbsp;       extra\_fields.setdefault('is\_superuser', True)

&nbsp;       return self.create\_user(email, password, \*\*extra\_fields)



\# 2. El Modelo: Tu tabla personalizada

class MiUsuario(AbstractBaseUser, PermissionsMixin):

&nbsp;   email = models.EmailField(unique=True) # Usaremos esto para el login

&nbsp;   nombre\_completo = models.CharField(max\_length=255)

&nbsp;   telefono = models.CharField(max\_length=20, blank=True, null=True)

&nbsp;   

&nbsp;   # Campos obligatorios para que el admin de Django funcione bien

&nbsp;   is\_active = models.BooleanField(default=True)

&nbsp;   is\_staff = models.BooleanField(default=False)



&nbsp;   objects = MiUsuarioManager()



&nbsp;   USERNAME\_FIELD = 'email' # Le decimos a Django que el login es con email

&nbsp;   REQUIRED\_FIELDS = \['nombre\_completo'] # Campos extra al hacer createsuperuser



&nbsp;   def \_\_str\_\_(self):

&nbsp;       return self.email







###### 2.2. Avisarle a Django en settings.py



Ahora debes ir a tu archivo settings.py y decirle a Django que reemplace su modelo por defecto con el tuyo. Agrega esta línea en cualquier parte del archivo:



AUTH\_USER\_MODEL = 'nombre\_de\_tu\_app.MiUsuario'





###### 3\. Configurar el Serializador de registro



Cuando usas un modelo personalizado, nunca debes importar tu modelo directamente en los serializadores o vistas (ej. from .models import MiUsuario). En su lugar, usas una función de Django que siempre trae el modelo activo.



from django.contrib.auth import get\_user\_model

from rest\_framework import serializers



\# Esto obtiene dinámicamente tu modelo 'MiUsuario' gracias al settings.py

User = get\_user\_model() 



class RegistroSerializer(serializers.ModelSerializer):

&nbsp;   class Meta:

&nbsp;       model = User

&nbsp;       fields = ('email', 'nombre\_completo', 'password', 'telefono') # Tus nuevos campos

&nbsp;       extra\_kwargs = {'password': {'write\_only': True}}



&nbsp;   def create(self, validated\_data):

&nbsp;       # Como programamos el Manager arriba, create\_user encriptará el password

&nbsp;       user = User.objects.create\_user(\*\*validated\_data)

&nbsp;       return user


### Manejo de Secretos



Subir contraseñas o el SECRET\_KEY a GitHub (o cualquier repositorio) es uno de los errores más comunes y peligrosos en el desarrollo de software. Si un bot detecta esas credenciales, tu base de datos o servidor podrían verse comprometidos en cuestión de minutos.



La solución estándar de la industria es usar Variables de Entorno. Consiste en sacar toda la información sensible de tu código fuente y guardarla en un archivo oculto local (.env) que jamás se sube a Git.



Para hacer esto en Django de forma súper sencilla, usaremos una librería llamada python-decouple.



1\. Instalar python-decouple



pip install python-decouple





2\. Crear tu archivo .env



En la raíz de tu proyecto (exactamente en la misma carpeta donde está tu archivo manage.py), crea un archivo llamado simplemente .env (no olvides el punto al inicio y no le pongas extensión .txt).



Abre ese archivo .env y pega la información que NO DEBERIA ESTAR EN TEXTO PLANO EN tu settings.py:



\# .env

SECRET\_KEY=django-insecure-vgc@7gz5+-juxee44eo#e#23vf8ub^ez\_+!8v-x!+zt+\&g6!1\*

DEBUG=True

DB\_NAME=mascotasDAWP

DB\_USER=usuario\_pruebas

DB\_PASSWORD=contrasena123

DB\_HOST=localhost

DB\_PORT=3306





**NOTA: LA SECRET KEY SERA DIFERENTE SI EL PROYECTO LO HICISTE MANUALMENTE EN TU COMPUTADORA, REVISA EN SETTINGS.PY**





3\. Proteger el archivo con .gitignore



Antes de hacer cualquier commit en Git, debes decirle que ignore este nuevo archivo.

En la misma raíz de tu proyecto (junto a manage.py), asegúrate de tener un archivo llamado .gitignore. Ábrelo y añade esta línea al final:



\# Archivos de entorno

.env





Con esto, Git se volverá "ciego" ante tu archivo .env y nunca lo subirá a internet.





4\. Modificar tu settings.py



Ahora vamos a enseñarle a Django a leer esos valores desde el archivo .env. Ve a tu settings.py y haz las siguientes modificaciones:





4.1. Importar la librería al inicio del archivo:



Justo debajo de from pathlib import Path, agrega:



from decouple import config





4.2. Reemplazar los valores hardcodeados, busca las variables originales y cámbialas para usar config():



\# Reemplaza tu SECRET\_KEY por esto:

SECRET\_KEY = config('SECRET\_KEY')



\# Reemplaza tu DEBUG por esto (cast=bool convierte el texto 'True' en un booleano real):

DEBUG = config('DEBUG', default=False, cast=bool)





4.3. Actualizar la Base de Datos modifica tu diccionario DATABASES para que lea las credenciales:



DATABASES = {

&nbsp;   'default': {

&nbsp;       'ENGINE': 'django.db.backends.mysql',

&nbsp;       'NAME': config('DB\_NAME'),

&nbsp;       'USER': config('DB\_USER'),

&nbsp;       'PASSWORD': config('DB\_PASSWORD'),

&nbsp;       'HOST': config('DB\_HOST', default='localhost'),

&nbsp;       'PORT': config('DB\_PORT', default='3306'),

&nbsp;   }

}







5\. Buena práctica: Crear un .env.example



Como tu archivo .env no se subirá a Git, si otro desarrollador (o tú mismo en otra computadora) clona el repositorio, no sabrá qué variables necesita configurar para que el proyecto funcione.



Crea un archivo llamado .env.example (este SÍ se sube a Git) y pon esto:



\# .env.example

SECRET\_KEY=pon\_tu\_secret\_key\_aqui

DEBUG=True

DB\_NAME=nombre\_de\_la\_bd

DB\_USER=usuario\_de\_la\_bd

DB\_PASSWORD=password\_de\_la\_bd

DB\_HOST=localhost

DB\_PORT=3306





Ahora tu settings.py es 100% genérico. Cuando lo subas a GitHub, nadie verá tu contraseña contrasena123 ni tu SECRET\_KEY. Y cuando decidas subir tu proyecto a producción (a un servidor real), simplemente crearás un archivo .env en ese servidor con las contraseñas reales de producción y tu código funcionará sin tener que cambiar ni una sola línea en settings.py.



Manejo de Secretos.md
Mostrando Manejo de Secretos.md.
Uso de JWT y manejo de secretos
Derick Axel Lagunes Ramírez
•
10 mar
Integración de JWT en Django DRF.md
Texto

Manejo de Secretos.md
Texto

Comentarios de la clase
