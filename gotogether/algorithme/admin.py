from django.contrib import admin

# Register your models here.
# monapp/admin.py
from django.contrib import admin
from authentication import models 
<<<<<<< HEAD
from algorithme import models
admin.site.register(models.TrajetOffert)
=======
from .models import Passager , Conducteur , TrajetOffert , DemandeTrajet

admin.site.register(Passager)
admin.site.register(Conducteur)
admin.site.register(TrajetOffert)
admin.site.register(DemandeTrajet)

>>>>>>> 2a5589fe8c4448c6dd87de209c3bf5d33d1d6fdc
# Enregistrez le modèle Conducteur pour qu'il apparaisse dans l'admin
