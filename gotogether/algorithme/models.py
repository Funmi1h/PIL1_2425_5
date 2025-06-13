from django.db import models


# Create your models here.
class passager(models.Model):
    latitude_passager = models.FloatField()
    longitude_passager = models.FloatField()
    adresse = models.CharField(max_length=255 , default='Abomey-Calavi')

    def __str__(self):
        return self.name
    
class Conducteur(models.Model):
    latitude_conducteur = models.FloatField()
    longitude_conducteur = models.FloatField()
    nb_places = models.IntegerField()
    adresse = models.CharField(max_length=255 , default='Abomey-Calavi')

    def __str__(self):
        return self.name





    
