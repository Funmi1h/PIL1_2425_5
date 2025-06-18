from django.urls import path

from . import views

urlpatterns = [
    path('messages', views.message_accueil, name='message_accueil'),
    path('messagerie/chat/<int:id>/', views.chat_room, name="chat_room"),
    path('delete/<int:message_id>/', views.delete_message, name= 'delete_message' ), 
    path('edit/<int:message_id>/', views.edit_message, name= 'edit_message'),
    path('reply_message', views.reply_message, name= 'reply_message')
]