from django.urls import path
from . import views
from algorithme.views import action_button_redirect , mes_trajets_offerts_view
urlpatterns = [
    path('formulaire_role/', views.formulaire_view, name='formulaire_role'),
    path('creer-demande-trajet/' , views.créer_demande_trajet_view , name='creer_demande_trajet'),
    path('rechercher-trajets/', views.rechercher_trajets_view , name='rechercher_trajets_existants'),
    path('proposer-trajet/', views.proposer_trajet_view, name='proposer_trajet'),
    path('proposer-action/', views.action_button_redirect, name='action_button_redirect'),
    
    path('mes-trajets-offerts/', views.mes_trajets_offerts_view, name='mes_trajets_offerts')
]