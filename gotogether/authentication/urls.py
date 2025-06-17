from django.urls import path
from . import views

from django.contrib.auth import views as auth_views
urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('sign_up/', views.signup, name='sign_up'), 
    path('profil/', views.profil_user, name= 'profil_user'),
    path('dashboard/', views.dashboard, name = 'dashboard'),
    path('logout/', views.logout_user,name ='logout'),
    path('change_user_password', views.upload_password, name= 'upload_password'),
    path('change_user_profile_photo',  views.upload_profile_photo, name= 'update_photo_profil'),
    path('update_profile/', views.modifier_profil, name= 'changer_profil' ),
     path('mot-de-passe-oublie/', auth_views.PasswordResetView.as_view(
        template_name='authentication/password_reset_form.html'
    ), name='password_reset'),

    path('mot-de-passe-envoye/', auth_views.PasswordResetDoneView.as_view(
        template_name='authentication/password_reset_done.html'
    ), name='password_reset_done'),

    path('reinitialisation/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='authentication/password_reset_confirm.html'
    ), name='password_reset_confirm'),

    path('mot-de-passe-termine/', auth_views.PasswordResetCompleteView.as_view(
        template_name='authentication/password_reset_complete.html'
    ), name='password_reset_complete'),

    path('geocode_proxy/', views.geocode_proxy, name='geocode_proxy'),
    path('update_role/', views.update_role, name= 'update_role'),
    path('delete-photo-profil/', views.delete_photo_profil, name= 'delete_photo_profil')
    
]

