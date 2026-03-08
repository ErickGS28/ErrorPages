# Implementación de Imágenes en el Proyecto Biblioteca

## Contexto general

El proyecto ya tenía un CRUD de libros funcionando con React (frontend) y Django REST Framework (backend). Se extendió la funcionalidad para manejar **dos formas de almacenar imágenes**:

1. **ImageField** → Django guarda el archivo físico en una carpeta `media/` del servidor.
2. **BinaryField** → La imagen llega al backend, se leen sus bytes crudos y se guardan directamente en la base de datos.

El frontend envía ambas imágenes en un solo `multipart/form-data` (FormData). Al leer los libros, el backend devuelve la URL de la imagen de media y la imagen binaria convertida a Base64 (una cadena `data:image/jpeg;base64,...`) que el frontend puede mostrar en un `<img>` directamente.

---

## Paso 1 — models.py (`biblioteca_drf/models.py`)

**¿Qué se hizo?**

Se agregaron dos campos al modelo `Libro` y un `@property` que convierte los bytes binarios a Base64.

```python
import base64
from django.db import models

class Libro(models.Model):
    # ... campos existentes ...

    # IMAGEN 1: archivo físico en media/portadas/
    portada = models.ImageField(upload_to='portadas/', blank=True, null=True)

    # IMAGEN 2: bytes crudos en la base de datos
    portada_binaria = models.BinaryField(blank=True, null=True)

    @property
    def portada_base64(self):
        """Devuelve los bytes binarios convertidos a una cadena Base64 para el frontend."""
        if self.portada_binaria:
            codificado = base64.b64encode(self.portada_binaria).decode('utf-8')
            return f"data:image/jpeg;base64,{codificado}"
        return None
```

**¿Por qué?**
- `ImageField` usa `Pillow` internamente para validar que el archivo sea una imagen real.
- `upload_to='portadas/'` indica que los archivos se guardarán en `media/portadas/`.
- `BinaryField` almacena bytes crudos (0s y 1s) en la BD, sin referencias a archivos externos.
- El `@property` es un método que se puede llamar como atributo. Convierte los bytes binarios a Base64 para que el frontend pueda usar la cadena directamente en un `<img src="...">`.

---

## Paso 2 — serializers.py (`biblioteca_drf/serializers.py`)

**¿Qué se hizo?**

Se reemplazó el serializador genérico (`fields = '__all__'`) por uno personalizado que maneja los dos tipos de imagen.

```python
from rest_framework import serializers
from .models import Libro

class LibroSerializer(serializers.ModelSerializer):
    # Campo de apoyo: recibe el archivo para guardarlo como binario
    # write_only=True → solo se usa para recibir datos, nunca aparece en la respuesta
    portada_para_binario = serializers.ImageField(write_only=True, required=False)

    # Campo de solo lectura: expone la propiedad portada_base64 del modelo
    portada_base64_display = serializers.ReadOnlyField(source='portada_base64')

    class Meta:
        model = Libro
        fields = [
            'id', 'titulo', 'autor', 'isbn', 'paginas', 'editorial', 'prestado',
            'portada', 'portada_para_binario', 'portada_base64_display',
        ]

    def create(self, validated_data):
        # Extraemos el archivo del campo de apoyo (no existe en el modelo)
        archivo_binario = validated_data.pop('portada_para_binario', None)

        # DRF guarda 'portada' en media/ automáticamente al hacer Libro.objects.create()
        libro = Libro.objects.create(**validated_data)

        # Si llegó el archivo para binario, leemos sus bytes y los guardamos en BD
        if archivo_binario:
            libro.portada_binaria = archivo_binario.read()
            libro.save()

        return libro

    def update(self, instance, validated_data):
        archivo_binario = validated_data.pop('portada_para_binario', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if archivo_binario:
            instance.portada_binaria = archivo_binario.read()
        instance.save()
        return instance
```

**¿Por qué?**
- `portada_para_binario` es un campo *virtual* (no existe en el modelo). Existe solo para recibir el archivo en el endpoint.
- `write_only=True` significa que Django lo acepta al crear/editar pero no lo muestra en las respuestas GET.
- `portada_base64_display` con `ReadOnlyField(source='portada_base64')` llama al `@property` del modelo y lo incluye en las respuestas GET.
- `validated_data.pop('portada_para_binario', None)` lo saca del diccionario antes de `create()` porque no es un campo real del modelo y Django lanzaría un error si lo incluimos.
- `.read()` lee todos los bytes del archivo subido y los devuelve como `bytes`.

---

## Paso 3 — settings.py (`testing/settings.py`)

**¿Qué se hizo?**

Se agregaron las dos variables de configuración necesarias para que Django sepa dónde guardar y desde dónde servir los archivos de media.

