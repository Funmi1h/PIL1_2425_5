from django.shortcuts import render, get_object_or_404
from authentication.models import User
from django.contrib.auth.decorators import login_required
from .models import Message, Conversation

@login_required
def message_accueil(request):
    all_users = User.objects.all()
    user = request.user
    return render(request, 'messagerie/messages.html', context={'user': user, 'all_users': all_users})




@login_required
def chat_room(request, id):
    recipient = get_object_or_404(User, id=id)
    user = request.user

    # On cherche une conversation contenant exactement ces deux utilisateurs
    conversation = Conversation.objects.filter(participants=user)\
                                       .filter(participants=recipient)\
                                       .distinct().first()

    # Si elle n'existe pas encore, on la crée
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(user, recipient)

    messages = Message.objects.filter(conversation=conversation).order_by('timestamp')

    room_name = f"{min(user.id, recipient.id)}_{max(user.id, recipient.id)}"

    return render(request, 'messagerie/chat_room.html', {
        'recipient_firstname': recipient.first_name,
        'recipient_id' : recipient.id,
        'me_firstname': user.first_name,
        'room_name': room_name,
        'messages': messages, 

    })