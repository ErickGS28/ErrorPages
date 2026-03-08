import base64

from django.db import models


class Libro(models.Model):
    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)
    isbn = models.CharField(max_length=20)
    paginas = models.PositiveIntegerField()
    editorial = models.CharField(max_length=200)
    prestado = models.BooleanField(default=False)

    # IMAGEN 1: se guarda como archivo en la carpeta media/portadas/
    portada = models.ImageField(upload_to='portadas/', blank=True, null=True)

    # IMAGEN 2: se guarda como bytes crudos (binario) directo en la base de datos
    portada_binaria = models.BinaryField(blank=True, null=True)

    @property
    def portada_base64(self):
        """Devuelve la imagen binaria codificada en base64 lista para mostrar en el frontend."""
        if self.portada_binaria:
            codificado = base64.b64encode(self.portada_binaria).decode('utf-8')
            return f"data:image/jpeg;base64,{codificado}"
        return None

    def prestar(self):
        self.prestado = True
        self.save()

    def devolver(self):
        self.prestado = False
        self.save()

    def __str__(self):
        return f"{self.titulo} ({self.autor})"
