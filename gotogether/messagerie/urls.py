from django.urls import path

from . import views

urlpatterns = [
    path('messagerie/messages', views.message_accueil, name='message_accueil'),
    path('messagerie/chat/<int:id>/', views.chat_room, name="chat_room")
]