from django.db import models
from django.core.validators import MinValueValidator , MaxValueValidator
from django.contrib.auth import get_user_model 
from django.utils import timezone  
from django.dispatch import receiver
from authentication.models import User
import datetime

# Create your models here.

User = get_user_model() 


class Passager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passager_profile')

    infos_recomandations = models.CharField(null= True, blank= True, max_length= 155, unique=True, default='RAS')



    def _str_(self):
        return f"Profil Passager de {self.user.username}"


class Conducteur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='conducteur_profile')
    infos_recomandations = models.CharField(null= True, blank= True, max_length= 155, unique=True , default='RAS')

    def _str_(self):
        return f"Profil Conducteur de {self.user.username} ({self.marque_voiture})"

class TrajetOffert(models.Model):
    conducteur = models.ForeignKey(Conducteur, on_delete=models.CASCADE, related_name='trajets_offerts')
<<<<<<< HEAD
    class TrajetOffert(models.Model):
    # ... autres champs ...
        prix_par_passager = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    # Informations de départ du trajet
=======
    

>>>>>>> 2a5589fe8c4448c6dd87de209c3bf5d33d1d6fdc
    adresse_depart = models.CharField(max_length=255)
    latitude_depart = models.FloatField()
    longitude_depart = models.FloatField()
    heure_depart_prevue = models.DateTimeField() 
    adresse_arrivee = models.CharField(max_length=255, blank=True, null=True)
    latitude_arrivee = models.FloatField(null=True, blank=True)
    longitude_arrivee = models.FloatField(null=True, blank=True)
    heure_arrivee_prevue = models.DateTimeField(null=True, blank=True) 
    nb_places_disponibles = models.IntegerField(default=1) 
    
   
    est_actif = models.BooleanField(default=True)
    

    def __str__(self):
        return f"Trajet de {self.conducteur.user.username} de {self.adresse_depart} le {self.heure_depart_prevue.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['heure_depart_prevue'] 


class DemandeTrajet(models.Model):
    passager = models.ForeignKey(Passager, on_delete=models.CASCADE, related_name='demande_trajet')
    
  
    adresse_depart = models.CharField(max_length=255)
    latitude_depart = models.FloatField()
    longitude_depart = models.FloatField()
    heure_depart_prevue = models.DateTimeField() 
    adresse_arrivee = models.CharField(max_length=255, blank=True, null=True)
    latitude_arrivee = models.FloatField(null=True, blank=True)
    longitude_arrivee = models.FloatField(null=True, blank=True)
    heure_arrivee_prevue = models.DateTimeField(null=True, blank=True)
    est_actif = models.BooleanField(default=True)
    

    def __str__(self):
        return f"Trajet de {self.passager.user.username} de {self.adresse_depart} le {self.heure_depart_prevue.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['heure_depart_prevue'] 

#@receiver(post_save, sender=User)
<<<<<<< HEAD
def create_user_profile(sender, instance, created, **kwargs):
    if created:
       
        if hasattr(instance, 'role'): # Vérifie si le champ 'role' existe sur l'instance User
            if instance.role == 'passager':
                Passager.objects.create(user=instance)
            elif instance.role == 'conducteur':
                Conducteur.objects.create(user=instance)
    




=======

    
>>>>>>> 2a5589fe8c4448c6dd87de209c3bf5d33d1d6fdc
