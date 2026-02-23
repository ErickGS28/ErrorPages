import json
from django.http import JsonResponse, QueryDict
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Libro


# 1. LISTAR (GET)
def api_lista_libros(request):
    libros = Libro.objects.all().values()  # Convierte el QuerySet a diccionarios
    return JsonResponse(list(libros), safe=False)


# 2. CREAR (POST)
@csrf_exempt
def api_crear_libro(request):
    if request.method == 'POST':
        titulo = request.POST.get('titulo')
        autor = request.POST.get('autor')
        isbn = request.POST.get('isbn')
        paginas = request.POST.get('paginas')
        editorial = request.POST.get('editorial')

        libro = Libro.objects.create(
            titulo=titulo,
            autor=autor,
            isbn=isbn,
            paginas=paginas,
            editorial=editorial
        )
        return JsonResponse({
            'mensaje': 'Libro registrado exitosamente',
            'id': libro.id
        }, status=201)


# 3. ACTUALIZAR (PUT)
@csrf_exempt
def api_editar_libro(request, pk):
    libro = get_object_or_404(Libro, pk=pk)
    if request.method == 'PUT':
        # Intentar leer como JSON primero, luego como form-urlencoded
        try:
            data = json.loads(request.body)
        except Exception:
            data = QueryDict(request.body)
        libro.titulo = data.get('titulo', libro.titulo)
        libro.autor = data.get('autor', libro.autor)
        libro.isbn = data.get('isbn', libro.isbn)
        libro.paginas = data.get('paginas', libro.paginas)
        libro.editorial = data.get('editorial', libro.editorial)
        libro.save()
        return JsonResponse({'mensaje': 'Libro actualizado exitosamente'}, status=200)


# 4. ELIMINAR (DELETE)
@csrf_exempt
def api_eliminar_libro(request, pk):
    if request.method == 'DELETE':
        libro = get_object_or_404(Libro, pk=pk)
        libro.delete()
        return JsonResponse({}, status=204)
