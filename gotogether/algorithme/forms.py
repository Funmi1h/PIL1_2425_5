from django import forms
from authentication.models import User



class UserForm(forms.ModelForm):
    class Meta:
        model = User
        # On suppose que le modèle User a les champs 'adresse' et 'nb_places'
        fields = ['adresse', 'nb_places']
        widgets = {
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

        
        


"""class PassagerForm(forms.ModelForm):
    class Meta:
        model = User
        # On suppose que le modèle User a le champ 'adresse'
        fields = ['adresse']
        widgets = {
            'adresse': forms.TextInput(attrs={'placeholder': 'Adresse ou repère' ,  'id' : 'id_addresse_passager'})
        }

        adresse = forms.CharField(
            max_length= 100,
            label= 'Entrez votre adresse' , 
            widget= forms.TextInput(attrs={'placeholder':'Adresse ou repère' })
        ) 

    """
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