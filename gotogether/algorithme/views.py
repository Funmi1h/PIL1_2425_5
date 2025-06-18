from django.shortcuts import render , redirect
from django.utils import timezone
from django.contrib import messages
from .utils import find_conducteurs_les_plus_proches
from authentication.models import User
from algorithme.models import Passager , Conducteur , TrajetOffert
from django.http import JsonResponse
from .forms import UserForm , RechercheConducteurForm , ProposerTrajetForm

from algorithme.forms import RechercheConducteurForm


from algorithme.forms import  DemandeTrajetForm 

from algorithme.forms import  DemandeTrajetForm , ProposerTrajetForm


import logging
from django.contrib.auth.decorators import *
from  datetime import timedelta , datetime
import datetime
import json



logger = logging.getLogger(__name__)

def is_passager(user):
    return user.is_authenticated and user.role == 'passager'

def is_conducteur(user):
    return user.is_authenticated and user.role == 'conducteur'


@login_required

def formulaire_view(request):

    # Tente de récupérer l'instance de l'utilisateur connecté pour pré-remplir le formulaire ou mettre à jour.
    user_instance = request.user
    is_conducteur = False
    if hasattr(User, 'role') and User.role == 'conducteur':
        is_conducteur = True
    if request.method == "POST":
        # Instanciez le formulaire avec les données POST et l'instance de l'utilisateur Cela permet à form.save() de Mettre à Jour l'utilisateur existant
        form = UserForm(request.POST, instance=user_instance)

        print(" Utilisateur connecté :", request.user.username)
        print(" Données reçues (POST) :", request.POST)
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



@login_required
def action_button_redirect(request):
    
    user = request.user 

    if user.role == 'passager':
        return redirect('creer_demande_trajet')
    elif user.role == 'conducteur':
        return redirect('proposer_trajet')
    else:
        messages.error(request, "Votre rôle n'est pas défini ou n'est pas reconnu. Veuillez contacter les developpeurs.")
        return redirect('changer_profil') 


