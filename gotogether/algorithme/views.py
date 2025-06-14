from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from authentication.models import User
from django.http import JsonResponse
from .forms import ConducteurForm, PassagerForm

# Create your views here.

#passager = User.objects.filter(role='passager') 
#conducteur = User.objects.filter(role='conducteur') 




def formulaire_view(request):
    conducteur_form = ConducteurForm()
    passager_form = PassagerForm()
    if not request.user.numero_telephone and not request.user.email:
        return render(request, "algorithme/infos_incompletes.html", {
            "message": "Complète ton profil pour accéder au formulaire."
        })
    if request.method == "POST":
        # Si la requête est de type POST, on traite les données du formulaire
        role = request.POST.get("role")
        if role == "conducteur":
            
            form = ConducteurForm(request.POST)
            if form.is_valid():
                conducteur = form.save(commit=False)  # Crée une instance de Conducteur sans l'enregistrer
                # Si le formulaire est valide, on enregistre les données
                user = request.user
                user.latitude = request.POST.get("latitude")
                user.longitude = request.POST.get("longitude")
                user.save()  # Enregistre l'utilisateur avec les nouvelles coordonnées
                conducteur.user = user  # Associe l'utilisateur connecté au conducteur
                conducteur.save()  # Enregistre le conducteur
                # Enregistre le formulaire de conducteur
                
                return JsonResponse({"message": "Demande enregistré avec succès!"})
        elif role == "passager":
            form = PassagerForm(request.POST)
            if form.is_valid():
                passager = form.save(commit=False)  # Crée une instance de Client sans l'enregistrer
                # Si le formulaire est valide, on enregistre les données du client
                user = request.user
                user.latitude = request.POST.get("latitude")
                user.longitude = request.POST.get("longitude")
                user.save()

                passager.user = user  # Associe l'utilisateur connecté au passager
                
               
                passager.save()  # Enregistre le client
                # Enregistre le formulaire de client
                # Si le formulaire est valide, on enregistre les données
                
                return JsonResponse({"message": "Demande enregistré avec succès!"})


        

    
    return render(request, "algorithme/formulaire_role.html", {"conducteur_form": conducteur_form , "passager_form": passager_form})



"""def conducteurs_proches(request):
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
    
    return JsonResponse({"error": "Méthode non autorisée"}, status=405)"""