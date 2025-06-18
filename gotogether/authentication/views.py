import re
from django.shortcuts import render, redirect
from . import forms
from django.contrib.auth.views import LoginView
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from .models import User 
import requests
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from algorithme.utils import generate_suggestions_passagers, generate_suggestions_conducteurs
from django.contrib import messages
from django.contrib.auth import get_user_model
from algorithme.models import Passager , Conducteur
from django.db import models
from algorithme.utils import generate_suggestions_conducteurs , generate_suggestions_passagers

from algorithme.models import TrajetOffert , DemandeTrajet
import logging

logger = logging.getLogger(__name__)
class LoginView(LoginView):
    template_name = 'authentication/login.html'
    form_class = forms.LoginForm
    redirect_authenticated_user = True

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('dashboard') 
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            identifiant = form.cleaned_data.get('identifiant')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=identifiant, password=password)
            if user:
                login(request, user)
                if user.first_login:
                    user.first_login = False
                    user.save()

                return redirect('dashboard')  
            else:
                return render(request, self.template_name, {
                    'form': form,
                    'message': 'Identifiant ou mot de passe incorrect.'
                })
        return render(request, self.template_name, {
            'form': form,
            'message': 'Veuillez corriger les erreurs dans le formulaire.'
        })


# vue pour inscription des utilisateurs



def signup(request):
    if request.method == 'POST':
        form = forms.SignUpForm(request.POST)
        if form.is_valid():
            password = form.cleaned_data.get('password')
            confirm_password = form.cleaned_data.get('confirm_password')

            if password != confirm_password:
                return render(request, 'authentication/sign_up.html', {
                    'form': form,
                    'message': 'Les mots de passe ne correspondent pas.'
                })

            user = form.save(commit=False)
            user.set_password(password)
            user.save()
            login(request, user)
            
            return redirect('dashboard')
        else:
            return render(request, 'authentication/sign_up.html', {
                'form': form,
                'message': 'Veuillez corriger les erreurs dans le formulaire.'
            })
    else:
        form = forms.SignUpForm()
        return render(request, 'authentication/sign_up.html', {'form': form})



@login_required
def profil_user(request):
    user = request.user
    return render(request, 'authentication/profil.html', {'user': user})






#vue pour la déconnexion
def logout_user(request):
    logout(request)
    return redirect('login')

#vue pour le dashboard
def dashboard(request):
    user = request.user
    context = {
        'user': user,
        'user_display_name': user.username, # Pour la cohérence avec le template
        'page_title': 'Mon Tableau de Bord',
        'suggestions_passagers': [],
        'suggestions_conducteur': [],
        'derniers_trajets_offerts': [],
        'dernieres_recherches_trajets': [],
        'suggestions_passagers_error': None,
        'suggestions_conducteur_error': None,
        'derniers_trajets_offerts_error': None,
        'dernieres_recherches_trajets_error': None,
    }

    # --- Récupération des profils utilisateur ---
    conducteur_profile = None
    passager_profile = None

    try:
        if hasattr(user, 'conducteur_profile') and user.conducteur_profile:
            conducteur_profile = user.conducteur_profile
    except Conducteur.DoesNotExist:
        logger.info(f"User {user.username} does not have a Conducteur profile.")
    except AttributeError:
        # Ceci peut arriver si le OneToOneField n'est pas configuré correctement
        logger.warning(f"AttributeError: User {user.username} does not have 'conducteur_profile' attribute.")

    try:
        if hasattr(user, 'passager_profile') and user.passager_profile:
            passager_profile = user.passager_profile
    except Passager.DoesNotExist:
        logger.info(f"User {user.username} does not have a Passager profile.")
    except AttributeError:
        logger.warning(f"AttributeError: User {user.username} does not have 'passager_profile' attribute.")


    # --- Logique pour les SUGGESTIONS (basée sur le rôle de l'utilisateur) ---

    # Suggestions de trajets pour l'utilisateur en tant que Passager
    if user.role == 'passager' and passager_profile:
        try:
            # Assurez-vous que generate_suggestions_passagers prend 'user' ou 'passager_profile'
            context['suggestions_passagers'] = generate_suggestions_passagers(user, rayon_km=10, tolerance_minutes=45)
        except Exception as e:
            logger.error(f"Erreur suggestions passagers pour {user.username}: {e}", exc_info=True)
            context['suggestions_passagers_error'] = "Impossible de charger les suggestions de trajets. Veuillez réessayer."
    elif user.role == 'passager' and not passager_profile:
        context['suggestions_passagers_error'] = "Vous devez avoir un profil passager pour voir les suggestions de trajets."


    # Suggestions de passagers pour l'utilisateur en tant que Conducteur
    if user.role == 'conducteur' and conducteur_profile:
        try:
            # Assurez-vous que generate_suggestions_conducteurs prend 'user' ou 'conducteur_profile'
            context['suggestions_conducteur'] = generate_suggestions_conducteurs(user, rayon_km=10, tolerance_minutes=45)
        except Exception as e:
            logger.error(f"Erreur suggestions conducteurs pour {user.username}: {e}", exc_info=True)
            context['suggestions_conducteur_error'] = "Impossible de charger les suggestions de passagers. Veuillez réessayer."
    elif user.role == 'conducteur' and not conducteur_profile:
        context['suggestions_conducteur_error'] = "Vous devez avoir un profil conducteur pour voir les suggestions de passagers."


    # --- Logique pour l'HISTORIQUE des trajets/recherches (affichée quel que soit le rôle) ---

    # Derniers trajets offerts (si l'utilisateur est un conducteur)
    if conducteur_profile: # Vérifier si le profil conducteur existe
        try:
            context['derniers_trajets_offerts'] = TrajetOffert.objects.filter(
                conducteur=conducteur_profile
            ).order_by('-date_depart', '-heure_depart_prevue')[:5]
        except Exception as e:
            logger.error(f"Erreur chargement derniers trajets offerts pour {user.username}: {e}", exc_info=True)
            context['derniers_trajets_offerts_error'] = "Impossible de charger vos derniers trajets offerts."
    else:
        context['derniers_trajets_offerts_error'] = "Vous devez avoir un profil conducteur pour voir vos trajets offerts."


    # Dernières recherches de trajets (si l'utilisateur est un passager)
    if passager_profile: # Vérifier si le profil passager existe
        try:
            context['dernieres_recherches_trajets'] = DemandeTrajet.objects.filter(
                passager=passager_profile # Assurez-vous que le champ est 'passager'
            ).order_by('-date_recherche', '-heure_depart_preferee')[:5]
        except Exception as e:
            logger.error(f"Erreur chargement dernières recherches pour {user.username}: {e}", exc_info=True)
            context['dernieres_recherches_trajets_error'] = "Impossible de charger vos dernières recherches de trajets."
    else:
        context['dernieres_recherches_trajets_error'] = "Vous devez avoir un profil passager pour voir vos recherches de trajets."

    return render(request, 'authentication/dashboard.html', context)


