from django.contrib import admin
from .models import Passager, Conducteur, TrajetOffert, DemandeTrajet


# Register your models here.
# monapp/admin.py
from django.contrib import admin
 




from .models import Passager , Conducteur , TrajetOffert , DemandeTrajet


# Enregistre les modèles une seule fois

admin.site.register(Passager)
admin.site.register(Conducteur)





# Pour éviter l'erreur d'enregistrement en double, on utilise try-except
try:
    admin.site.register(TrajetOffert)
except admin.sites.AlreadyRegistered:
    pass

admin.site.register(DemandeTrajet)
    

