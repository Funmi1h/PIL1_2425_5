# Generated by Django 5.2.2 on 2025-06-14 23:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0007_alter_user_email_alter_user_latitude_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='numero_telephone',
            field=models.CharField(blank=True, max_length=15, null=True, unique=True, verbose_name='Numéro de téléphone'),
        ),
    ]
