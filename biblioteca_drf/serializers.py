from rest_framework import serializers
from .models import Libro


class LibroSerializer(serializers.ModelSerializer):
    # Campo de apoyo: recibe el archivo para guardarlo como binario en la BD
    portada_para_binario = serializers.ImageField(write_only=True, required=False)

    # Campo de solo lectura: expone la imagen binaria convertida a base64 para el frontend
    portada_base64_display = serializers.ReadOnlyField(source='portada_base64')

    class Meta:
        model = Libro
        fields = [
            'id', 'titulo', 'autor', 'isbn', 'paginas', 'editorial', 'prestado',
            'portada', 'portada_para_binario', 'portada_base64_display',
        ]

    def create(self, validated_data):
        # Extraemos el archivo destinado al campo binario (no es un campo real del modelo)
        archivo_binario = validated_data.pop('portada_para_binario', None)

        # DRF guarda 'portada' automáticamente en media/portadas/
        libro = Libro.objects.create(**validated_data)

        # Si se envió archivo para binario, leemos sus bytes y los guardamos en la BD
        if archivo_binario:
            libro.portada_binaria = archivo_binario.read()
            libro.save()

        return libro

    def update(self, instance, validated_data):
        # Extraemos el archivo binario si viene en la actualización
        archivo_binario = validated_data.pop('portada_para_binario', None)

        # Actualizamos los campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Si se envió un nuevo archivo binario, sobreescribimos
        if archivo_binario:
            instance.portada_binaria = archivo_binario.read()

        instance.save()
        return instance
