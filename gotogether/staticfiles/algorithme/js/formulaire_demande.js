
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");
});

console.log("✅ Script formulaire_demande.js chargé !");
console.log("Leaflet.js est chargé :", typeof L !== "undefined");

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
 // Coordonnées pour Abomey-Calavi
var map = L.map('map').setView([6.45, 2.35], 13);

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
//var latitudeField = document.getElementById("latitude");
//var longitudeField = document.getElementById("longitude");


document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");
    
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); // Empêche la redirection

            var latitude = document.getElementById("latitude").value;
            var longitude = document.getElementById("longitude").value;

            if (!latitude || !longitude) {
                alert("❌ Veuillez valider votre position avant de soumettre le formulaire !");
                return;
            }

            var formData = new FormData(this);
            fetch(this.action, {
                method: "POST",
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || "✅ Soumission réussie !");
            })
            .catch(async error => {
            const responseText = await error.text?.();
            console.error("❌ Erreur JS détaillée :", error, responseText);
                alert("❌ Une erreur est survenue ! Détails dans la console.");
            });
        });
    });
});


map.on('click', function(value) {
    var latitudeField = document.getElementById("latitude");
    var longitudeField = document.getElementById("longitude");

    if (latitudeField && longitudeField) {
        latitudeField.value = value.latlng.lat;
        longitudeField.value = value.latlng.lng;
        console.log("✅ Coordonnées mises à jour :", value.latlng.lat, value.latlng.lng);
    } else {
        console.error("❌ Champs latitude/longitude introuvables !");
    }
});


// Recherche de l'adresse indiquée

function searchLocation() {
    console.log(document.getElementById("addresse"));

       var address = document.getElementById("addresse").value;
    
    if (!address.trim()) {
        alert("Veuillez entrer une adresse.");
        return;}
    
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



