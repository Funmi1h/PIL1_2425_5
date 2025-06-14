from django import forms
from authentication.models import User



class ConducteurForm(forms.ModelForm):
    class Meta:
        model = User
        # On suppose que le modèle User a les champs 'adresse' et 'nb_places'
        fields = ['adresse', 'nb_places']
        widgets = {
            'adresse': forms.TextInput(attrs={'placeholder': 'Adresse ou repère' , 'id' : 'id_addresse_conducteur'}),
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

        
        


class PassagerForm(forms.ModelForm):
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

    