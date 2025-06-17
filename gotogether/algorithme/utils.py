from math import radians, sin, cos, sqrt, atan2 ,asin
from datetime import datetime, timedelta

from .models import TrajetOffert
# Formule de haversine pour le calcul de la distance entre deux points géographiques
def Haversine(lat1, lon1, lat2, lon2):
    # Convertion des degrés en radians
    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    Rayon = 6371  # Rayon de la Terre en kilomètres
    distance = 2 * Rayon * asin (sqrt(
        (sin(dlat / 2))**2 + cos(lat1)*cos(lat2)* (sin(dlon / 2 ))**2
    ) ) 
    return distance

def find_conducteurs_les_plus_proches(client_latitude, client_longitude, conducteurs):
    """
    Trouve les conducteurs les plus proches du client.
    """
    conducteurs_proches = []
    top_5_conducteurs = []      # Nombre de conducteurs à retourner
    for conducteur in conducteurs:
        distance = Haversine(client_latitude, client_longitude, float(conducteur.latitude) , float(conducteur.longitude))

        conducteurs_proches.append({'user' : conducteur, 'distance' : distance})
    # Trier les conducteurs par distance
    conducteurs_proches.sort(key=lambda x: x['distance'])
    # Retourner les 5 conducteurs les plus proches
    """ for conducteur, distance in conducteurs_proches[:5]:
        top_5_conducteurs.append({
            'conducteur': conducteur,
            'distance': distance
        }) """
    return conducteurs_proches



# Pour générer les suggestions

def generate_suggestions_passagers(user, rayon_km, tolerance_minutes =30):
    if user.role != 'passager' or not user.latitude or not user.longitude:
        return []
    

    trajets_actifs = TrajetOffert.objects.filter(est_actif=True, nb_places_disponibles__gt=0)
    suggestions = []

    for trajet in trajets_actifs:
        dist_depart = Haversine(user.latitude, user.longitude, trajet.latitude_depart, trajet.longitude_depart)

        if dist_depart <= rayon_km:
            if user.heure_depart :
                heure_depart_hab = datetime.combine(datetime.today(), user.heure_depart)
                tolerance = timedelta(minutes= tolerance_minutes)

            if abs(trajet.heure_depart_prevue - heure_depart_hab)<= tolerance:
                suggestions.append(trajet)
    

    return suggestions