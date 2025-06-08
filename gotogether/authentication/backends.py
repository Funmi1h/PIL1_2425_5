from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

# L'authentification personnalisée avec l'email ou le numéro de téléphone
class EmailOrPhoneBackend(ModelBackend):
    def authenticate(self, request, username = None, password = None, **kwargs): # username et password sont rendus optionnels avec None
        UserModel = get_user_model()# on recupere le modele utilisateur utilisé dans le projet
        try:
            user = UserModel.objects.get(Q(email = username)| Q(numero_telephone = username)) # on verifie si l'utilisateur existe avec l'email ou le numero de telephone

        except UserModel.DoesNotExist: # lorsqu'on ne trouve aucun utilisateur correspondant
            # Si l'utilisateur n'existe pas, on retourne None
            return None

        if user.check_password(password):
            return user
        return None