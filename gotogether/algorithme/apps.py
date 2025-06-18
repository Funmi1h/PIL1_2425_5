from django.apps import AppConfig



class AlgorithmeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'algorithme'
    def ready(self):
        import authentication.signal
