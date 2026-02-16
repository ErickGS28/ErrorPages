from django import forms
from django.core.exceptions import ValidationError
from core.models import Contacto

class ContactoForm(forms.ModelForm):

    class Meta:
            model = Contacto
            fields = ['nombre','email','mensaje']

    # Validación de mensaje (SPAM)
    def clean_mensaje(self):
        data = self.cleaned_data['mensaje']
        if "spam" in data.lower():
            raise ValidationError("No se permite contenido publicitario.")
        return data

    # Validación de email (UTEZ)
    # NOTA: En el txt dice "def email", pero para que Django lo detecte automático
    # debe llamarse "clean_email" como se ve en la captura del PDF[cite: 433].
    def clean_email(self):
        data = self.cleaned_data['email']
        if "@utez.edu.mx" not in data:
            raise ValidationError("Solo puedes registrar correos de la utez")
        return data
    
    