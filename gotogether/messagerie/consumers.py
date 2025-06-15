from channels.generic.websocket import AsyncWebsocketConsumer
import json
from messagerie.models import Message, Conversation  # ← conversation importée ici
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']  # ex: "2_5"
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

        # 🔄 Récupérer ou créer la conversation selon les deux participants
        user_ids = self.room_name.split("_")
        try:
            id_1, id_2 = int(user_ids[0]), int(user_ids[1])
        except (ValueError, IndexError):
            await self.send(text_data=json.dumps({'error': 'Nom de salle invalide'}))
            return

        conversation = await sync_to_async(
            lambda: Conversation.objects.filter(participants__id=id_1)
                                        .filter(participants__id=id_2)
                                        .distinct().first()
        )()

        if not conversation:
            conversation = await sync_to_async(Conversation.objects.create)()
            await sync_to_async(conversation.participants.add)(sender, recipient)

        # ✅ Créer le message
        await sync_to_async(Message.objects.create)(
            sender=sender,
            recipient=recipient,
            content=message,
            conversation=conversation
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender.first_name
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))