document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");
});

console.log("✅ Script formulaire_demande.js chargé !");
console.log("Leaflet.js est chargé :", typeof L !== "undefined");

// Changement dynamique selon l'utilisateur
function toggleForm() {
    var role = document.querySelector('input[name="role"]:checked');
    if (!role) {
        console.error("❌ Aucun rôle sélectionné !");
        return;
    }

    var conducteurForm = document.getElementById("conducteur-form");
    var passagerForm = document.getElementById("passager-form");

    if (!conducteurForm || !passagerForm) {
        console.error("❌ Formulaires non trouvés dans le DOM !");
        return;
    }

    if (role.value === "conducteur") {
        conducteurForm.style.display = "block";
        passagerForm.style.display = "none";
    } else {
        conducteurForm.style.display = "none";
        passagerForm.style.display = "block";
    }
}

window.onload = toggleForm;

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
    var latitudeField = document.getElementById("latitude");
    var longitudeField = document.getElementById("longitude");

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
    var role = document.querySelector('input[name="role"]:checked');
    if (!role) {
        alert("Veuillez sélectionner un rôle d'abord.");
        return;
    }
    
    var address = "";
    if (role.value === "conducteur") {
        var addressField = document.getElementById("id_addresse_conducteur");
        address = addressField ? addressField.value : "";
    } else if (role.value === "passager") {
        var addressField = document.getElementById("id_addresse_passager");
        address = addressField ? addressField.value : "";
    }
    
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
    
    // Gestion du changement de rôle
    var radios = document.querySelectorAll('input[name="role"]');
    radios.forEach(radio => {
        radio.addEventListener("change", function () {
            console.log("🔄 Rôle changé :", this.value);
            toggleForm();
        });
    });
    
    // Gestion de la soumission des formulaires
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Empêche la redirection
            
            console.log("📤 Tentative de soumission du formulaire...");
            
            var latitudeField = document.getElementById("latitude");
            var longitudeField = document.getElementById("longitude");
            
            if (!latitudeField || !longitudeField) {
                alert("❌ Champs latitude/longitude introuvables dans le formulaire !");
                console.error("❌ Champs latitude/longitude introuvables !");
                return;
            }
            
            var latitude = latitudeField.value;
            var longitude = longitudeField.value;
            
            console.log("📍 Coordonnées récupérées - Lat:", latitude, "Lng:", longitude);
            
            if (!latitude || !longitude || latitude === "" || longitude === "") {
                alert("❌ Veuillez sélectionner une position sur la carte avant de soumettre le formulaire !");
                return;
            }
            
            // Validation des coordonnées
            var lat = parseFloat(latitude);
            var lng = parseFloat(longitude);
            
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
                alert(data.message || "✅ Soumission réussie !");
                
                // Optionnel: réinitialiser le formulaire
                // this.reset();
            })
            .catch(error => {
                console.error("❌ Erreur détaillée:", error);
                alert("❌ Une erreur est survenue : " + error.message);
            });
        });
    });
});

// Fonction utilitaire pour debug - afficher les coordonnées actuelles
function showCurrentCoordinates() {
    var latitudeField = document.getElementById("latitude");
    var longitudeField = document.getElementById("longitude");
    
    if (latitudeField && longitudeField) {
        console.log("📍 Coordonnées actuelles - Lat:", latitudeField.value, "Lng:", longitudeField.value);
        alert("Coordonnées actuelles:\nLatitude: " + latitudeField.value + "\nLongitude: " + longitudeField.value);
    } else {
        console.log("❌ Champs de coordonnées non trouvés");
        alert("❌ Champs de coordonnées non trouvés");
    }
}