@login_required
def rechercher_trajets_view(request):
    form = RechercheConducteurForm(request.POST or None)
    
    context = {
        "form": form,
        "trajets_trouves": [], 
        "adresse_depart_passager": None,
        "date_depart_passager": None,
        "heure_depart_passager": None,
        "heure_arrivee_passager": None,
    }

    if request.method == "POST" and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        
        if form.is_valid():
            print("Form cleaned data:", form.cleaned_data)
            client_latitude = form.cleaned_data.get('latitude_depart')
            client_longitude = form.cleaned_data.get('longitude_depart') 
            
            # Récupération des filtres de date/heure du passager
            date_depart_passager_obj = form.cleaned_data.get('date_depart_passager')
            heure_depart_passager_obj = form.cleaned_data.get('heure_depart_passager') 
            heure_arrivee_passager_obj = form.cleaned_data.get('heure_arrivee_passager')

            

            if client_latitude is None or client_longitude is None:
                form.add_error(None, "Veuillez sélectionner une adresse de départ valide qui peut être géolocalisée.")
                return JsonResponse({'success': False, 'errors': form.errors.as_json()}, status=400)
            
            try:
                initial_queryset = TrajetOffert.objects.all()
                trajets_final = initial_queryset 

                print(f"\n--- 2. Construction de la requête Django ---")
                print(f"  QuerySet initial: {trajets_final.count()} trajets avant tout filtre.")
                heure_actuelle = timezone.now() 
                trajets_filtres_base = TrajetOffert.objects.filter(
                    est_actif=True, 
                    nb_places_disponibles__gt=0,
                    latitude_depart__isnull=False,
                    longitude_depart__isnull=False,
                    
                    heure_depart_prevue__gte=heure_actuelle - timedelta(minutes=30), 
                ).select_related('conducteur', 'conducteur__user')
                trajets_final = trajets_filtres_base
                print(f" trajets dispo : {trajets_filtres_base}" )

                if date_depart_passager_obj:
                
                    trajets_final = trajets_final.filter(
                        date_depart=date_depart_passager_obj
                    )
                else:
                    today = timezone.localdate()
                    
                    trajets_final = trajets_final.filter(
                        heure_depart_prevue__date=today,
                      
                    )

                if heure_depart_passager_obj:
                    # Combiner la date spécifiée (ou du jour) avec l'heure de début
                    if date_depart_passager_obj:
                        start_datetime_filter = timezone.make_aware(
                            datetime.datetime.combine(date_depart_passager_obj, heure_depart_passager_obj)
                        )
                    else: 
                        start_datetime_filter = timezone.make_aware(
                            datetime.datetime.combine(timezone.localdate(), heure_depart_passager_obj)
                        )
                    trajets_final = trajets_final.filter(heure_depart_prevue__gte=start_datetime_filter)

                if heure_arrivee_passager_obj:
                  
                    if date_depart_passager_obj:
                        end_datetime_filter = timezone.make_aware(
                            datetime.datetime.combine(date_depart_passager_obj, heure_arrivee_passager_obj)
                        )
                    else: 
                        end_datetime_filter = timezone.make_aware(
                            datetime.datetime.combine(timezone.localdate(), heure_arrivee_passager_obj)
                        )
                    trajets_final = trajets_final.filter(heure_arrivee_prevue__lte=end_datetime_filter)
                print(f"  QuerySet avant distance: {trajets_final.count()} trajets avant filtre distance.")
                print(f" trajets dispo a ce niveau : {trajets_final}" )
                trajets_trouves_avec_distance = find_conducteurs_les_plus_proches(
                    client_latitude, 
                    client_longitude, 
                    list(trajets_final) 
                )
                for i, res_item in enumerate(trajets_trouves_avec_distance[:3]): # Afficher les 3 premiers
                    print(f"  Item {i+1}: {res_item}")
                    if isinstance(res_item, dict) and 'distance' in res_item:
                        print(f"    Distance trouvée: {res_item['distance']}")
                    else:
                        print("    AVERTISSEMENT: L'élément n'est pas un dictionnaire ou ne contient pas la clé 'distance'.")

                
             
                trajets_proposés = []
                for item in trajets_trouves_avec_distance:
                    trajet_obj = item['user']
                    conducteur_profile_obj = trajet_obj.conducteur 
                    conducteur_user_obj = conducteur_profile_obj.user 

                    trajets_proposés.append({
                        'trajet_id': trajet_obj.id,
                        'conducteur_username': conducteur_user_obj.username,
                        'conducteur_phone': conducteur_user_obj.numero_telephone, 
                        'conducteur_marque_voiture': conducteur_user_obj.marque_voiture, 
                        'nb_places_disponibles_trajet': trajet_obj.nb_places_disponibles, 
                        'distance': round(item['distance'], 2), 
                        'adresse_depart_trajet': trajet_obj.adresse_depart,
                        'heure_depart_trajet': trajet_obj.heure_depart_prevue.strftime('%Y-%m-%d %H:%M') if trajet_obj.heure_depart_prevue else "Non spécifié",
                        'adresse_arrivee_trajet': trajet_obj.adresse_arrivee if trajet_obj.adresse_arrivee else "Non spécifié",
                        'heure_arrivee_trajet': trajet_obj.heure_arrivee_prevue.strftime('%Y-%m-%d %H:%M') if trajet_obj.heure_arrivee_prevue else "Non spécifié",
                    })

                logger.info(f"✅ Recherche de trajets réussie pour {request.user.username}. Trouvés: {len(trajets_proposés)}")
                return JsonResponse({
                    'success': True,
                    'message': 'Recherche réussie !',
                    'trajets': trajets_proposés, 
                    'adresse_depart_passager': form.cleaned_data.get('adresse_depart'),
                    'date_depart_passager': date_depart_passager_obj.strftime('%Y-%m-%d') if date_depart_passager_obj else None,
                    'heure_depart_passager': heure_depart_passager_obj.strftime('%H:%M') if heure_depart_passager_obj else None,
                    'heure_arrivee_passager': heure_arrivee_passager_obj.strftime('%H:%M') if heure_arrivee_passager_obj else None,
                })

            except Exception as e:
                logger.error(f"❌ Erreur interne lors de la recherche de trajets: {e}", exc_info=True)
                return JsonResponse({'success': False, 'errors': {'__all__': ["Une erreur interne est survenue lors de la recherche. Veuillez réessayer."]}}, status=500)
        else:
            logger.warning(f"❌ Formulaire de recherche invalide (AJAX). Erreurs: {form.errors}")
            return JsonResponse({'success': False, 'errors': form.errors.as_json()}, status=400)

    # Pour les requêtes GET (affichage initial du formulaire)
    return render(request, "algorithme/rechercher_trajets.html", context)





