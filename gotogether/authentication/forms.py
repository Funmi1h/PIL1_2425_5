from django import forms
from django.contrib.auth import get_user_model
from algorithme.models import Conducteur , Passager
import re
# formulaire pour la connexion des utilisateurs
class LoginForm(forms.Form):
    
    identifiant = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'E-mail ou numero de téléphone'}),
        label='Email ou numero de telephone'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Mot de passe'}),
        label='Mot de passe'
    )

# formulaire  pour l'inscription des utilisateurs

class SignUpForm(forms.ModelForm):

    # on definit les champs du formulaire d'inscription
    last_name = forms.CharField(required= True,
        widget=forms.TextInput(attrs= {'placeholder':'Last name'}))

    first_name = forms.CharField(required= True,
        widget=forms.TextInput(attrs = {'placeholder' : 'First name'}),
        label= 'First name',
    )
    
    email = forms.EmailField(required= True, 
        widget=forms.TextInput(attrs = { 'placeholder ' : 'Email'}))
    
    numero_telephone = forms.CharField(required= True,
        widget=forms.TextInput(attrs = {'placeholder ' : 'Numéro de téléphone '}))
    
    role = forms.ChoiceField(
        choices=[('conducteur', 'Conducteur'), ('passager', 'Passager')],
        required=True
    )

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Mot de passe'}),
        label='Mot de passe',
        required=True,
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Confirmez le mot de passe'}),
        label='Confirmez le mot de passe',
        required=True,
    )

    class Meta:
        
        model = get_user_model() # on utilise le modele utilisateur défini dans le projet
        # on definit les champs du formulaire
        fields = ['last_name', 'first_name', 'email', 'numero_telephone', 'role', 'password', 'confirm_password']

        widgets = {
            'last_name': forms.TextInput(attrs={'placeholder': 'Nom'}),
            'first_name': forms.TextInput(attrs={'placeholder': 'Prénom'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Adresse e-mail'}),
            'numero_telephone': forms.TextInput(attrs={'placeholder': 'Numéro de téléphone'}),
            'role': forms.RadioSelect(),
        }
        labels = {
            'last_name': 'Nom',
            'first_name': 'Prénom',
            'email': 'E-mail',
            'numero_telephone': 'Numéro de téléphone',
            'role': 'Rôle',
            'Mot_de_passe': 'Mot de passe',
        } 
    # Surcharge de la méthode clean pour valider les données du formulaire


    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password") # on recupere le mot de passe
        confirm_password = cleaned_data.get("confirm_password") # on recupere la confirmation du mot de passe
        email = cleaned_data.get("email")
        numero_telephone = cleaned_data.get("numero_telephone")
        

        # Vérification unicité email
        if get_user_model().objects.filter(email=email).exists():
            self.add_error('email', "Cet e-mail est déjà utilisé. Veuillez en choisir un autre.")

        # Vérification unicité numéro de téléphone
        if get_user_model().objects.filter(numero_telephone=numero_telephone).exists():
            self.add_error('numero_telephone', "Ce numéro de téléphone est déjà utilisé. Veuillez en choisir un autre.")

        # Vérification mot de passe identique
        if password and confirm_password and password != confirm_password:
            self.add_error('confirm_password', "Les mots de passe ne correspondent pas.")
    
    def save(self, commit=True):
        # Créer l'utilisateur avant de créer le profil
        user = get_user_model()(
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name'],
            email=self.cleaned_data['email'],
            
            numero_telephone=self.cleaned_data['numero_telephone'],
            username=self.cleaned_data['email'], 
        )
        user.set_password(self.cleaned_data['password'])

        if commit:
            user.save() 

            role = self.cleaned_data.get('role')
            if role == 'passager':
                Passager.objects.create(user=user)
            elif role == 'conducteur':
                Conducteur.objects.create(user=user)
        return user

    # methode pour valider le numero de telephone
    def clean_numero_telephone(self):
        numero = self.cleaned_data.get('numero_telephone', '').replace(' ', '').replace('-', '')

        # Expression régulière pour un numéro béninois valide (nouveau plan à 8 chiffres, tous préfixes autorisés)
        pattern = re.compile(r'^(?:\+229|229|0)?\d{8}$')

        if not pattern.match(numero):
            raise forms.ValidationError("Entrez un numéro béninois valide au format : +229 01XXXXXXX.")

        # Uniformiser le format → toujours +229XXXXXXXX
        if numero.startswith('0'):
            numero = '+229' + numero[1:]
        elif numero.startswith('229'):
            numero = '+229' + numero[3:]
        elif not numero.startswith('+229'):
            numero = '+229' + numero

        # Vérification d'unicité
        if get_user_model().objects.filter(numero_telephone=numero).exists():
            raise forms.ValidationError("Ce numéro est déjà utilisé.")

        return numero




# Formulaire pour changer la photo de profil

class UploadProfilePhotoForm(forms.ModelForm):
    class Meta:
        model = get_user_model()
        fields= ['photo_profil']
        widgets = {'photo_profil': forms.FileInput(attrs={'class': 'form-control'})}



# Formulaire pour le profil 

class ProfilForm(forms.ModelForm):
    class Meta:
        model = get_user_model()
        fields = ['first_name', 'last_name', 'email', 'numero_telephone', 'role', 'heure_depart', 'heure_arrivee', 'adresse', 'marque_voiture']
        labels = {
            'first_name': 'Prénom',
            'last_name' : 'Nom',
            'email': 'E-mail',
            'numero_telephone': 'Numéro de téléphone',
            'role' : 'Role',
            'heure_depart' : 'Heure de départ habituel ',
            'heure_arrivee': 'Heure d\'arrivée habituel',
            'adresse': 'Emplacement habituel',
            'marque_voiture' : 'Marque de la voiture ',            
        }

        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder': 'Prénom'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Nom'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Adresse e-mail'}),
            'numero_telephone': forms.TextInput(attrs={'placeholder': 'Numéro de téléphone'}),
            'role': forms.RadioSelect(),
            'heure_depart' : forms.TimeInput(attrs={'type': 'time'}),
            'heure_arrivee': forms.TimeInput(attrs={'type': 'time'}),
            'adresse': forms.TextInput(),
            'marque_voiture' : forms.TextInput(),            
        }


#Formulaire pour modifier le role

class UploadRoleForm(forms.ModelForm):
    class Meta:
        model = get_user_model()
        fields= ['role']
        widgets = {'role': forms.RadioSelect(attrs={'class': 'form-control'})}
