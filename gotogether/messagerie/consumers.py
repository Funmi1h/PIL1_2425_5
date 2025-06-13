from channels.generic.websocket import AsyncWebsocketConsumer
import json
from messagerie.models import Message
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):

    @database_sync_to_async
    def save_message(self, sender, content, room_name):
        return Message.objects.create(sender=sender, content=content, room=room_name)

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Message JSON invalide'}))
            return

        message = data.get('message')
        recipient_id = data.get('recipient_id')

        if not message or recipient_id is None:
            await self.send(text_data=json.dumps({'error': 'Message ou destinataire manquant'}))
            return

        try:
            recipient_id = int(recipient_id)
        except ValueError:
            await self.send(text_data=json.dumps({'error': 'Identifiant du destinataire invalide'}))
            return

        sender = self.scope["user"]

        try:
            recipient = await sync_to_async(User.objects.get)(id=recipient_id)
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({'error': 'Utilisateur non trouvé'}))
            return

        await sync_to_async(Message.objects.create)(
            sender=sender,
            recipient=recipient,
            content=message
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender.first_name  # ou sender.email si tu préfères
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))
