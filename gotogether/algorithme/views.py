from django.shortcuts import render
from .utils import find_conducteurs_les_plus_proches
from .models import Client, Conducteur
from django.http import JsonResponse

# Create your views here.
