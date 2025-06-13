from django.db import models

from django.db import models

from django.contrib.auth.models import AbstractUser

class User(AbstractUser):

    username  = models.CharField(null= True, blank= True, max_length= 155, unique=True)
    #Liste des choix
    ROLES_CHOICES = [
        ('conducteur', 'Conducteur'),
        ('passager', 'Passager'),
    ]
    email = models.EmailField(unique= True, verbose_name= ' Adresse e-mail')


    numero_telephone = models.CharField(
        max_length=15,
        unique=True,
        verbose_name='Numéro de téléphone'
    )


    photo_profil = models.ImageField(
        upload_to='photos_profil/', # Toutes les photos de profil seront enregistrées dans le dossier 'photos_profil' a l'intérieur du dossier 'media'
        null=True,
        blank=True,
        verbose_name='Photo de profil'
    )


    heure_depart = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Heure de départ'
    )


   # champ pour l'emplacement de l'utilisateur

    heure_arrivee = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Heure d\'arrivée'
    )
    #Champ pour le role de l'utilisateur
    role = models.CharField(
        max_length=20,
        choices=ROLES_CHOICES,
        verbose_name='Rôle',
        default='passager'  # Valeur par défaut
    )
    latitude = models.FloatField(
        verbose_name='Latitude',
        null=True,
        blank=True
    )
    longitude = models.FloatField(
        verbose_name='Longitude',
        null=True,
        blank=True
    )
    nb_places = models.IntegerField(
        verbose_name='Nombre de places',
        null=True,
        blank=True
    )
    adresse = models.CharField(max_length=255 ,
         default='Abomey-Calavi',
         verbose_name='Adresse'
    )
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username']
