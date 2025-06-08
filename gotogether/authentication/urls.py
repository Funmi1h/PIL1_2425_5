from django.urls import path
from . import views
urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('sign_up/', views.signup, name='sign_up'), 
    path('profil/', views.profil_user, name= 'profil_user'),
    path('dashboard/', views.dashboard, name = 'dashboard'),
    path('logout/', views.logout,name ='logout')
]

