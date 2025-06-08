from django.db import models


# Create your models here.
class Client(models.Model):
    latitude_client = models.FloatField()
    longitude_client = models.FloatField()


    def __str__(self):
        return self.name
    
class Conducteur(models.Model):
    latitude_conducteur = models.FloatField()
    longitude_conducteur = models.FloatField()
    nb_places = models.IntegerField(max_length=5)

    def __str__(self):
        return self.name





    
