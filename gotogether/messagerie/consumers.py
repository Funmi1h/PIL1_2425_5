from channels.generic.websocket import AsyncWebsocketConsumer
import json
from messagerie.models import Message

from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()

async def receive(self, text_data):
    data = json.loads(text_data)
    message = data['message']
    sender = self.scope["user"]
    recipient_username = data['recipient']  # on ajoute ça dans le frontend

    recipient = await sync_to_async(User.objects.get)(username=recipient_username)

    # Sauvegarder le message
    await sync_to_async(Message.objects.create)(
        sender=sender,
        recipient=recipient,
        body=message
    )

    # Envoyer à tous les utilisateurs de la room
    await self.channel_layer.group_send(
        self.room_group_name,
        {
            'type': 'chat_message',
            'message': message,
            'sender': sender.username
        }
    )
