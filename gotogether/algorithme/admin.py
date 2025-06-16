from django.contrib import admin

# Register your models here.
# monapp/admin.py
from django.contrib import admin
from authentication import models 
from algorithme import models
admin.site.register(models.TrajetOffert)
# Enregistrez le modèle Conducteur pour qu'il apparaisse dans l'admin
