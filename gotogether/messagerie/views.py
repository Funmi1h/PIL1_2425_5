from django.shortcuts import render, get_object_or_404, redirect
from authentication.models import User
from django.contrib.auth.decorators import login_required
from .models import Message, Conversation
from django.http import JsonResponse




@login_required
def get_last_message(user1, user2):
    return Message.objects.filter(
        sender=user1, recipient=user2
    ).union(
        Message.objects.filter(sender=user2, recipient=user1)
    ).order_by('-timestamp').first()


@login_required
def message_accueil(request):
    user = request.user
    all_users = User.objects.exclude(id=user.id)

    user_data = []
    for other_user in all_users:
        conv = Conversation.objects.filter(participants=user).filter(participants=other_user).distinct().first()
        if conv:
            last_message = Message.objects.filter(conversation=conv).order_by('-timestamp').first()
        else:
            last_message = None
        user_data.append({
            'user': other_user,
            'last_message': last_message
        })

    return render(request, 'messagerie/messages.html', {
        'user_data': user_data
    })




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

@login_required
def delete_message(request, message_id):
    if request.method == 'POST':
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        message.delete()
        return JsonResponse({'status': 'deleted'})
    return JsonResponse({'status': 'error', 'detail': 'Méthode non autorisée'}, status=405)




def edit_message(request, message_id):
    if request.method == 'POST':
        message = get_object_or_404(Message, id=message_id)

        # Vérifie que c'est bien l'auteur du message qui modifie
        if message.sender != request.user:
            return JsonResponse({'error': 'Accès refusé'}, status=403)

        new_content = request.POST.get('new_content')
        if not new_content:
            return JsonResponse({'error': 'Contenu vide'}, status=400)

        message.content = new_content
        message.save()

        return JsonResponse({'status': 'updated', 'new_content': new_content})
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@login_required
def reply_message(request):
    if request.method == 'POST':
        content = request.POST.get('content')
        reply_to_id = request.POST.get('reply_to_id')
        recipient_id = request.POST.get('recipient_id')

        try:
            recipient = User.objects.get(id=recipient_id)
            reply_to_msg = Message.objects.get(id=reply_to_id) if reply_to_id else None

            Message.objects.create(
                sender=request.user,
                recipient=recipient,
                content=content,
                reply_to=reply_to_msg
            )
            return JsonResponse({'status': 'replied'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        




