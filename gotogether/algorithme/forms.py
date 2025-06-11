from django import forms
from .models import Client, Conducteur



class ConducteurForm(forms.ModelForm):
    class Meta:
        model = Conducteur
        fields = ['latitude_conducteur', 'longitude_conducteur', 'nb_places', 'adresse']
        widgets = {
            'latitude_conducteur': forms.NumberInput(attrs={'step': 'any'}),
            'longitude_conducteur': forms.NumberInput(attrs={'step': 'any'}),
            'nb_places': forms.NumberInput(attrs={'min': 1, 'max': 5}),
            'adresse': forms.TextInput(attrs={'placeholder': 'Indiquez votre adresse'}),
        }


class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['latitude_client', 'longitude_client', 'adresse']
        widgets = {
            'latitude_client': forms.NumberInput(attrs={'step': 'any'}),
            'longitude_client': forms.NumberInput(attrs={'step': 'any'}),
            'adresse': forms.TextInput(attrs={'placeholder': 'Indiquez votre adresse'}),
        }