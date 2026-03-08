# Generated manually on 2026-03-08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('biblioteca_drf', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='libro',
            name='portada',
            field=models.ImageField(blank=True, null=True, upload_to='portadas/'),
        ),
        migrations.AddField(
            model_name='libro',
            name='portada_binaria',
            field=models.BinaryField(blank=True, null=True),
        ),
    ]
