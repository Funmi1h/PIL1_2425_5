from django import forms
from authentication.models import User 
from algorithme.models import TrajetOffert , DemandeTrajet , Passager
from datetime import datetime , date
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

    heure_depart_passager = forms.TimeField(
        label="Heure de départ souhaitée",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time' , 'class': 'form-control'})
    )
    heure_arrivee_passager = forms.TimeField(
        label="Heure d'arrivée souhaitée (optionnel)",
        required=False,
        widget=forms.TimeInput(attrs={'type': 'time' , 'class': 'form-control'})
    )

    date_depart_passager = forms.DateField(label="Date de départ" , 
        required=False , 
        widget=forms.DateInput(attrs={'type': 'date'}))

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
            'adresse_arrivee', 'latitude_arrivee', 'longitude_arrivee', 'heure_arrivee_prevue','nb_places_disponibles', 'date_depart']

        widgets = {
            'heure_depart_prevue': forms.TimeInput(attrs={'type': 'time'}),
            'heure_arrivee_prevue': forms.TimeInput(attrs={'type': 'time'}),
            'latitude_depart': forms.HiddenInput(),
            'longitude_depart': forms.HiddenInput(),
            'latitude_arrivee': forms.HiddenInput(),
            'longitude_arrivee': forms.HiddenInput(),
            'date_depart': forms.DateInput(attrs={'type': 'date'})
        }
        labels = {
            'adresse_depart': "Adresse de départ de votre trajet",
            'heure_depart_prevue': "Heure de départ prévues",
            'nb_places_disponibles': "Nombre de places disponibles pour ce trajet",
        }
    def clean(self):
        cleaned_data = super().clean()
        
        date_depart = cleaned_data.get('date_depart')
        heure_depart_prevue = cleaned_data.get('heure_depart_prevue')

        # ... autres champs ...

        # Validation de la date et l'heure de départ par rapport au passé
        if date_depart and heure_depart_prevue: # Est-ce que ces deux champs sont toujours présents et non None?
            combined_datetime_depart_naive = datetime.combine(date_depart, heure_depart_prevue)
            
            # Rendez le datetime 'aware' en lui assignant le fuseau horaire actuel
            combined_datetime_depart_aware = timezone.make_aware(combined_datetime_depart_naive) 
            
            # --- POINT CRITIQUE ICI ---
            # timezone.now() inclut aussi la date, l'heure, les minutes et les SECONDES.
            # Si tu définis la date de départ et l'heure de départ comme "aujourd'hui 18:40",
            # mais que timezone.now() est "aujourd'hui 18:40:45", alors "18:40" est dans le passé.
            # Cependant, si tu as choisi "aujourd'hui 18:40" et qu'il est "aujourd'hui 18:39",
            # la condition combined_datetime_depart_aware < timezone.now() devrait être VRAIE.
            #
            # Pour tester, essaie de mettre la date à hier, ou l'heure à une heure clairement passée.
            # Par exemple, si tu as mis "18 juin 2025 à 10:00" et qu'il est "18 juin 2025 à 18:40".
            #
            if combined_datetime_depart_aware < timezone.now(): 
                # Si cette ligne n'est pas atteinte, c'est que la condition ci-dessus est False.
                print("DEBUG: Date/heure départ est dans le passé, ajout d'erreur.") # Ajoutons un print de debug
                self.add_error('date_depart', "La date et l'heure de départ ne peuvent pas être dans le passé.")
        elif date_depart is None:
             self.add_error('date_depart', "La date de départ est requise.")
        elif heure_depart_prevue is None:
             self.add_error('heure_depart_prevue', "L'heure de départ est requise.")

        return cleaned_data
        


# ...
class DemandeTrajetForm(forms.ModelForm):
    class Meta:
        model = DemandeTrajet
        fields = [
            'adresse_depart', 'latitude_depart', 'longitude_depart',
            'heure_depart_prevue', 'date_depart', # Assurez-vous que 'date_depart' est bien là
            'adresse_arrivee', 'latitude_arrivee', 'longitude_arrivee',
            'heure_arrivee_prevue',
        ]
        widgets = {
            # Utilisez TimeInput pour les heures
            'heure_depart_prevue': forms.TimeInput(attrs={'type': 'time'}),
            'heure_arrivee_prevue': forms.TimeInput(attrs={'type': 'time'}),
            'latitude_depart': forms.HiddenInput(),
            'longitude_depart': forms.HiddenInput(),
            'latitude_arrivee': forms.HiddenInput(),
            'longitude_arrivee': forms.HiddenInput(),
            # Ajoutez un widget pour la date
            'date_depart': forms.DateInput(attrs={'type': 'date'}),
        }
        labels = {
            'adresse_depart': "Adresse de départ souhaitée",
            'heure_depart_prevue': "Heure de départ souhaitée", # Le label doit refléter que c'est juste l'heure
            'date_depart': "Date de départ souhaitée", # Nouveau label pour la date
            'adresse_arrivee': "Adresse d'arrivée souhaitée (optionnel)",
            'heure_arrivee_prevue': "Heure d'arrivée souhaitée (optionnel)", 
        }


    def clean(self):
        cleaned_data = super().clean()

        # Récupération des données nettoyées
        date_depart = cleaned_data.get('date_depart')
        heure_depart_prevue = cleaned_data.get('heure_depart_prevue')
        adresse_arrivee = cleaned_data.get('adresse_arrivee')
        heure_arrivee_prevue = cleaned_data.get('heure_arrivee_prevue')

        # --- Validations pour la date et l'heure de départ ---
        if date_depart and heure_depart_prevue:
            # Combiner la date et l'heure de départ en un objet datetime
            depart_datetime = datetime.combine(date_depart, heure_depart_prevue)

            # 1. Empêcher une date ou une heure passée pour le départ
            if depart_datetime < datetime.now():
                self.add_error(
                    'date_depart',
                    "La date de départ ne peut pas être dans le passé."
                )
                self.add_error(
                    'heure_depart_prevue',
                    "L'heure de départ ne peut pas être dans le passé."
                )

        # --- Validations pour l'arrivée (si l'adresse d'arrivée est renseignée) ---
        if adresse_arrivee:
            # 2. Rendre heure_arrivee_prevue obligatoire si adresse_arrivee est renseignée
            if not heure_arrivee_prevue:
                self.add_error(
                    'heure_arrivee_prevue',
                    "L'heure d'arrivée est obligatoire si une adresse d'arrivée est spécifiée."
                )
            
            # 3. S'assurer que l'heure d'arrivée est après l'heure de départ si les deux sont présentes
            if date_depart and heure_depart_prevue and heure_arrivee_prevue:
                # Créer des objets time_only pour la comparaison directe des heures
                # C'est plus simple que de combiner les dates si on ne compare que les heures
                
                # Si le départ et l'arrivée sont le même jour (par défaut dans ce contexte simple)
                if heure_arrivee_prevue <= heure_depart_prevue:
                     self.add_error(
                        'heure_arrivee_prevue',
                        "L'heure d'arrivée prévue doit être après l'heure de départ prévue."
                    )
                # Note: Pour une validation multi-jours, il faudrait comparer des objets datetime complets,
                # mais pour des trajets journaliers, la comparaison des heures suffit souvent.
                # Si vous avez besoin de gérer les trajets sur plusieurs jours, il faudrait
                # un champ 'date_arrivee' et une logique plus complexe.

        return cleaned_data

 

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