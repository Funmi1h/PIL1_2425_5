"""
ASGI config for gotogether project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from dotenv import load_dotenv
load_dotenv()
import django
django.setup()
from django.core.asgi import get_asgi_application
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.auth import AuthMiddlewareStack
from channels.routing import URLRouter, ProtocolTypeRouter
import messagerie.routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gotogether.settings')

# Serveur ASGI + Configuration
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(), # POUR les requetes web normales
        "websocket": AuthMiddlewareStack( #pour les webSockets authentifées
            URLRouter (
                        messagerie.routing.websocket_urlpatterns
                        # on definit les routes websockets

            )
        ), 
    }
)


