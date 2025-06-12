from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from .models import Client, Conducteur
from authentication.models import User
from django.http import JsonResponse
from .forms import ConducteurForm, ClientForm

# Create your views here.

client = User.objects.filter(role='passager') 
conducteur = User.objects.filter(role='conducteur') 

def formulaire_view(request):
    conducteur_form = ConducteurForm()
    client_form = ClientForm()
    if request.method == "POST":
        # Si la requête est de type POST, on traite les données du formulaire
        role = request.POST.get("role")
        if role == "conducteur":
            form = ConducteurForm(request.POST)
            if form.is_valid():
                # Si le formulaire est valide, on enregistre les données
                conducteur.user.latitude = request.POST.get("latitude")
                conducteur.user.longitude = request.POST.get("longitude")
                conducteur.user.save()  # Enregistre les coordonnées du conducteur
                # Enregistre le conducteur dans la base de données
                conducteur = form.save(commit=False)  # Crée une instance de Conducteur sans l'enregistrer
                conducteur.user = request.user  # Associe l'utilisateur connecté au conducteur
                conducteur.save()  # Enregistre le conducteur
                # Enregistre le formulaire de conducteur
                form.save()
                return JsonResponse({"message": "Demande enregistré avec succès!"})
        elif role == "passager":
            form = ClientForm(request.POST)
            if form.is_valid():
                # Si le formulaire est valide, on enregistre les données du client
                client.user.latitude = request.POST.get("latitude")
                client.user.longitude = request.POST.get("longitude")
                client.user.save()  # Enregistre les coordonnées du client
                # Enregistre le client dans la base de données
                client = form.save(commit=False)  # Crée une instance de Client sans l'enregistrer
                client.user = request.user  # Associe l'utilisateur connecté au client
                client.save()  # Enregistre le client
                # Enregistre le formulaire de client
                # Si le formulaire est valide, on enregistre les données
                form.save()
                return JsonResponse({"message": "Demande enregistré avec succès!"})


        

    
    return render(request, "formulaire_role.html", {"conducteur_form": conducteur_form} , {"client_form": client_form})



def conducteurs_proches(request):
    if request.method == "POST":
        # Récupère les données du client depuis la requête POST
        client_latitude = float(request.POST.get("latitude_client"))
        client_longitude = float(request.POST.get("longitude_client"))
        
        # Récupère tous les conducteurs de la base de données
        conducteurs = Conducteur.objects.all()
        
        # Trouve les conducteurs les plus proches du client
        conducteurs_proches = find_conducteurs_les_plus_proches(client_latitude, client_longitude, conducteurs)
        
        # Retourne les conducteurs proches sous forme de JSON
        return JsonResponse(conducteurs_proches, safe=False)
    
    return JsonResponse({"error": "Méthode non autorisée"}, status=405)