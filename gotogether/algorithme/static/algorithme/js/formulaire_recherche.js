document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");
});

console.log("✅ Script formulaire_demande.js chargé !");
console.log("Leaflet.js est chargé :", typeof L !== "undefined");


 
// Initialisation de la carte
var map = L.map('map').setView([6.45, 2.35], 13); // Coordonnées pour Abomey-Calavi

// Ajout des tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Ajout d'un marqueur initial
var marker = L.marker([6.45, 2.35]).addTo(map);
marker.bindPopup("<b>Abomey-Calavi</b>").openPopup();

// Fonction pour ajouter un marqueur à la carte
var currentMarker = null;
function addMarker(lat, lng, popupContent) {
    // Si un marqueur existe déjà, le supprimer
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    currentMarker = L.marker([lat, lng]).addTo(map);
    currentMarker.bindPopup(popupContent).openPopup();
}

// Fonction pour mettre à jour les champs de coordonnées
function updateCoordinateFields(lat, lng) {
    var latitudeField = document.getElementById("id_latitude_depart");
    var longitudeField = document.getElementById("id_longitude_depart");

    if (latitudeField && longitudeField) {
        latitudeField.value = lat;
        longitudeField.value = lng;
        console.log("✅ Coordonnées mises à jour :", lat, lng);
        return true;
    } else {
        console.error("❌ Champs latitude/longitude introuvables !");
        return false;
    }
}

// Événement pour ajouter un marqueur au clic sur la carte
map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var popupContent = "<b>Position sélectionnée</b><br>Latitude: " + lat.toFixed(6) + "<br>Longitude: " + lng.toFixed(6);
    
    addMarker(lat, lng, popupContent);
    updateCoordinateFields(lat, lng);
});

// Récupération de la position de l'utilisateur
function getUserPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            map.setView([lat, lng], 13);
            
            var popupContent = "<b>Votre Position</b><br>Latitude: " + lat.toFixed(6) + "<br>Longitude: " + lng.toFixed(6);
            addMarker(lat, lng, popupContent);
            updateCoordinateFields(lat, lng);
        }, function(error) {
            console.error("Erreur géolocalisation:", error);
            alert("Erreur lors de la récupération de la position: " + error.message);
        });
    } else {
        alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
}

// Ajout d'un bouton pour récupérer la position de l'utilisateur
var userPositionButton = L.control({position: 'topright'}); 
userPositionButton.onAdd = function(map) {
    var button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
    button.innerHTML = 'Ma Position';
    button.style.backgroundColor = 'white';
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    button.onclick = function() {
        getUserPosition();
    };
    return button;
};
userPositionButton.addTo(map);

// Recherche de l'adresse indiquée
function searchLocation() {
    
    var address = document.getElementById("id_adresse_depart").value
    
    
    if (!address.trim()) {
        alert("Veuillez entrer une adresse.");
        return;
    }
    
    // Ajouter "Bénin" à la recherche pour améliorer la précision
    var searchQuery = address + ", Bénin";
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 15);
                
                var popupContent = `<b>Adresse trouvée</b><br>${data[0].display_name}`;
                addMarker(lat, lon, popupContent);
                updateCoordinateFields(lat, lon);
            } else {
                alert("Aucune adresse trouvée pour: " + address);
            }
        })
        .catch(error => {
            console.error("Erreur lors de la recherche d'adresse:", error);
            alert("Erreur lors de la recherche d'adresse. Vérifiez votre connexion internet.");
        });
}

