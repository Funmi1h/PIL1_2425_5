from django import forms
from authentication.models import User
from .models import Conducteur, Client

client = User.objects.filter(role='passager')
conducteur = User.objects.filter(role='conducteur') 

class ConducteurForm(forms.ModelForm):
    class Meta:
        model = conducteur
        adresse = forms.CharField(
            max_length= 100,
            label= 'Entrez votre adresse' , 
            widget= forms.TextInput(attrs={'placeholder':'Adresse ou repère'})
        )
        
        nb_places = forms.IntegerField(
            label= 'nombre de places du véhicule', 
            widget= forms.TextInput(attrs={'placeholder':'nombre de places'})
        ) 

        
        


class ClientForm(forms.ModelForm):
    class Meta:
        model = client

        adresse = forms.CharField(
            max_length= 100,
            label= 'Entrez votre adresse' , 
            widget= forms.TextInput(attrs={'placeholder':'Adresse ou repère'})
        ) 

        