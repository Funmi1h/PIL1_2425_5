from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from authentication.models import User
from django.http import JsonResponse
from .forms import UserForm
import logging
from django.contrib.auth.decorators import *

# Create your views here.

#passager = User.objects.filter(role='passager') 
#conducteur = User.objects.filter(role='conducteur') 

logger = logging.getLogger(__name__)


@login_required # S'assurer que l'utilisateur est connecté

def formulaire_view(request):

    # Tente de récupérer l'instance de l'utilisateur connecté pour pré-remplir le formulaire ou mettre à jour.
    user_instance = request.user
    is_conducteur = False
    if hasattr(User, 'role') and User.role == 'conducteur':
        is_conducteur = True
    if request.method == "POST":
        # Instanciez le formulaire avec les données POST et l'instance de l'utilisateur Cela permet à form.save() de Mettre à Jour l'utilisateur existant
        form = UserForm(request.POST, instance=user_instance)

        print("🧪 Utilisateur connecté :", request.user.username)
        print("🧪 Données reçues (POST) :", request.POST)
        if form.is_valid():
            try :
                form.save()
                logger.info(f"✅ Profil utilisateur ({request.user.username}) mis à jour avec succès.")
                return JsonResponse({"message": "Profil mis à jour avec succès!"})
            except Exception as e:
                logger.error(f"❌ Erreur lors de la sauvegarde du profil utilisateur: {e}")
                return JsonResponse({"error": "Erreur lors de la mise à jour du profil."}, status=500)
        else:
            print("❌ Erreurs formulaire profil utilisateur:", form.errors)
            return JsonResponse({"error": "Formulaire invalide", "details": form.errors}, status=400)    

    else: # Requête GET
        # Le formulaire est pré-rempli avec les données de l'utilisateur connecté
        form = UserForm(instance=user_instance)
    """else:
        initial_data = {
            'adresse': "Cotonou, Bénin" 
        }
        form = ConducteurForm(initial=initial_data, is_conducteur=is_conducteur) """


        

    
    return render(request, "algorithme/formulaire_role.html", {"user_form": form , "is_conducteur":is_conducteur })



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