@login_required 
def créer_demande_trajet_view(request):
    if request.user.role != 'passager':
        error_message = "Votre compte n'est pas configuré comme passager. Accès refusé."
        logger.warning(f"❌ User {request.user.username} (rôle: {request.user.role}) n'a pas le rôle 'passager'. Redirection vers 'changer_profil'.")
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=403)
        else:
            messages.error(request, error_message)
            return redirect('changer_profil')
        


    form = DemandeTrajetForm() # Formulaire vide pour le GET

    if request.method == "POST":
        # Vérifier si c'est une requête AJAX (envoyant du JSON)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            try:
                
               

                data = json.loads(request.body)
                print("Données JSON reçues par Django (data):", data) # <<< VÉRIFIEZ CECI dans le terminal

                # Instanciez le formulaire avec les données PARSÉES DU JSON
                form = DemandeTrajetForm(data)

                if form.is_valid():
                    print("Formulaire valide (AJAX) !") # Debug
                    demande_trajet = form.save(commit=False) # Ne pas sauvegarder tout de suite

                    try:
                        passager_profile = request.user.passager_profile
                        demande_trajet.passager = passager_profile # Lie la demande au passager connecté
                        demande_trajet.save() # Sauvegarde l'objet DemandeTrajet

                        logger.info(f"✅ Demande de trajet créée avec succès par {request.user.username} (ID: {demande_trajet.id}).")
                        return JsonResponse({
                            'success': True,
                            'message': 'Votre demande de trajet a été soumise avec succès !',
                            'demande_id': demande_trajet.id,
                            'adresse_depart': demande_trajet.adresse_depart,
                            'heure_depart': demande_trajet.heure_depart_prevue.strftime('%Y-%m-%d %H:%M') # Assurez-vous que ces champs existent
                        })
                    except Passager.DoesNotExist:
                        error_message = "Votre compte n'est pas configuré comme passager. Veuillez contacter l'administrateur."
                        logger.error(f"❌ User {request.user.username} n'a pas de profil Passager.")
                        return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=403)
                    except Exception as e:
                        error_message = "Une erreur interne est survenue lors de la sauvegarde. Veuillez réessayer."
                        logger.error(f"❌ Erreur lors de la création de la demande de trajet pour {request.user.username}: {e}", exc_info=True)
                        return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=500)
                else:
                    # Formulaire AJAX invalide
                    print("Formulaire INVALIDE (AJAX). Erreurs:", form.errors) # <<< VÉRIFIEZ CECI
                    print("Formulaire INVALIDE (AJAX). Erreurs JSON:", form.errors.as_json()) # <<< VÉRIFIEZ CECI
                    logger.warning(f"❌ Formulaire de demande de trajet invalide (AJAX) par {request.user.username}. Erreurs: {form.errors}.")
                    return JsonResponse({'success': False, 'errors': form.errors.as_json()}, status=400)

            except json.JSONDecodeError as e:
                print(f"Erreur de décodage JSON: {e}")
                logger.error(f"Erreur de décodage JSON lors de la soumission de demande de trajet: {e}")
                return JsonResponse({'success': False, 'message': 'Format JSON invalide.'}, status=400)
            except Exception as e:
                print(f"Erreur inattendue lors de la soumission AJAX générale: {e}")
                logger.critical(f"Erreur inattendue dans la vue creer_demande_trajet_view (AJAX): {e}", exc_info=True)
                return JsonResponse({'success': False, 'message': f'Erreur interne du serveur: {e}'}, status=500)
        
        # Ce bloc gère les soumissions de formulaire non-AJAX (POST "normal")
        else:
            print("Requête POST NON-AJAX reçue.") # Debug
            form = DemandeTrajetForm(request.POST) # Utiliser request.POST pour les requêtes normales

            if form.is_valid():
                print("Formulaire valide (NON-AJAX) !") # Debug
                try:
                    passager_profile = request.user.passager_profile
                    demande_trajet = form.save(commit=False)
                    demande_trajet.passager = passager_profile
                    demande_trajet.save()
                    logger.info(f"✅ Demande de trajet créée avec succès (non-AJAX) par {request.user.username}.")
                    return redirect('mes_demandes_trajet') # Redirection après succès
                except Passager.DoesNotExist:
                    error_message = "Votre compte n'est pas configuré comme passager. Veuillez contacter l'administrateur."
                    logger.error(f"❌ User {request.user.username} n'a pas de profil Passager (non-AJAX).")
                    form.add_error(None, error_message) # Ajoutez l'erreur au formulaire pour l'affichage
                except Exception as e:
                    error_message = "Une erreur interne est survenue. Veuillez réessayer."
                    logger.error(f"❌ Erreur lors de la création de la demande de trajet (non-AJAX) pour {request.user.username}: {e}", exc_info=True)
                    form.add_error(None, error_message) # Ajoutez l'erreur au formulaire pour l'affichage
            else:
                print("Formulaire INVALIDE (NON-AJAX). Erreurs:", form.errors) # Debug
                logger.warning(f"❌ Formulaire de demande de trajet invalide (non-AJAX) par {request.user.username}. Erreurs: {form.errors}.")
                # Si le formulaire est invalide, il sera re-rendu avec les erreurs via le return render final

    # Pour les requêtes GET ou si le formulaire non-AJAX est invalide, réaffiche le formulaire
    return render(request, 'algorithme/créer_demande_trajet.html', {'form': form})

    

    


