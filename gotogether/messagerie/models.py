from django.db import models
from django.conf import settings
# Create your models here.


# Conversation va regrouper tous les messages d'une mm discussion
class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name= 'conversations') 
    # une conversation peut inclure plusieurs utilisateurs et un utilisateur peut participer a plusieurs conversations
    created_at = models.DateTimeField(auto_now_add=True)



class Message(models.Model):
    message_content = models.TextField()
    conversation = models.ForeignKey(Conversation, on_delete= models.CASCADE)
    # un message ne peut etre que dans un discussion
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete= models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add= True)
    is_read = models.BooleanField(default= False)


