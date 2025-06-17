from django.urls import path
from . import views
urlpatterns = [
    path('formulaire_role/', views.formulaire_view, name='formulaire_role'),
    path('creer-demande-trajet/' , views.créer_demande_trajet_view , name='creer_demande_trajet'),
    path('rechercher-trajets/', views.rechercher_trajets_view , name='rechercher_trajets_existants'),
    path('proposer-trajet/', views.proposer_trajet_view, name='proposer_trajet')
]