from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from .models import Client, Conducteur
from django.http import JsonResponse
from .forms import ConducteurForm, ClientForm

# Create your views here.



def conducteur_view(request):
    if request.method == "POST":
        form = ConducteurForm(request.POST)
        # Récupère les données du conducteur depuis la requête POST
        latitude_conducteur = request.POST.get("latitude_conducteur")
        longitude_conducteur = request.POST.get("longitude_conducteur")
        nb_places = request.POST.get("nb_places")
        adresse = request.POST.get("adresse")
        # Crée une instance de Conducteur avec les données du formulaire
        conducteur = Conducteur(
            latitude_conducteur=latitude_conducteur,
            longitude_conducteur=longitude_conducteur,
            nb_places=nb_places,
            adresse=adresse
        )
        # Si le formulaire est valide, on enregistre les données
        if form.is_valid():
            form.save()  # Enregistre les données du formulaire dans la base de données
        # Enregistre le conducteur dans la base de données
        conducteur.save()

            
            # Redirige vers une page de succès ou affiche un message de confirmation
        return JsonResponse({"message": "Conducteur enregistré avec succès!"}, status=201)
    else:
        form = ConducteurForm()
    # Affiche le formulaire dans le template
    return render(request, "conducteur_form.html", {"form": form})

def client_view(request):
    if request.method == "POST":
        form = ClientForm(request.POST)
        # Récupère les données du client depuis la requête POST
        latitude_client = request.POST.get("latitude_client")
        longitude_client = request.POST.get("longitude_client")
        # Si le formulaire est valide, on enregistre les données
        client = Client(
            latitude_client=latitude_client,
            longitude_client=longitude_client,
            adresse=request.POST.get("adresse")
        )
        if form.is_valid():
            form.save()  # Enregistre les données du formulaire dans la base de données
        # Enregistre le client dans la base de données
        client.save()
        # Redirige vers une page de succès ou affiche un message de confirmation
        return JsonResponse({"message": "Client enregistré avec succès!"}, status=201)
    else:
        return render(request, "client_form.html", {"form": ClientForm()})
    # Affiche le formulaire dans le template

    return render(request, "client_form.html", {"form": form})

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