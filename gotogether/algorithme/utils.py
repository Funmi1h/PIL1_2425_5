from math import radians, sin, cos, sqrt, atan2 ,asin
from datetime import datetime, timedelta
from . import models
from .models import TrajetOffert
from datetime import datetime, timedelta, date
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

    for conducteur in conducteurs:
        distance = Haversine(client_latitude, client_longitude, float(conducteur.latitude_depart) , float(conducteur.longitude_depart))

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

def generate_suggestions_passagers(user, rayon_km=10, tolerance_minutes=45, limit=5):

    
    from algorithme.models import TrajetOffert, DemandeTrajet 

    
    if user.role != 'passager':
        return []

    
    der_demandes_passager = DemandeTrajet.objects.filter(passager=user)

    
    if not der_demandes_passager:
        return []

    suggestions = []
    

    
    for demande_du_passager in der_demandes_passager: 
        
        
        demande_lat = demande_du_passager.latitude_depart
        demande_lon = demande_du_passager.longitude_depart
        
        
        if demande_lat is None or demande_lon is None:
            continue 

       
        demande_time_comparable = datetime.combine(date.today(), demande_du_passager.heure_depart_prevue)

        
        trajets_actifs = TrajetOffert.objects.filter(
            est_actif=True,
            nb_places_disponibles__gt=0,
            date_depart__gte=date.today() 
        )

        tolerance = timedelta(minutes=tolerance_minutes)

        
        for trajet_offre in trajets_actifs: 
            dist_depart = Haversine(
                demande_lat, demande_lon,
                trajet_offre.latitude_depart, trajet_offre.longitude_depart
            )

            
            if dist_depart <= rayon_km:
                
                offre_time_comparable = datetime.combine(date.today(), trajet_offre.heure_depart_prevue)

                
                if abs(offre_time_comparable - demande_time_comparable) <= tolerance:
                        suggestions.append(trajet_offre)

            
            
            if len(suggestions) >= limit:
                break 
        
        
        if len(suggestions) >= limit:
            break

    
    return suggestions[:limit]




# pour les conducteurs 
def generate_suggestions_conducteurs(user, rayon_km=10, tolerance_minutes=45, limit=5):
  
    from algorithme.models import TrajetOffert, DemandeTrajet

    if user.role != 'conducteur':
        return []

   
    der_offres_conducteur = TrajetOffert.objects.filter(conducteur=user)

    if not der_offres_conducteur:
        return []

    suggestions = []
    

    
    for offre_du_conducteur in der_offres_conducteur:
        
        
        offre_lat = offre_du_conducteur.latitude_depart
        offre_lon = offre_du_conducteur.longitude_depart 
        
        if offre_lat is None or offre_lon is None:
            continue

        
        offre_time_comparable = datetime.combine(date.today(), offre_du_conducteur.heure_depart_prevue)

       
        demandes_actives = DemandeTrajet.objects.filter(
            est_actif=True,
            date_trajet__gte=date.today()
        ) 

        tolerance = timedelta(minutes=tolerance_minutes)

        
        for demande_passager in demandes_actives:
            dist_depart = Haversine(
                offre_lat, offre_lon,
                demande_passager.latitude_depart, demande_passager.longitude_depart
            )

            if dist_depart <= rayon_km:
                
                demande_time_comparable = datetime.combine(date.today(), demande_passager.heure_depart_souhaitee)

               
                if abs(demande_time_comparable - offre_time_comparable) <= tolerance:
                
                        suggestions.append(demande_passager)
                        

            if len(suggestions) >= limit:
                break
        
        if len(suggestions) >= limit:
            break

    return suggestions[:limit]



