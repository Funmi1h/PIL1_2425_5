from django.contrib import admin

# Register your models here.
# monapp/admin.py
from django.contrib import admin
from authentication import models 
from .models import Passager , Conducteur , TrajetOffert , DemandeTrajet

admin.site.register(Passager)
admin.site.register(Conducteur)
admin.site.register(TrajetOffert)
admin.site.register(DemandeTrajet)

# Enregistrez le modèle Conducteur pour qu'il apparaisse dans l'admin