```python
# Al final del archivo, después de STATICFILES_DIRS

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**¿Por qué?**
- `MEDIA_ROOT` es la ruta absoluta en el sistema de archivos donde Django guarda los archivos subidos. Se crea la carpeta `media/` en la raíz del proyecto.
- `MEDIA_URL` es el prefijo de URL que el navegador usa para acceder a esos archivos (ej: `http://localhost:8000/media/portadas/libro.jpg`).
- Sin estas dos variables, `ImageField` no sabe dónde guardar los archivos.

---

## Paso 4 — urls.py principal (`testing/urls.py`)

**¿Qué se hizo?**

Se agregó la configuración para que Django sirva los archivos de `media/` durante el desarrollo.

```python
from django.conf import settings
from django.conf.urls.static import static

# ... urlpatterns existentes ...

# En modo DEBUG, Django actúa como servidor de estáticos para media/
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**¿Por qué?**
- En producción, un servidor web como Nginx o Apache sirve los archivos de media directamente.
- En desarrollo, Django puede servirlos si añadimos esta configuración.
- Esto es lo que permite que `http://localhost:8000/media/portadas/xxx.jpg` funcione en el navegador.

---

## Paso 5 — Migración de base de datos

**¿Qué se hizo?**

Se creó el archivo `biblioteca_drf/migrations/0002_libro_portada_libro_portada_binaria.py` para agregar los dos nuevos campos a la tabla existente en MySQL.

```python
operations = [
    migrations.AddField(
        model_name='libro',
        name='portada',
        field=models.ImageField(blank=True, null=True, upload_to='portadas/'),
    ),
    migrations.AddField(
        model_name='libro',
        name='portada_binaria',
        field=models.BinaryField(blank=True, null=True),
    ),
]
```

**¿Por qué?**
- Django usa migraciones para mantener sincronizados el código Python (modelos) con la estructura real de la base de datos (tablas y columnas).
- Como ambos campos tienen `null=True`, los libros existentes no se ven afectados.

---

## Paso 6 — services/api.js (`biblioteca-front/src/services/api.js`)

**¿Qué se hizo?**

Se simplificaron las funciones `create` y `update` para que reciban el `FormData` ya construido desde el componente, en lugar de construirlo internamente.

```javascript
// ANTES (construía FormData internamente, no funciona bien con Files)
export const create = (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]); // ← agrega todo, incluyendo null de imágenes
    }
    return axios.post(`${BASE_URL}/`, formData);
};

// DESPUÉS (recibe FormData ya armado desde el componente)
export const create = (data) => {
    return axios.post(`${BASE_URL}/`, data);
};
```

**¿Por qué?**
- El loop genérico `for (const key in data)` agregaría `null` o `undefined` al FormData cuando no se selecciona imagen, lo cual Django interpreta como un string `"null"` y lanza error de validación.
- Al construir el FormData en el componente, podemos verificar `instanceof File` antes de agregar las imágenes.

---

## Paso 7 — LibrosApp.jsx (`biblioteca-front/src/LibrosApp.jsx`)

**¿Qué se hizo?**

Se realizaron 6 cambios en el componente principal.

### 7.1 — Estado inicial (FORM_INICIAL)

```javascript
const FORM_INICIAL = {
  titulo: '', autor: '', isbn: '', paginas: '', editorial: '', prestado: false,
  portada: null,              // ← nuevo
  portada_para_binario: null, // ← nuevo
};
```

### 7.2 — handleChange detecta inputs de archivo

```javascript
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  if (type === 'file') {
    // Guardamos el objeto File, no la ruta del string
    setFormData((prev) => ({ ...prev, [name]: e.target.files[0] }));
  } else {
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }
  setErroresBackend((prev) => ({ ...prev, [name]: undefined }));
};
```

### 7.3 — handleSubmit construye FormData manualmente

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const dataToSend = new FormData();
  dataToSend.append('titulo', formData.titulo);
  // ... otros campos de texto ...
  dataToSend.append('prestado', formData.prestado ? 'true' : 'false');

  // Solo adjuntamos las imágenes si el usuario seleccionó un archivo
  if (formData.portada instanceof File) {
    dataToSend.append('portada', formData.portada);
  }
  if (formData.portada_para_binario instanceof File) {
    dataToSend.append('portada_para_binario', formData.portada_para_binario);
  }

  // ... try/catch ...

  // Al finalizar, resetear también los inputs de archivo en el DOM
  document.getElementById('form-libros').reset();
};
```

### 7.4 — Formulario con id y dos nuevos inputs de archivo

```jsx
<form id="form-libros" onSubmit={handleSubmit}>
  {/* ... campos existentes ... */}

  {/* Imagen que va a la carpeta media/ */}
  <div className="mb-3">
    <label className="form-label">Portada (Carpeta Media)</label>
    <input type="file" name="portada" accept="image/jpeg,image/png"
      className="form-control" onChange={handleChange} />
  </div>

  {/* Imagen que va a la base de datos como binario */}
  <div className="mb-3">
    <label className="form-label">Portada (Base de Datos - Binario)</label>
    <input type="file" name="portada_para_binario" accept="image/jpeg,image/png"
      className="form-control" onChange={handleChange} />
  </div>
