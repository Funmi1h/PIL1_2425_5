from django.shortcuts import render

# Create your views here.
def message_accueil(request):
    user = request.user
    return render(request, 'messagerie/messages.html', {'user': user})