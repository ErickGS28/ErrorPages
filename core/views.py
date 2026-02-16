from django.shortcuts import render

from django.http import JsonResponse

from .forms import ContactoForm
# Create your views here.
def index(request):
    return render(request, 'core/index.html')



def contacto_view(request):
    if request.method == 'POST':
        # Llenamos el formulario con los datos que mandó el usuario
        form = ContactoForm(request.POST)
        if form.is_valid():
            # Los datos ya pasaron las validaciones front y back
            # Registrar en la BD.
            form.save()
            
            # IMPRIMIR EN CONSOLA (Lo que pide el examen)
            print(f"--- NUEVO MENSAJE ---")
            print(f"Nombre: {nombre}\nEmail: {email}\nMensaje: {mensaje}")
            

            return JsonResponse({
                'status':'ok',
                'mensaje':'Registro exitoso del contacto',
            })

            # Renderizamos la misma página pero con un indicador de éxito
            # return render(request, 'core/formulario.html', {'form': form, 'success': True})
        else:
            return JsonResponse({
                'status':'error',
                'errors':form.errors,
            })
    else:
        # Si es GET (primera vez que entra), mostramos el form vacío
        form = ContactoForm()
    
    return render(request, 'core/formulario.html', {'form': form})