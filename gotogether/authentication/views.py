from django.shortcuts import render, redirect
from . import forms
from django.contrib.auth.views import LoginView
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from .models import User


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
                    return render(request, 'core/home.html', {'user': user})
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


# mettre ajour la photo de profil
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
    user_profil = 
    user = request.user