// Gestion des formulaires
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la gestion des formulaires !");
    

    // Gestion de la soumission des formulaires
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Empêche la redirection
            
            console.log("📤 Tentative de soumission du formulaire...");
            
            var latitudeField = document.getElementById("id_latitude_depart");
            var longitudeField = document.getElementById("id_longitude_depart");
            
            if (!latitudeField || !longitudeField) {
                alert("❌ Champs latitude/longitude introuvables dans le formulaire !");
                console.error("❌ Champs latitude/longitude introuvables !");
                return;
            }
            
            var latitude_depart = latitudeField.value;
            var longitude_depart = longitudeField.value;
            
            console.log("📍 Coordonnées récupérées - Lat:", latitude_depart, "Lng:", longitude_depart);
            
            if (!latitude_depart || !longitude_depart || latitude_depart === "" || longitude_depart === "") {
                alert("❌ Veuillez sélectionner une position sur la carte avant de soumettre le formulaire !");
                return;
            }
            
            // Validation des coordonnées
            var lat = parseFloat(latitude_depart);
            var lng = parseFloat(longitude_depart);
            
            if (isNaN(lat) || isNaN(lng)) {
                alert("❌ Coordonnées invalides !");
                return;
            }
            
            var formData = new FormData(this);
            
            // Log des données du formulaire pour debug
            console.log("📋 Données du formulaire:");
            for (let [key, value] of formData.entries()) {
                console.log(key + ": " + value);
            }
            
            fetch(this.action, {
                method: "POST",
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                console.log("📡 Réponse reçue, status:", response.status);
                
                // Vérifier si la réponse est OK
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
                }
                
                // Vérifier le type de contenu
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return response.json();
                } else {
                    // Si ce n'est pas du JSON, récupérer le texte pour débugger
                    return response.text().then(text => {
                        console.log("📄 Réponse reçue (texte):", text.substring(0, 500));
                        throw new Error("Réponse non-JSON reçue du serveur");
                    });
                }
            })
            .then(data => {
                console.log("✅ Données JSON reçues:", data);

    //  Afficher les infos de la recherche du passager 
    const infoPassagerDiv = document.getElementById('passager-info');
    if (infoPassagerDiv) {
        infoPassagerDiv.innerHTML = `
            <p><strong>Votre recherche:</strong> Départ de <strong>${data.adresse_depart_passager || 'Non spécifié'}</strong> à <strong>${data.heure_depart_passager || 'N/A'}</strong></p>
            <p>Arrivée souhaitée avant <strong>${data.heure_arrivee_passager || 'N/A'}</strong></p>
        `;
    }

    // Gérer et afficher la liste des conducteurs 
    const listeConducteursDiv = document.getElementById('liste-conducteurs');
    const messageAucunConducteur = document.getElementById('no-drivers-message');

    // On vide la liste précédente (si l'utilisateur fait une nouvelle recherche)
    listeConducteursDiv.innerHTML = ''; 
    // On cache le message "aucun conducteur" au début
    if (messageAucunConducteur) messageAucunConducteur.style.display = 'none';

    if (data.conducteurs && data.conducteurs.length > 0) {
        // Si des conducteurs sont trouvés, on les affiche
        data.conducteurs.forEach(conducteur => {
            const carteConducteurHTML = `
                <div class="col-md-4 mb-4"> <div class="card shadow-sm"> <div class="card-body">
                            <h5 class="card-title">${conducteur.username}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${conducteur.marque_voiture || 'Véhicule'} - ${conducteur.nb_places || 'N/A'} places</h6>
                            <p class="card-text">
                                Distance: <strong>${conducteur.distance ? conducteur.distance.toFixed(2) : 'N/A'} km</strong><br>
                                Adresse: ${conducteur.adresse || 'Non spécifiée'}<br>
                                Départ: ${conducteur.heure_depart_conducteur || 'N/A'}<br>
                                Arrivée: ${conducteur.heure_arrivee_conducteur || 'N/A'}<br>
                                Téléphone: <a href="tel:${conducteur.numero_telephone}">${conducteur.numero_telephone || 'N/A'}</a>
                            </p>
                            <button class="btn btn-primary btn-sm">Contacter</button>
                        </div>
                    </div>
                </div>
            `;
            // On ajoute cette carte HTML à la boîte des conducteurs
            listeConducteursDiv.insertAdjacentHTML('beforeend', carteConducteurHTML);
        });
    } else {
        // Si aucun conducteur n'est trouvé, on affiche le message
        if (messageAucunConducteur) {
            messageAucunConducteur.style.display = 'block'; // Rendre le message visible
        } else {
            // Au cas où la div du message n'existe pas (un problème de HTML)
            listeConducteursDiv.innerHTML = '<p>Aucun conducteur trouvé pour votre recherche.</p>';
        }
    }
})
            })
            .catch(error => {
                console.error("❌ Erreur détaillée:", error);
                alert("❌ Une erreur est survenue : " + error.message);
            });
        });
    });


// Fonction utilitaire pour debug - afficher les coordonnées actuelles
function showCurrentCoordinates() {
    var latitudeField = document.getElementById("id_latitude_depart");
    var longitudeField = document.getElementById("id_longitude_depart");
    
    if (latitudeField && longitudeField) {
        console.log("📍 Coordonnées actuelles - Lat:", latitudeField.value, "Lng:", longitudeField.value);
        alert("Coordonnées actuelles:\nLatitude: " + latitudeField.value + "\nLongitude: " + longitudeField.value);
    } else {
        console.log("❌ Champs de coordonnées non trouvés");
        alert("❌ Champs de coordonnées non trouvés");
    }
}