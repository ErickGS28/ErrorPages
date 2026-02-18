from django.urls import path
from . import views

app_name = 'error_reports'

urlpatterns = [
    path('reportes-error/', views.reporte_error_view, name='reporte_error'),
    path('obtener-reportes/', views.obtener_reportes_view, name='obtener_reportes'),
]