</form>
```

### 7.5 — cancelarEdicion también resetea inputs de archivo

```javascript
const cancelarEdicion = () => {
  setFormData(FORM_INICIAL);
  setEditandoId(null);
  setErroresBackend({});
  document.getElementById('form-libros').reset(); // ← nuevo
};
```

### 7.6 — Columnas de la tabla muestran las imágenes

```jsx
{
  name: 'Portada (Media)',
  cell: (row) => row.portada
    ? <img src={row.portada} width="45" height="60" style={{ objectFit: 'cover' }} />
    : 'N/A',
},
{
  name: 'Portada (BD)',
  cell: (row) => row.portada_base64_display
    ? <img src={row.portada_base64_display} width="45" height="60" style={{ objectFit: 'cover' }} />
    : 'N/A',
},
```

---

## Flujo completo de datos

```
FRONTEND                          BACKEND                      BASE DE DATOS / DISCO
--------                          -------                      ---------------------

Usuario selecciona imagen 1  →    portada (ImageField)    →    media/portadas/libro.jpg (disco)
Usuario selecciona imagen 2  →    portada_para_binario    →    portada_binaria (bytes en MySQL)
                                  (ImageField virtual)
                                  .read() → bytes

Al leer (GET):

                            ←    portada: "/media/portadas/libro.jpg"   ←  URL del archivo en disco
                            ←    portada_base64_display: "data:image/jpeg;base64,..."  ← @property convierte BD→Base64

FRONTEND recibe y muestra:
  <img src="http://localhost:8000/media/portadas/libro.jpg" />   (carpeta media)
  <img src="data:image/jpeg;base64,..." />                       (binario de BD)
```

---

## Guía de pruebas

### Requisitos previos

1. **MySQL**: La base de datos `biblioteca_drf` debe estar corriendo.

---

### Paso 1 — Aplicar la migración

```bash
cd C:\Users\eeeri\OneDrive\Escritorio\ClaseProfeDerick\testing

python manage.py migrate
```

Deberías ver:
```
Applying biblioteca_drf.0002_libro_portada_libro_portada_binaria... OK
```

---

### Paso 2 — Iniciar el servidor Django

```bash
cd C:\Users\eeeri\OneDrive\Escritorio\ClaseProfeDerick\testing

python manage.py runserver
```

---

### Paso 3 — Iniciar el frontend React

```bash
cd C:\Users\eeeri\OneDrive\Escritorio\ClaseProfeDerick\testing\biblioteca-front

npm run dev
```

Abre el navegador en `http://localhost:5173`.

---

### Paso 4 — Probar crear un libro con imágenes

1. Rellena los campos: Título, Autor, ISBN, Páginas, Editorial.
2. En **"Portada (Carpeta Media)"** selecciona una imagen `.jpg` o `.png`.
3. En **"Portada (Base de Datos - Binario)"** selecciona otra imagen (puede ser la misma).
4. Haz clic en **"Registrar"**.
5. Verás el libro en la tabla con las dos columnas de imagen mostrando miniaturas.

---

### Paso 5 — Verificar en el servidor Django

- Comprueba que se creó la carpeta `testing/media/portadas/` con el archivo de imagen.
- En el Admin de Django (`http://localhost:8000/admin/`) abre el libro y verifica que `portada` tiene la URL del archivo.

---

### Paso 6 — Verificar en la base de datos

```sql
SELECT id, titulo, portada, LENGTH(portada_binaria) AS tamano_binario
FROM biblioteca_drf_libro
WHERE portada IS NOT NULL OR portada_binaria IS NOT NULL;
```

- `portada`: debe mostrar la ruta relativa, ej: `portadas/nombre_imagen.jpg`
- `tamano_binario`: debe mostrar un número mayor a 0 (los bytes guardados)

---

### Paso 7 — Probar la API directamente (opcional)

```bash
# Crear libro con dos imágenes usando curl
curl -X POST http://localhost:8000/biblioteca-drf/api/libros/ \
  -F "titulo=El Quijote" \
  -F "autor=Cervantes" \
  -F "isbn=978-0" \
  -F "paginas=1000" \
  -F "editorial=Anaya" \
  -F "prestado=false" \
  -F "portada=@C:/ruta/a/imagen.jpg" \
  -F "portada_para_binario=@C:/ruta/a/imagen.jpg"
```

---

### Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `No module named 'PIL'` | Pillow no instalado | `pip install Pillow` |
| `portada_binaria` no se guarda | La imagen binaria es `null` al llegar | Verificar que el input `name="portada_para_binario"` coincide con el serializador |
| Imagen no se muestra en la tabla | CORS o MEDIA_URL mal configurado | Verificar `settings.py` y `urls.py` |
| `"null"` string en el campo portada | FormData incluye `null` como string | Solo adjuntar imagen si `instanceof File` |
| Error al migrar `BinaryField` | MySQL no soporta | MySQL soporta `LONGBLOB`, funciona bien con BinaryField |
