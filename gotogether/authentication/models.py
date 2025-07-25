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
        verbose_name='Heure de départ', 
       
    )


   # champ pour l'emplacement de l'utilisateur

    heure_arrivee = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Heure d'arrivée",
        

    )
    #Champ pour le role de l'utilisateur
    role = models.CharField(
        max_length=20,
        choices=ROLES_CHOICES,
        verbose_name='Rôle',
        default='passager'  # Valeur par défaut
    )
    latitude = models.DecimalField(
        max_digits=30,
        decimal_places=20,
        verbose_name='Latitude',
        null=True,
        blank=True
    
    )
    longitude = models.DecimalField(
        verbose_name='Longitude',
        null=True,
        blank=True,
        max_digits=30,
        decimal_places=20
    )

    latitude_arrivee = models.DecimalField(
        verbose_name='Latitude_arrivee',
        null=True,
        blank=True,
        max_digits=30,
        decimal_places=20
    )
    longitude_arrivee = models.DecimalField(
        verbose_name='Longitude_arrivee',
        null=True,
        blank=True,
        max_digits=30,
        decimal_places=20)
    
    date_depart = models.DateField(
        verbose_name='Date de depart', 
        null=True, 
        blank=True

    )
    nb_places = models.IntegerField(
        verbose_name='Nombre de places',
        null=True,
        blank=True
    )
    adresse = models.CharField(max_length=255 ,
         verbose_name='Adresse',
         null= True, 
         blank= True
    )

    adresse_arrivee = models.CharField(max_length=255 ,
         verbose_name='Adresse_arrivee',
         null= True, 
         blank= True
        )

    marque_voiture = models.CharField(max_length= 100,
         null= True, 
         blank = True)
    
    


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username', 'numero_telephone']

    first_login = models.BooleanField(default= True)