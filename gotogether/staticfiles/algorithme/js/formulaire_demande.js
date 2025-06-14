alert("Script chargé !");
console.log("✅ Script formulaire_demande.js chargé !");
console.log("Leaflet.js est chargé :", typeof L !== "undefined");
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Empêche la redirection

            var formData = new FormData(this);
            fetch(this.action, {
                method: "POST",
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message); // Affiche le message sans changer de page
            })
            .catch(error => console.error("Erreur :", error));
        });
    });
});

//changement dynamique selon l'utilisateur

       

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
document.addEventListener("DOMContentLoaded", function(){ var map = L.map('map').setView([6.45, 2.35], 13); // Coordonnées pour Abomey-Calavi
    });

// Ajout des tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Ajout d'un marqueur
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
// Événement pour ajouter un marqueur au clic sur la carte
map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var popupContent = "<b>Nouvelle Position</b><br>Latitude: " + lat + "<br>Longitude: " + lng;
    addMarker(lat, lng, popupContent);
});
//Récupération de la position de l'utilisateur sur un marqueur
function getUserPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            map.setView([lat, lng], 13);
            addMarker(lat, lng, "<b>Votre Position</b><br>Latitude: " + lat + "<br>Longitude: " + lng);
        }, function() {
            alert("Erreur lors de la récupération de la position.");
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
    button.onclick = function() {
        getUserPosition();
    };
    return button;
};
userPositionButton.addTo(map);

//Récupération des coordonnées du formulaire
var latitudeField = document.getElementById("latitude");
var longitudeField = document.getElementById("longitude");

map.on('click', function(value) {
    latitudeField.value = value.latlng.lat;
    longitudeField.value = value.latlng.lng;
});

// Recherche de l'adresse indiquée
function searchLocation() {
    var address = document.getElementById("address").value;
    if (address) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    var lat = data[0].lat;
                    var lon = data[0].lon;
                    map.setView([lat, lon], 13);
                    addMarker(lat, lon, `<b>Adresse trouvée</b><br>${data[0].display_name}`);
                } else {
                    alert("Aucune adresse trouvée.");
                }
            })
            .catch(error => {
                console.error("Erreur lors de la recherche d'adresse:", error);
            });
    } else {
        alert("Veuillez entrer une adresse.");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");
    
    var radios = document.querySelectorAll('input[name="role"]');
    radios.forEach(radio => {
        radio.addEventListener("change", function () {
            console.log("🔄 Rôle changé :", this.value);
            toggleForm();
        });
    });
});