# vue pour changer le mot de passe
@login_required
def upload_password(request):
    form = PasswordChangeForm(request.user)
    user = request.user #on recupere l'utilisateur connecté
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST) 
        if form.is_valid():
            user= form.save()
            update_session_auth_hash(request, user) # pour éviter la déconnexion
            return redirect('profil_user')
    return render(request, 'authentication/update_password.html', context={'form': form, 'user':user})


# mettre a jour la photo de profil
@login_required
def upload_profile_photo(request):
    form = forms.UploadProfilePhotoForm() 
    user = request.user 
    if request.method == 'POST':
        form = forms.UploadProfilePhotoForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
           form.save()
           return redirect ('profil_user')
    return render (request, 'authentication/update_photo_profil.html', context={'form': form})
    

# Mettre a jour le profil
@login_required
def modifier_profil(request):
    user = request.user

    if user.first_login and request.method == 'GET':
        user.first_login = False
        user.save()


    if request.method == 'POST':
        form = forms.ProfilForm(request.POST, request.FILES, instance = user)
        if form.is_valid():
            form.save()


            # desactiver le champ first_login a la premiere connexion
            if user.first_login:
                user.first_login = False
                user.save()
                
            return redirect('dashboard')
    else:
        form = forms.ProfilForm(instance=user)

    return render(request, 'authentication/modifier_profile.html', {'user': user, 'form': form})        




@require_GET
def geocode_proxy(request):
    query = request.GET.get('q', '')  # Récupère le paramètre 'q' de l'URL (ex: ?q=cotonou)
    if not query:
        return JsonResponse({'error': 'Missing query'}, status=400)  # Si pas de q, on renvoie une erreur
    
    url = 'https://nominatim.openstreetmap.org/search'  # URL de l'API OpenStreetMap Nominatim
    params = {
        'q': query,           
        'format': 'json',     
        'addressdetails': 1,  
        'limit': 5,           
    }
    response = requests.get(url, params=params)  #  la requête HTTP GET vers Nominatim
    data = response.json()                        # on parse  la réponse JSON
    return JsonResponse(data, safe=False)         #on renvoie la réponse JSON au front

@login_required
def update_role(request):
    user = request.user
    if request.method == "POST":
        form= forms.UploadRoleForm(request.POST, instance= user)
        if form.is_valid():
            form.save()
            return redirect('profil_user')
    else:
        form = forms.UploadRoleForm(instance= user)
    return render (request, 'authentication/update_role.html', {'form': form, 'user':user})




@login_required

def suggestions_pour_passager(request):
    user = request.user
    suggestions_passagers = generate_suggestions_passagers(user)
    return render (request, 'authentication/dashboard.html', {'suggestions_passagers': suggestions_passagers})


@login_required
def suggestions_pour_conducteur(request):
    user = request.user
    suggestions_conducteur = generate_suggestions_conducteurs(user)
    return render (request, 'authentication/dashboard.html', {'suggestions_conducteur': suggestions_conducteur})

@login_required
def delete_photo_profil(request):
    user = request.user
    if user.photo_profil:
        user.photo_profil.delete(save= False)
        user.save()
    return redirect ('profil_user')








@login_required
@require_GET
def search_users(request):
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return JsonResponse([], safe=False)

    User = get_user_model()
    users = User.objects.filter(
        models.Q(first_name__icontains=query) |
        models.Q(last_name__icontains=query) |
        models.Q(email__icontains=query) |
        models.Q(numero_telephone__icontains=query)
    )[:10]  # Limite à 10 résultats

    data = [
        {
            'id': u.id,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'email': u.email,
            'numero_telephone': u.numero_telephone,
        }
        for u in users
    ]
    return JsonResponse(data, safe=False)
