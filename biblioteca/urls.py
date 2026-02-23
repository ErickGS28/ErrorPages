from django.urls import path
from . import views

urlpatterns = [
    path('libros/', views.api_lista_libros, name='lista_libros'),
    path('libros/nuevo/', views.api_crear_libro, name='crear_libro'),
    path('libros/editar/<int:pk>/', views.api_editar_libro, name='editar_libro'),
    path('libros/eliminar/<int:pk>/', views.api_eliminar_libro, name='eliminar_libro'),
]
