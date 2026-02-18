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
