from django.urls import path
from . import views
urlpatterns = [
    path('client_form/', views.client_view, name='client_form'),
    path('conducteur_form/', views.conducteur_view, name='conducteur_form'),
    path('conducteurs_proches/', views.conducteurs_proches, name='conducteurs_proches'),
]