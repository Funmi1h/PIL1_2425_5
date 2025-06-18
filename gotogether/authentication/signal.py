from django.db.models.signals import post_save
from django.dispatch import receiver

from authentication.models import User

from algorithme.models import Passager, Conducteur 


@receiver(post_save, sender=User)
def create_or_update_user_profile_and_role_model(sender, instance, created, **kwargs):
   
   

  
    if instance.role == 'passager': 
        Passager.objects.get_or_create(user=instance)
        print(f"DEBUG: Profil Passager créé/mis à jour pour {instance.username}")
        
        Conducteur.objects.filter(user=instance).delete()
    elif instance.role == 'conducteur': 
        Conducteur.objects.get_or_create(user=instance)
        
        Passager.objects.filter(user=instance).delete()
        print(f"DEBUG: Profil Conducteur créé/mis à jour pour {instance.username}")
    