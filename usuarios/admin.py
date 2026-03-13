from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import MiUsuario

@admin.register(MiUsuario)
class MiUsuarioAdmin(UserAdmin):
    model = MiUsuario
    list_display = ('email', 'nombre_completo', 'is_staff', 'is_active')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('nombre_completo', 'telefono')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre_completo', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('email',)
