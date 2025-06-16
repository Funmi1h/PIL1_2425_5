from django import forms
from authentication.models import User
from algorithme.models import TrajetOffert



class UserForm(forms.ModelForm):
    class Meta:
        model = User
        # Les champs dont on a besoin
        fields = ['adresse', 'nb_places' , 'latitude' , 'longitude']
        widgets = {
            'latitude': forms.NumberInput(attrs={'step': 'any'}),
            'longitude': forms.NumberInput(attrs={'step': 'any'}),
            'adresse': forms.TextInput(attrs={'placeholder': 'Adresse ou repère'}),
            'nb_places': forms.TextInput(attrs={'placeholder': 'Nombre de places'}),
        }
        adresse = forms.CharField(
            max_length= 100,
            label= 'Entrez votre adresse' , 
            widget= 
                forms.TextInput(attrs={'placeholder':'Adresse ou repère'})
        )
        
        nb_places = forms.IntegerField(
            label= 'nombre de places du véhicule', 
            widget= forms.TextInput(attrs={'placeholder':'nombre de places'})
        ) 
    def __init__(self, *args, **kwargs):
        # 1. Récupérez la variable 'is_conducteur' passée depuis la vue
        is_conducteur = kwargs.pop('is_conducteur', False) 
        super().__init__(*args, **kwargs)

        # 2. Définissez si 'nb_places' est obligatoire en fonction de 'is_conducteur'
        self.fields['nb_places'].required = is_conducteur # Ceci rend le champ obligatoire dans le HTML et pour la validation de base de Django

        # Définition de la valeur initiale pour l'adresse
        if not self.initial.get('adresse') and not self.data.get('adresse'):
            self.fields['adresse'].initial = "Cotonou, Bénin"

        
class RechercheConducteurForm(forms.Form):
    adresse_depart = forms.CharField(
        label="Votre adresse de départ",
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': 'Entrez votre adresse de départ'})
    )
    latitude_depart = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any'})
    )
    longitude_depart = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any'})
    )

    heure_depart = forms.TimeField(
        label="Heure de départ souhaitée",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time'})
    )
    heure_arrivee = forms.TimeField(
        label="Heure d'arrivée souhaitée (optionnel)",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time'})
    )

    adresse_arrivee = forms.CharField(
        label="Votre adresse d'arrivée (optionnel)",
        max_length=255,
        required=True,
        widget=forms.TextInput(attrs={'placeholder': 'Entrez votre adresse d\'arrivée'})
    )
    latitude_arrivee = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=True,
        widget=forms.HiddenInput(attrs={'step': 'any'})
    )
    longitude_arrivee = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=True,
        widget=forms.HiddenInput(attrs={'step': 'any'})
    )

class ProposerTrajetForm(forms.ModelForm):
    # Vous pouvez ajouter des champs non-modèle si nécessaire, ex: confirmer_disponibilite = forms.BooleanField(...)
    
    class Meta:
        model = TrajetOffert
        # Champs que le conducteur remplit pour proposer un trajet
        fields = [
            'adresse_depart', 'latitude_depart', 'longitude_depart', 'heure_depart_prevue',
            'adresse_arrivee', 'latitude_arrivee', 'longitude_arrivee', 'heure_arrivee_prevue',
            'nb_places_disponibles', 
        ]
        widgets = {
            'heure_depart_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'heure_arrivee_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
        labels = {
            'adresse_depart': "Adresse de départ de votre trajet",
            'heure_depart_prevue': "Date et heure de départ prévues",
            'nb_places_disponibles': "Nombre de places disponibles pour ce trajet",
        }




def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get('role')
        nb_places = cleaned_data.get('nb_places')

        if role == 'conducteur' and (nb_places is None or nb_places <= 0):
            self.add_error('nb_places', "Le nombre de places est requis pour un conducteur.")
        
        # Vous pouvez ajouter d'autres validations ici (par ex. adresse si rôle est défini)
        adresse = cleaned_data.get('adresse')
        if role in ['conducteur', 'passager'] and not adresse:
            self.add_error('adresse', "L'adresse est requise pour le rôle sélectionné.")
            
        return cleaned_data