@login_required 

@login_required
def proposer_trajet_view(request):
    logger.info(f"DEBUG: Accès à proposer_trajet_view par User: {request.user.username}, IsAuthenticated: {request.user.is_authenticated}, Role: {request.user.role}")

    # Initialisation de conducteur_profile à None avant le try-except
    conducteur_profile = None 

    try:
        conducteur_profile = request.user.conducteur_profile
        logger.info(f"DEBUG: Profil Conducteur trouvé pour {request.user.username} (ID: {conducteur_profile.id}).")
    except Conducteur.DoesNotExist:
        error_message = "Votre compte n'est pas configuré comme conducteur. Veuillez créer ou mettre à jour votre profil conducteur."
        logger.warning(f"❌ User {request.user.username} n'a PAS de profil Conducteur associé. Redirection vers 'changer_profil'.")
        messages.error(request, error_message)
        # Gestion de la réponse AJAX pour cette erreur spécifique avant le POST
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=403)
        return redirect('changer_profil')
    except AttributeError:
        error_message = "Erreur interne: Impossible d'accéder à votre profil conducteur. Contactez l'administrateur."
        logger.critical(f"❌ AttributeError: User {request.user.username} n'a pas d'attribut 'conducteur_profile'. Vérifiez le related_name dans le modèle Conducteur.", exc_info=True)
        messages.error(request, error_message)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=500) 
        return redirect('changer_profil')

    # Vérification du rôle après avoir trouvé le profil pour éviter des redirections multiples
    if request.user.role != 'conducteur':
        error_message = "Votre compte n'est pas configuré comme conducteur. Accès refusé."
        logger.warning(f"❌ User {request.user.username} (rôle: {request.user.role}) n'a pas le rôle 'conducteur'. Redirection vers 'changer_profil'.")
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': {'__all__': [error_message]}}, status=403)
        else:
            messages.error(request, error_message)
            return redirect('changer_profil')

    # Initialisation du formulaire pour les requêtes GET
    form = ProposerTrajetForm() 

    if request.method == "POST":
        form = ProposerTrajetForm(request.POST, request.FILES) # Ajout de request.FILES par bonne pratique

        if form.is_valid():
            print("Formulaire ProposerTrajet valide (POST) !")
            trajet_offert = form.save(commit=False)
            trajet_offert.conducteur = conducteur_profile # Utilise le profil trouvé au début
            trajet_offert.save()

            logger.info(f"✅ Trajet proposé créé avec succès par {request.user.username} (ID: {trajet_offert.id}).")
            
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                # Retourne un succès JSON
                return JsonResponse({
                    'success': True,
                    'message': 'Votre trajet a été proposé avec succès !',
                    'trajet_id': trajet_offert.id,
                    'adresse_depart': trajet_offert.adresse_depart,
                    # N'oubliez pas les coordonnées pour des traitements JS futurs si besoin
                    'latitude_depart': str(trajet_offert.latitude_depart), 
                    'longitude_depart': str(trajet_offert.longitude_depart),
                    'adresse_arrivee': trajet_offert.adresse_arrivee,
                    'latitude_arrivee': str(trajet_offert.latitude_arrivee) if trajet_offert.latitude_arrivee else None,
                    'longitude_arrivee': str(trajet_offert.longitude_arrivee) if trajet_offert.longitude_arrivee else None,
                    # Ajoutez d'autres champs si votre JS en a besoin pour l'affichage de confirmation
                })
            else:
                messages.success(request, 'Votre trajet a été proposé avec succès !')
                return redirect('mes_trajets_offerts')
        else:
            # Le formulaire est invalide
            print("Formulaire ProposerTrajet INVALIDE (POST). Erreurs:", form.errors)
            logger.warning(f"❌ Formulaire de proposition de trajet invalide par {request.user.username}. Erreurs: {form.errors}.")
            
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                # Convertir form.errors en une chaîne JSON, puis la recharger en objet Python
                # pour s'assurer que JsonResponse reçoit un dictionnaire Python standard.
                # `as_json()` donne une chaîne, `json.loads()` la transforme en dict/list Python.
                errors_dict = json.loads(form.errors.as_json()) 
                return JsonResponse({'success': False, 'errors': errors_dict}, status=400)
            else:
                # Pour les requêtes non-AJAX, le formulaire avec les erreurs sera rendu ci-dessous
                pass 
                
    # Pour les requêtes GET ou si le formulaire POST non-AJAX est invalide, rendre la page avec le formulaire
    return render(request, 'algorithme/proposer_trajet.html', {'form': form})



