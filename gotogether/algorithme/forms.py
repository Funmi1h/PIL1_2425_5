from django import forms
from authentication.models import User
from algorithme.models import TrajetOffert , DemandeTrajet
from datetime import datetime
from django.utils import timezone



class UserForm(forms.ModelForm):
    class Meta:
        model = User
       
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
        is_conducteur = kwargs.pop('is_conducteur', False) 
        super().__init__(*args, **kwargs)

        self.fields['nb_places'].required = is_conducteur 

        if not self.initial.get('adresse') and not self.data.get('adresse'):
            self.fields['adresse'].initial = "Cotonou, Bénin"

        
class RechercheConducteurForm(forms.Form):
    adresse_depart = forms.CharField(
        label="Votre adresse de départ",
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': 'Entrez votre adresse de départ' , 'id' :'id_adresse_depart'})
    )
    latitude_depart = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any', 'id' : 'id_latitude_depart_search'})
    )
    longitude_depart = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any',  'id' : 'id_longitude_depart_search'})
    )

    heure_depart = forms.TimeField(
        label="Heure de départ souhaitée",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time' , 'class': 'form-control'})
    )
    heure_arrivee = forms.TimeField(
        label="Heure d'arrivée souhaitée (optionnel)",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time' , 'class': 'form-control'})
    )

    adresse_arrivee = forms.CharField(
        label="Votre adresse d'arrivée (optionnel)",
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Entrez votre adresse d\'arrivée' ,  'id' : 'id_adresse_arrivee'})
    )
    latitude_arrivee = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any' , 'id' : 'id_latitude_arrivee_search'})
    )
    longitude_arrivee = forms.DecimalField(
        max_digits=30,
        decimal_places=20,
        required=False,
        widget=forms.HiddenInput(attrs={'step': 'any' , 'id' : 'id_longitude_arrivee_search'})
    )
    def clean(self):
        cleaned_data = super().clean()
        
        adresse_depart = cleaned_data.get('adresse_depart')
        latitude_depart = cleaned_data.get('latitude_depart')
        longitude_depart = cleaned_data.get('longitude_depart')

        adresse_arrivee = cleaned_data.get('adresse_arrivee')
        latitude_arrivee = cleaned_data.get('latitude_arrivee')
        longitude_arrivee = cleaned_data.get('longitude_arrivee')

        heure_depart = cleaned_data.get('heure_depart')
        heure_arrivee = cleaned_data.get('heure_arrivee')
        date_depart = cleaned_data.get('date_depart') 

class ProposerTrajetForm(forms.ModelForm):
   
    
    class Meta:
        model = TrajetOffert
        fields = [
            'adresse_depart', 'latitude_depart', 'longitude_depart', 'heure_depart_prevue',
            'adresse_arrivee', 'latitude_arrivee', 'longitude_arrivee', 'heure_arrivee_prevue',
<<<<<<< HEAD
            'nb_places_disponibles', 
=======
            'nb_places_disponibles'
>>>>>>> 2a5589fe8c4448c6dd87de209c3bf5d33d1d6fdc
        ]
        widgets = {
            'heure_depart_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'heure_arrivee_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'latitude_depart': forms.HiddenInput(),
            'longitude_depart': forms.HiddenInput(),
            'latitude_arrivee': forms.HiddenInput(),
            'longitude_arrivee': forms.HiddenInput(),
        }
        labels = {
            'adresse_depart': "Adresse de départ de votre trajet",
            'heure_depart_prevue': "Date et heure de départ prévues",
            'nb_places_disponibles': "Nombre de places disponibles pour ce trajet",
        }
    def clean(self):
        cleaned_data = super().clean()
        
        adresse_depart = cleaned_data.get('adresse_depart')
        latitude_depart = cleaned_data.get('latitude_depart')
        longitude_depart = cleaned_data.get('longitude_depart')
        heure_depart_prevue = cleaned_data.get('heure_depart_prevue')

        adresse_arrivee = cleaned_data.get('adresse_arrivee')
        latitude_arrivee = cleaned_data.get('latitude_arrivee')
        longitude_arrivee = cleaned_data.get('longitude_arrivee')
        heure_arrivee_prevue = cleaned_data.get('heure_arrivee_prevue')
        
        if adresse_depart and (latitude_depart is None or longitude_depart is None):
            self.add_error('adresse_depart', "Veuillez rechercher et valider l'adresse de départ pour obtenir ses coordonnées.")
            if latitude_depart is None:
                self.add_error('latitude_depart', "Coordonnée de latitude de départ manquante.")
            if longitude_depart is None:
                self.add_error('longitude_depart', "Coordonnée de longitude de départ manquante.")

      
        if adresse_arrivee: 
            if latitude_arrivee is None or longitude_arrivee is None:
                self.add_error('adresse_arrivee', "Veuillez rechercher et valider l'adresse d'arrivée pour obtenir ses coordonnées.")
                if latitude_arrivee is None:
                    self.add_error('latitude_arrivee', "Coordonnée de latitude d'arrivée manquante.")
                if longitude_arrivee is None:
                    self.add_error('longitude_arrivee', "Coordonnée de longitude d'arrivée manquante.")
        elif not adresse_arrivee: 
            if latitude_arrivee is not None or longitude_arrivee is not None:
                cleaned_data['latitude_arrivee'] = None
                cleaned_data['longitude_arrivee'] = None
                

      
        if heure_depart_prevue :
            if heure_arrivee_prevue <= timezone.now():
                self.add_error('heure_arrivee_prevue', "L'heure d'arrivée prévue doit être après l'heure de départ prévue.")

   
        if heure_depart_prevue < timezone.now():
            self.add_error('heure_depart_prevue', "L'heure de départ ne peut pas être dans le passé.")
            
        return cleaned_data


class DemandeTrajetForm(forms.ModelForm):
    class Meta:
        model = DemandeTrajet
        fields = [
            'adresse_depart', 'latitude_depart', 'longitude_depart',
            'heure_depart_prevue',
            'adresse_arrivee', 'latitude_arrivee', 'longitude_arrivee',
            'heure_arrivee_prevue',
            
        ]
        widgets = {
                  'heure_depart_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'heure_arrivee_prevue': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'latitude_depart': forms.HiddenInput(),
            'longitude_depart': forms.HiddenInput(),
            'latitude_arrivee': forms.HiddenInput(),
            'longitude_arrivee': forms.HiddenInput(),
        }
        labels = {
            'adresse_depart': "Adresse de départ souhaitée",
            'heure_depart_prevue': "Date et heure de départ souhaitées",
            'adresse_arrivee': "Adresse d'arrivée souhaitée (optionnel)",
            'heure_arrivee_prevue': "Date et heure d'arrivée souhaitées (optionnel)",
            
        }




def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get('role')
        nb_places = cleaned_data.get('nb_places')

        if role == 'conducteur' and (nb_places is None or nb_places <= 0):
            self.add_error('nb_places', "Le nombre de places est requis pour un conducteur.")
       
        adresse = cleaned_data.get('adresse')
        if role in ['conducteur', 'passager'] and not adresse:
            self.add_error('adresse', "L'adresse est requise pour le rôle sélectionné.")
            
        return cleaned_data