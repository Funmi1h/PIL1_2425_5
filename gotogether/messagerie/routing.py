from django.urls import re_path
from . import consumers
# Pour relier les url a des consumers (equivalet websockets des vues )
websocket_urlpatterns = [
re_path(r"ws/chat/(?P<room_name>[^/]+)/$", consumers.ChatConsumer.as_asgi()),
re_path(r"ws/notifs/(?P<user_id>\d+)/$", consumers.NotificationConsumer.as_asgi()),
]