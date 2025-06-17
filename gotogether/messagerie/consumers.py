from channels.generic.websocket import AsyncWebsocketConsumer
import json
from messagerie.models import Message, Conversation
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.utils import timezone
from authentication.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Message JSON invalide'}))
            return

        message = data.get('message')
        recipient_id = data.get('recipient_id')
        reply_to_id = data.get('reply_to_id')

        if not message or not recipient_id:
            await self.send(text_data=json.dumps({'error': 'Message ou destinataire manquant'}))
            return

        try:
            recipient = await sync_to_async(User.objects.get)(id=recipient_id)
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({'error': 'Utilisateur non trouvé'}))
            return

        sender = self.scope["user"]

        try:
            id_1, id_2 = map(int, self.room_name.split("_"))
        except (ValueError, IndexError):
            await self.send(text_data=json.dumps({'error': 'Nom de salle invalide'}))
            return

        conversation = await sync_to_async(
            lambda: Conversation.objects.filter(participants__id=id_1)
                                        .filter(participants__id=id_2)
                                        .distinct()
                                        .first()
        )()

        if not conversation:
            conversation = await sync_to_async(Conversation.objects.create)()
            await sync_to_async(conversation.participants.add)(sender, recipient)

        reply_to = None
        if reply_to_id:
            try:
                reply_to = await sync_to_async(Message.objects.get)(id=reply_to_id)
            except Message.DoesNotExist:
                reply_to = None

        created_msg = await sync_to_async(Message.objects.create)(
            sender=sender,
            recipient=recipient,
            content=message,
            conversation=conversation,
            reply_to=reply_to
        )

        timestamp = timezone.localtime(created_msg.timestamp).strftime('%H:%M')

        message_payload = {
            'type': 'chat_message',
            'message': message,
            'sender': sender.first_name,
            'sender_id': sender.id,
            'timestamp': timestamp,
            'reply_to': reply_to.content if reply_to else None,
            'reply_to_id': reply_to.id if reply_to else None,
        }

        # Envoi uniquement via group_send au groupe
        await self.channel_layer.group_send(
            self.room_group_name,
            message_payload
        )

        # Notification au destinataire (optionnel)
        await self.channel_layer.group_send(
            f"notif_{recipient.id}",
            {
                'type': 'new_message',
                'message': f"Nouveau message de {sender.first_name}"
            }
        )

    async def chat_message(self, event):
        is_sender_current_user = (self.scope["user"].id == event.get('sender_id'))
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event['timestamp'],
            'reply_to': event.get('reply_to'),
            'reply_to_id': event.get('reply_to_id'),
            'is_sender_current_user': is_sender_current_user,
        }))



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        # 🔒 Sécurité : Ne pas accepter les utilisateurs non connectés
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"notif_{self.user.id}"

        # ✅ Abonnement au groupe de notifications
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ WebSocket notification connecté pour user {self.user.id}")

    async def disconnect(self, close_code):
        # ❌ Désabonnement du groupe à la déconnexion
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print(f"🔌 Déconnecté du groupe {self.group_name}")

    # 🔔 Appelée lorsqu’un autre consumer envoie une notif à ce groupe
    async def new_message(self, event):
        print(f"Notification reçue : {event['message']}")  # Log côté serveur
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
