from django.urls import path

from . import views

urlpatterns = [
    path('messagerie/messages', views.message_accueil, name='message_accueil'),
    path('chat/<str: first_name>/', views.chat_room, name="chat_room")
]