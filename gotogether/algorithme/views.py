from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from authentication.models import User
from algorithme.models import Passager , Conducteur , TrajetOffert
from django.http import JsonResponse
from .forms import UserForm , RechercheConducteurForm , ProposerTrajetForm
from algorithme.forms import r
import logging
from django.contrib.auth.decorators import *
from  datetime import timezone

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
                print("🧪 Utilisateur connecté :", request.user.username)
                print("🧪 Données reçues (POST) :", request.POST)
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
    return render(request, "algorithme/formulaire_role.html", {"user_form": form , "is_conducteur":is_conducteur })

# - VUE POUR LA RECHERCHE DE CONDUCTEURS ET L'AFFICHAGE DES RÉSULTATS SUR LA MÊME PAGE ---
@login_required
def rechercher_conducteurs_view(request):
    form = RechercheConducteurForm(request.POST or None) # Le formulaire est instancié avec les données POST s'il y en a, sinon vide.
    conducteurs_trouves = [] 
    adresse_depart_passager = None
    heure_depart_passager = None
    heure_arrivee_passager = None
    
    if request.method == "POST":
        print("🔍 Données reçues (POST - rechercher_conducteurs_view):", request.POST)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            if form.is_valid():
                client_latitude = form.cleaned_data.get('latitude_depart')
                client_longitude = form.cleaned_data.get('longitude_depart') 
                adresse_depart_passager = form.cleaned_data.get('adresse_depart')
                heure_depart_passager = form.cleaned_data.get('heure_depart')
                heure_arrivee_passager = form.cleaned_data.get('heure_arrivee')

                if client_latitude is None or client_longitude is None:
                    form.add_error(None, "Veuillez sélectionner une adresse de départ valide qui peut être géolocalisée.")
                    # Si c'est une requête AJAX, renvoyez une erreur JSON
                    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                        return JsonResponse({'success': False, 'errors': form.errors.as_json()}, status=400)
                else:
                        try:
                            heure_actuelle = timezone.now()
                            tous_les_conducteurs = User.objects.filter(role='conducteur')
                        
                    
                            tous_les_conducteurs_valides = [
                            c for c in tous_les_conducteurs 
                            if c.latitude is not None and c.longitude is not None
                            ]
                            conducteurs_trouves_raw = find_conducteurs_les_plus_proches(
                            client_latitude, 
                            client_longitude, 
                            tous_les_conducteurs_valides
                        )
                        
                        # Préparez les données pour le template, en ne gardant que ce qui est nécessaire
                            conducteurs_trouves = []
                            for item in conducteurs_trouves_raw:
                                conducteurs_trouves.append({
                                'id': item['user'].id,
                                'username': item['user'].username,
                                'adresse': item['user'].adresse,       # Accès direct au champ adresse du User
                                'nb_places': item['user'].nb_places,
                                'distance': item['distance'],
                                'heure_depart_conducteur': item['user'].heure_depart, 
                                'heure_arrivee_conducteur': item['user'].heure_arrivee,
                                'marque_voiture': item['user'].marque_voiture,
                                'numero_telephone': item['user'].numero_telephone, 
                            })

                            logger.info(f"✅ Recherche de conducteurs réussie pour {request.user.username}.")
                            print(f"✅ Conducteurs trouvés : {len(conducteurs_trouves)}")
                            return JsonResponse({
                        'success': True,
                        'message': 'Recherche réussie !',
                        'conducteurs': conducteurs_trouves,
                        'adresse_depart_passager': adresse_depart_passager,
                        'heure_depart_passager': heure_depart_passager.strftime('%H:%M') if heure_depart_passager else None,
                        'heure_arrivee_passager': heure_arrivee_passager.strftime('%H:%M') if heure_arrivee_passager else None,
                    })


                        except Exception as e:
                            logger.error(f"❌ Erreur lors de la recherche de conducteurs: {e}", exc_info=True)
                            form.add_error(None, "Une erreur est survenue lors de la recherche des conducteurs. Veuillez réessayer.")
                            
                   
            else: # Formulaire invalide (pour une requête AJAX)
                # Renvoie les erreurs du formulaire en JSON
                print("❌ Erreurs formulaire de recherche:", form.errors)
                return JsonResponse({'success': False, 'errors': form.errors.as_json()}, status=400)

    # Rend le même template, que ce soit pour une requête GET (formulaire vide)
    # ou une requête POST (formulaire avec résultats/erreurs)
    return render(request, "algorithme/rechercher_conducteurs.html", {
        "form": form,
        "conducteurs_trouves": conducteurs_trouves, # Sera vide en GET, rempli en POST si succès
        "adresse_depart_passager": adresse_depart_passager, # Sera None en GET, rempli en POST
        "heure_depart_passager": heure_depart_passager,
        "heure_arrivee_passager": heure_arrivee_passager,
    })


@login_required # S'assurer que seul un utilisateur connecté peut proposer un trajet
def proposer_trajet_view(request):
    # S'assurer que l'utilisateur est bien un conducteur
    if not hasattr(request.user, 'conducteur_profile'):
        # Créer le profil conducteur si l'utilisateur est 'conducteur' mais n'a pas de profil
        # Ceci peut arriver si l'utilisateur est passé conducteur APRÈS sa création et le signal n'a pas été exécuté.
        if request.user.role == 'conducteur':
            Conducteur.objects.create(user=request.user)
        else:
            # Rediriger ou afficher une erreur si l'utilisateur n'est pas un conducteur
            return redirect('some_error_page') # Ou render un template avec un message
    
    conducteur_profile = request.user.conducteur_profile

    if request.method == "POST":
        form = ProposerTrajetForm(request.POST)
        if form.is_valid():
            trajet = form.save(commit=False) # Ne pas sauvegarder tout de suite
            trajet.conducteur = conducteur_profile # Lier le trajet au profil conducteur de l'utilisateur
            # Les places disponibles sont déjà dans le formulaire
            # trajet.nb_places_disponibles = conducteur_profile.nb_places_vehicule # Initialiser avec la capacité du véhicule si vous voulez
            trajet.est_actif = True # Le trajet est actif lors de sa création
            trajet.save()
            return redirect('trajet_propose_success') # Rediriger vers une page de succès ou la liste des trajets
        else:
            # Le formulaire n'est pas valide, afficher les erreurs
            pass # Le render en dessous affichera le formulaire avec les erreurs
    else:
        form = ProposerTrajetForm() # Formulaire vide pour une requête GET

    return render(request, "algorithme/proposer_trajet.html", {'form': form})