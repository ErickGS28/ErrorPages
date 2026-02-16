from django.db import models

# Create your models here.
class Estudiante(models.Model):
    nombre = models.CharField(
        max_length=70,

        )
    apellidos= models.CharField(
        max_length=70,

        );
    edad = models.IntegerField()
    email = models.EmailField()
    sexo = models.BinaryField()
    telefono = models.CharField(max_length=12, default="")


class Contacto (models.Model):
        nombre = models.CharField(
        max_length=70,
        )
        email = models.EmailField()
        mensaje = models.TextField()