# N'oubliez pas d'importer les modèles nécessaires si ce n'est pas déjà fait
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
# Assurez-vous d'importer vos modèles DemandeTrajet et Conducteur
from .models import DemandeTrajet, Conducteur, TrajetOffert # Assurez-vous que TrajetOffert est bien importé
from .forms import ProposerTrajetForm # et votre formulaire

import logging
import json # N'oubliez pas cette importation pour json.loads

logger = logging.getLogger(__name__)

# ... (votre vue proposer_trajet_view existante) ...

@login_required
def mes_trajets_offerts_view(request):
    """
    Affiche la liste des trajets offerts par le conducteur connecté.
    """
    logger.info(f"DEBUG: Accès à mes_trajets_offerts_view par User: {request.user.username}")

    try:
        # Tente de récupérer le profil conducteur de l'utilisateur connecté.
        # Utilise .select_related('utilisateur') pour précharger l'utilisateur lié
        # et éviter des requêtes supplémentaires si l'utilisateur est accédé plus tard.
        conducteur_profile = request.user.conducteur_profile
    except Conducteur.DoesNotExist:
        error_message = "Votre compte n'est pas configuré comme conducteur. Veuillez créer ou mettre à jour votre profil conducteur."
        messages.error(request, error_message)
        logger.warning(f"❌ User {request.user.username} n'a PAS de profil Conducteur associé. Redirection vers 'changer_profil'.")
        return redirect('changer_profil')
    except AttributeError:
        error_message = "Erreur interne: Impossible d'accéder à votre profil conducteur. Contactez l'administrateur."
        messages.critical(f"❌ AttributeError: User {request.user.username} n'a pas d'attribut 'conducteur_profile'. Vérifiez le related_name dans le modèle Conducteur.", exc_info=True)
        messages.error(request, error_message)
        return redirect('changer_profil')

    # Vérification explicite du rôle au cas où le profil existe mais le rôle est incorrect
    if request.user.role != 'conducteur':
        error_message = "Votre compte n'est pas configuré comme conducteur. Accès refusé."
        messages.error(request, error_message)
        logger.warning(f"❌ User {request.user.username} (rôle: {request.user.role}) n'a pas le rôle 'conducteur'. Redirection.")
        return redirect('changer_profil')

   
    trajets_offerts = TrajetOffert.objects.filter(conducteur=conducteur_profile).order_by('date_depart', 'heure_depart_prevue')
    
   

    context = {
        'trajets_offerts': trajets_offerts,
        'conducteur': conducteur_profile, 
    }

    print(f"Utilisateur connecté: {request.user.username}")
    trajets_offerts = TrajetOffert.objects.filter(conducteur=request.user).order_by('-date_depart')
    print(f"Nombre de trajets trouvés: {trajets_offerts.count()}")
    for trajet in trajets_offerts:
        print(f"Trajet ID: {trajet.id}, Départ: {trajet.adresse_depart}, Date: {trajet.date_depart}")
    context = {
        'trajets_offerts': trajets_offerts,
    }
    
    return render(request, 'algorithme/mes_trajets_offerts.html', context)