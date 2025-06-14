from django.urls import path
from . import views
urlpatterns = [
    path('formulaire_role/', views.formulaire_view, name='formulaire_role'),
]