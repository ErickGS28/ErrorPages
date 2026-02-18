from django.db import models

# Create your models here.

class ErrorReport(models.Model):
    titulo = models.CharField(max_length=150, blank=False, null=False)
    descripcion = models.TextField(blank=False, null=False)
    tipo_error = models.CharField(max_length=100, blank=False, null=False)
    url = models.URLField(blank=False, null=False)
    metodo_http = models.CharField(max_length=10, blank=False, null=False)
    ip_cliente = models.GenericIPAddressField(blank=True, null=True)
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.titulo} - {self.tipo_error}"

    class Meta:
        verbose_name = "Reporte de Error"
        verbose_name_plural = "Reportes de Errores"
        ordering = ['-fecha_reporte']
