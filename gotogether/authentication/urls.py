from django.urls import path
from . import views
urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('sign_up/', views.signup, name='sign_up'), 
    path('profil/', views.profil_user, name= 'profil_user'),
    path('dashboard/', views.dashboard, name = 'dashboard'),
    path('logout/', views.logout_user,name ='logout'),
    path('auth/change_user_password', views.upload_password, name= 'upload_password'),
    path('auth/change_user_profile_photo',  views.upload_profile_photo, name= 'update_photo_profil')
    
]

