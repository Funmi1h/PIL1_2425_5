from django.shortcuts import render
from authentication.models import User
from django.contrib.auth.decorators import login_required


@login_required
def message_accueil(request):
    all_users = User.objects.all()
    user = request.user
    return render(request, 'messagerie/messages.html', context={'user': user, 'all_users': all_users})

@login_required
def chat_room(request, first_name):
    return render(request, 'messagerie/chat_room.html', {
        'recipient_firstname': first_name,
        'me': request.user.first_name
    })