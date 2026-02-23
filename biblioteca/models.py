from django.db import models


class Libro(models.Model):
    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)
    isbn = models.CharField(max_length=20)
    paginas = models.PositiveIntegerField()
    editorial = models.CharField(max_length=200)
    prestado = models.BooleanField(default=False)

    def prestar(self):
        self.prestado = True
        self.save()

    def devolver(self):
        self.prestado = False
        self.save()

    def __str__(self):
        return f"{self.titulo} ({self.autor})"
