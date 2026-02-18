from django import forms
from .models import ErrorReport


class ErrorReportForm(forms.ModelForm):
    class Meta:
        model = ErrorReport
        fields = ['titulo', 'descripcion', 'tipo_error', 'url', 'metodo_http', 'ip_cliente']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Título del error'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Descripción detallada del error',
                'rows': 4
            }),
            'tipo_error': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 404, 500, 403'
            }),
            'url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://ejemplo.com/pagina'
            }),
            'metodo_http': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'GET, POST, PUT, DELETE'
            }),
            'ip_cliente': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '192.168.1.1 (opcional)'
            }),
        }
        labels = {
            'titulo': 'Título',
            'descripcion': 'Descripción',
            'tipo_error': 'Tipo de Error',
            'url': 'URL',
            'metodo_http': 'Método HTTP',
            'ip_cliente': 'IP del Cliente',
        }
