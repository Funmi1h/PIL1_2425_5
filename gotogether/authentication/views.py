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
from algorithme.utils import generate_suggestions_passagers
from django.contrib import messages



class LoginView(LoginView):
    template_name = 'authentication/login.html'
    form_class = forms.LoginForm
    redirect_authenticated_user = True
    def get(self, request):
        if request.method == 'GET':
            form = self.form_class()
            return render(request, self.template_name, {'form': form})
        
    def post(self, request):

        if request.method == 'POST':
            form = self.form_class(request.POST)
            if form.is_valid():
                identifiant = form.cleaned_data.get('identifiant')# on recupere l'identifiant de l'utilisateur
                password = form.cleaned_data.get('password')
                user = authenticate(request, username=identifiant, password=password)
                if user is not None:
                    login(request, user)
                    
                    return render(request, 'authentication/dashboard.html', {'user': user})
                else:
                    return render(request, self.template_name, {'form': form, 'message': 'Identifiant ou mot de passe incorrect.'})
            else:
                return render(request, self.template_name, {'form': form})


# vue pour inscription des utilisateurs

def signup(request):
    # si la requete est de type POST, on traite le formulaire d'inscription
    if request.method == 'POST':
        form = forms.SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False) # on crée l'utilisateur sans le sauvegarder dans la base de données
            # on récupere les deux mots de passe
            password = form.cleaned_data.get('password')
            confirm_password = form.cleaned_data.get('confirm_password')

            # on verifie si les deux mots de passe sont identiques
            if password == confirm_password:
                user.set_password(password)  # hasher le mot de passe
                user.save()
                return render(request, 'authentication/profil.html', {'user': user})
            else:
                return render(request, 'authentication/sign_up.html', {'form': form, 'message': 'Les mots de passe ne correspondent pas.'})
        else:
            return render(request, 'authentication/sign_up.html', {'form': form, 'message': 'Veuillez corriger les erreurs dans le formulaire.'})
    # quand la requete est de type GET, on affiche le formulaire d'inscription
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
def delete_photo_profil(request):
    user = request.user
    if user.photo_profil:
        user.photo_profil.delete(save= False)
        user.save()
    return redirect ('profil_user')
