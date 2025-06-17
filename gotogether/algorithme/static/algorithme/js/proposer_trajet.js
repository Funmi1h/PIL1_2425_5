// algorithme/static/algorithme/js/proposer_trajet_map.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Initialisation des cartes ---
    let mapProposerDepart = L.map('map_proposer_depart').setView([6.370, 2.417], 13); // Coordonnées du Bénin (Cotonou)
    let mapProposerArrivee = L.map('map_proposer_arrivee').setView([6.370, 2.417], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapProposerDepart);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapProposerArrivee);

    let markerProposerDepart, markerProposerArrivee;

    // --- Champs de formulaire ---
    const adresseDepartInput = document.getElementById('id_adresse_depart');
    const latitudeDepartInput = document.getElementById('id_latitude_depart');
    const longitudeDepartInput = document.getElementById('id_longitude_depart');

    const adresseArriveeInput = document.getElementById('id_adresse_arrivee');
    const latitudeArriveeInput = document.getElementById('id_latitude_arrivee');
    const longitudeArriveeInput = document.getElementById('id_longitude_arrivee');

    // --- Fonctions d'aide ---
    function updateMarkerAndInputs(map, marker, latInput, lonInput, addrInput, e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        if (marker) {
            marker.setLatLng([lat, lon]);
        } else {
            marker = L.marker([lat, lon]).addTo(map);
        }
        map.setView([lat, lon], map.getZoom()); // Centre la carte sur le nouveau marqueur

        latInput.value = lat;
        lonInput.value = lon;

        // Géocodage inversé pour obtenir l'adresse
        L.Control.Geocoder.nominatim().reverse(e.latlng, map.options.crs.scale(map.getZoom()), function(results) {
            if (results && results.length > 0) {
                addrInput.value = results[0].name;
            } else {
                addrInput.value = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
            }
        });
        return marker;
    }

    // --- Événements de clic sur la carte ---
    mapProposerDepart.on('click', function(e) {
        markerProposerDepart = updateMarkerAndInputs(mapProposerDepart, markerProposerDepart, latitudeDepartInput, longitudeDepartInput, adresseDepartInput, e);
    });

    mapProposerArrivee.on('click', function(e) {
        markerProposerArrivee = updateMarkerAndInputs(mapProposerArrivee, markerProposerArrivee, latitudeArriveeInput, longitudeArriveeInput, adresseArriveeInput, e);
    });

    // --- Autocomplétion avec Leaflet Control Geocoder ---
    // Pour le départ
    L.Control.geocoder({
        placeholder: "Rechercher adresse de départ...",
        defaultMarkGeocode: false
    }).on('geocode:result', function(e) {
        const bbox = e.geocode.bbox;
        const latLng = e.geocode.center;
        
        markerProposerDepart = updateMarkerAndInputs(mapProposerDepart, markerProposerDepart, latitudeDepartInput, longitudeDepartInput, adresseDepartInput, {latlng: latLng});
        mapProposerDepart.fitBounds(bbox.addTo(mapProposerDepart));
    }).addTo(mapProposerDepart);

    // Pour l'arrivée
    L.Control.geocoder({
        placeholder: "Rechercher adresse d'arrivée...",
        defaultMarkGeocode: false
    }).on('geocode:result', function(e) {
        const bbox = e.geocode.bbox;
        const latLng = e.geocode.center;
        
        markerProposerArrivee = updateMarkerAndInputs(mapProposerArrivee, markerProposerArrivee, latitudeArriveeInput, longitudeArriveeInput, adresseArriveeInput, {latlng: latLng});
        mapProposerArrivee.fitBounds(bbox.addTo(mapProposerArrivee));
    }).addTo(mapProposerArrivee);


    // --- Soumission du formulaire AJAX ---
    const proposerTrajetForm = document.getElementById('proposerTrajetForm');
    if (proposerTrajetForm) {
        proposerTrajetForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Empêche la soumission normale du formulaire

            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true; // Désactiver le bouton pour éviter les soumissions multiples
            submitButton.textContent = 'Envoi...';

            const formData = new FormData(this);
            const jsonData = {};
            formData.forEach((value, key) => {
                jsonData[key] = value;
            });

           
            if (jsonData['heure_depart_prevue']) {
                
            if (jsonData['heure_arrivee_prevue'] === '') {
                jsonData['heure_arrivee_prevue'] = null; 
            }


            console.log("📤 Soumission du formulaire de proposition AJAX...");
            console.log("Données JSON envoyées:", jsonData);

            fetch(this.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': jsonData['csrfmiddlewaretoken'],
                    'X-Requested-With': 'XMLHttpRequest' // Indiquer que c'est une requête AJAX
                },
                body: JSON.stringify(jsonData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                // Si la réponse n'est pas OK, tentez de lire le JSON pour les erreurs
                return response.json().then(errorData => {
                    throw { status: response.status, data: errorData };
                }).catch(() => {
                    // Si la réponse n'est pas OK et n'est pas du JSON, jeter l'erreur de statut
                    throw { status: response.status, data: null };
                });
            })
            .then(data => {
                if (data.success) {
                    console.log('✅ Soumission AJAX réussie:', data);
                    alert('Votre trajet a été proposé avec succès !');
                    // Redirection ou mise à jour de l'UI
                    window.location.href = '/mes-trajets-offerts/'; // Rediriger l'utilisateur vers ses trajets offerts (à définir)
                } else {
                    console.error('❌ Erreur lors de la soumission AJAX:', data);
                    let errorMessage = 'Une erreur est survenue lors de la proposition du trajet.';
                    if (data.errors) {
                        try {
                            const errors = JSON.parse(data.errors);
                            errorMessage += '\n';
                            for (const field in errors) {
                                errors[field].forEach(err => {
                                    errorMessage += `${field === '__all__' ? '' : field.charAt(0).toUpperCase() + field.slice(1)}: ${err}\n`;
                                });
                            }
                        } catch (e) {
                            errorMessage += ' Détails: ' + data.errors;
                        }
                    }
                    alert(errorMessage);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Proposer ce trajet';
                }
            })
            .catch(error => {
                console.error('❌ Erreur lors de la soumission AJAX:', error);
                let errorMessage = `Une erreur est survenue. Statut: ${error.status || 'Inconnu'}.`;
                if (error.data && error.data.message) {
                    errorMessage += ` Message: ${error.data.message}`;
                } else if (error.data && error.data.errors) {
                    try {
                        const errors = JSON.parse(error.data.errors);
                        errorMessage += '\n';
                        for (const field in errors) {
                            errors[field].forEach(err => {
                                errorMessage += `${field === '__all__' ? '' : field.charAt(0).toUpperCase() + field.slice(1)}: ${err}\n`;
                            });
                        }
                    } catch (e) {
                        errorMessage += ' Détails: ' + error.data.errors;
                    }
                }
                alert(errorMessage);
                submitButton.disabled = false;
                submitButton.textContent = 'Proposer ce trajet';
            });
        }
        })
    }
});