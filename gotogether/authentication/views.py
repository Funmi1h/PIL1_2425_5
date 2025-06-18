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

from django.db import models
from algorithme.utils import generate_suggestions_conducteurs , generate_suggestions_passagers

from algorithme.models import TrajetOffert , DemandeTrajet


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
            return redirect('profil_user')
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
@login_required
def dashboard(request):
    user = request.user
    context = {
        'user': user,
        'page_title': 'Mon Tableau de Bord'
    }

    if user.role == 'conducteur':
        
        suggestions_passagers = generate_suggestions_passagers(user, rayon_km=10, tolerance_minutes=45)
        context['suggestions_passagers'] = suggestions_passagers
        
       
     

    elif user.role == 'passager':

        suggestions_conducteurs = generate_suggestions_conducteurs(user, rayon_km=10, tolerance_minutes=45)
        context['suggestions_conducteurs'] = suggestions_conducteurs
       
       
        
    return render (request,'authentication/dashboard.html', context={'user' : user})


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
