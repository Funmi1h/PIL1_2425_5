// votre_projet/algorithme/static/algorithme/js/rechercher_trajets.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la page de recherche de trajets !");

    var defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin
    var defaultZoom = 13;

    // --- Initialisation de la carte de départ ---
    const mapDepartSearchElement = document.getElementById('map_depart_search');
    let mapDepartSearch;
    let markerDepartSearchRef = { current: null };

    if (mapDepartSearchElement) {
        mapDepartSearch = L.map('map_depart_search').setView(defaultCoords, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapDepartSearch);
    } else {
        console.error("❌ Élément 'map_depart_search' introuvable dans le DOM. La carte de départ ne sera pas initialisée.");
    }

    // --- Initialisation de la carte d'arrivée (optionnel) ---
    const mapArriveeSearchElement = document.getElementById('map_arrivee_search');
    let mapArriveeSearch;
    let markerArriveeSearchRef = { current: null };

    if (mapArriveeSearchElement) {
        mapArriveeSearch = L.map('map_arrivee_search').setView(defaultCoords, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapArriveeSearch);
    } else {
        console.error("❌ Élément 'map_arrivee_search' introuvable dans le DOM. La carte d'arrivée ne sera pas initialisée.");
    }
    
    // --- Fonctions utilitaires pour les marqueurs et champs ---
    function updateMarkerAndFields(mapInstance, markerRef, lat, lng, popupContent, isDepart) {
        const latFieldId = isDepart ? 'id_latitude_depart_search' : 'id_latitude_arrivee_search';
        const lngFieldId = isDepart ? 'id_longitude_depart_search' : 'id_longitude_arrivee_search';
        const errorDivId = isDepart ? 'depart-coords-error' : 'arrivee-coords-error';

        const latField = document.getElementById(latFieldId);
        const lngField = document.getElementById(lngFieldId);
        const errorDiv = document.getElementById(errorDivId);

        if (!latField || !lngField || !errorDiv) {
            console.error(`❌ Un des éléments (${latFieldId}, ${lngFieldId}, ${errorDivId}) est introuvable. Impossible de mettre à jour les coordonnées.`);
            return false;
        }

        if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance);
        markerRef.current.bindPopup(popupContent).openPopup();

        latField.value = lat;
        lngField.value = lng;
        errorDiv.style.display = 'none';

        console.log(`✅ Coordonnées ${isDepart ? 'départ (recherche)' : 'arrivée (recherche)'} mises à jour :`, lat, lng);
        return true;
    }

    // --- Écouteurs d'événements pour les clics sur les cartes ---
    if (mapDepartSearch) {
        mapDepartSearch.on('click', function (e) {
            updateMarkerAndFields(mapDepartSearch, markerDepartSearchRef, e.latlng.lat, e.latlng.lng, 
                `<b>Point de Départ</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`, true);
        });
    }

    if (mapArriveeSearch) {
        mapArriveeSearch.on('click', function (e) {
            updateMarkerAndFields(mapArriveeSearch, markerArriveeSearchRef, e.latlng.lat, e.latlng.lng, 
                `<b>Point d'Arrivée</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`, false);
        });
    }

    // --- Fonctions de recherche d'adresse (via Nominatim) ---
    function searchLocation(inputElementId, mapInstance, markerRef, isDepart) {
        var addressInput = document.getElementById(inputElementId);
        if (!addressInput) {
            console.error(`❌ Champ d'adresse '${inputElementId}' introuvable.`);
            alert("Erreur interne: champ d'adresse manquant.");
            return;
        }

        var address = addressInput.value;
        if (!address.trim()) {
            alert("Veuillez entrer une adresse.");
            return;
        }
        
        var searchQuery = address + ", Bénin"; 
        
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            .then(response => {
                if (!response.ok) { throw new Error('Erreur réseau: ' + response.status); }
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    var lat = parseFloat(data[0].lat);
                    var lon = parseFloat(data[0].lon);
                    if (mapInstance) {
                        mapInstance.setView([lat, lon], 15);
                        var popupContent = `<b>Adresse trouvée</b><br>${data[0].display_name}`;
                        updateMarkerAndFields(mapInstance, markerRef, lat, lon, popupContent, isDepart);
                    } else {
                        alert("La carte n'a pas pu être initialisée pour afficher l'adresse.");
                    }
                } else {
                    alert("Aucune adresse trouvée pour: " + address);
                }
            })
            .catch(error => {
                console.error("Erreur lors de la recherche d'adresse:", error);
                alert("Erreur lors de la recherche d'adresse. Vérifiez votre connexion internet ou réessayez.");
            });
    }

    const searchDepartAddressBtn = document.getElementById("searchDepartAddressBtn");
    if (searchDepartAddressBtn) {
        searchDepartAddressBtn.addEventListener("click", function() {
            if (mapDepartSearch) {
                searchLocation("id_adresse_depart", mapDepartSearch, markerDepartSearchRef, true);
            } else {
                alert("La carte de départ n'est pas disponible.");
            }
        });
    } else {
        console.error("❌ Bouton 'searchDepartAddressBtn' introuvable.");
    }
    
    const searchArriveeAddressBtn = document.getElementById("searchArriveeAddressBtn");
    if (searchArriveeAddressBtn) {
        searchArriveeAddressBtn.addEventListener("click", function() {
            if (mapArriveeSearch) {
                searchLocation("id_adresse_arrivee", mapArriveeSearch, markerArriveeSearchRef, false);
            } else {
                alert("La carte d'arrivée n'est pas disponible.");
            }
        });
    } else {
        console.error("❌ Bouton 'searchArriveeAddressBtn' introuvable.");
    }

   
    const rechercheForm = document.getElementById("rechercheTrajetForm");
    if (rechercheForm) {
        rechercheForm.addEventListener("submit", function (event) {
            event.preventDefault(); 
            
            let isValid = true;
            const departLatField = document.getElementById('id_latitude_depart_search');
            const departLngField = document.getElementById('id_longitude_depart_search');
            const departCoordsErrorDiv = document.getElementById('depart-coords-error');
            
            const arriveeAdresseField = document.getElementById('id_adresse_arrivee');
            const arriveeLatField = document.getElementById('id_latitude_arrivee_search');
            const arriveeLngField = document.getElementById('id_longitude_arrivee_search');
            const arriveeCoordsErrorDiv = document.getElementById('arrivee-coords-error');

            if (!departLatField || !departLngField || !departCoordsErrorDiv || !arriveeAdresseField || !arriveeLatField || !arriveeLngField || !arriveeCoordsErrorDiv) {
                console.error("❌ Un ou plusieurs champs/divs d'erreur pour la validation du formulaire sont introuvables.");
                alert("Erreur interne: Formulaire incomplet. Veuillez contacter l'administrateur.");
                return;
            }

        
            if (!departLatField.value || !departLngField.value || isNaN(parseFloat(departLatField.value)) || isNaN(parseFloat(departLngField.value))) {
                departCoordsErrorDiv.style.display = 'block';
                isValid = false;
            } else {
                departCoordsErrorDiv.style.display = 'none';
            }

           
            if (arriveeAdresseField.value.trim() !== '') {
                if (!arriveeLatField.value || !arriveeLngField.value || isNaN(parseFloat(arriveeLatField.value)) || isNaN(parseFloat(arriveeLngField.value))) {
                    arriveeCoordsErrorDiv.style.display = 'block';
                    isValid = false;
                } else {
                    arriveeCoordsErrorDiv.style.display = 'none';
                }
            } else {
                 arriveeCoordsErrorDiv.style.display = 'none';
            }

            if (!isValid) {
                alert("❌ Veuillez corriger les erreurs de sélection de points sur la carte.");
                return;
            }

            console.log("📤 Tentative de soumission du formulaire de recherche...");
            
            const formData = new FormData(this);
            
            fetch(this.action, {
                method: "POST",
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest', 
                }
            })
            .then(response => {
                console.log("📡 Réponse reçue, status:", response.status);

                if (!response.ok) {
                  
                    return response.text().then(text => {
                        try {
                            const errorData = JSON.parse(text); 
                            return Promise.reject({ status: response.status, errors: errorData.errors || { '__all__': ['Erreur du serveur (format JSON).'] } });
                        } catch (e) {
                           
                            console.error("Réponse du serveur non-JSON en cas d'erreur HTTP:", text.substring(0, 500));
                           
                            return Promise.reject({ status: response.status, errors: { '__all__': [`Erreur serveur (${response.status}): Réponse inattendue. Veuillez vérifier le serveur.`] } });
                        }
                    });
                }
               
                return response.json();
            })
            .then(data => {
                console.log("✅ Données JSON reçues:", data);

                clearFormErrors();
                if (departCoordsErrorDiv) departCoordsErrorDiv.style.display = 'none';
                if (arriveeCoordsErrorDiv) arriveeCoordsErrorDiv.style.display = 'none';

                if (data.success) {
                    const searchSummaryDiv = document.getElementById('search-summary');
                    const summaryAdresseDepart = document.getElementById('summary-adresse-depart');
                    const summaryDateDepart = document.getElementById('summary-date-depart');
                    const summaryHeureDepart = document.getElementById('summary-heure-depart');
                    const adresseArriveeSummaryText = document.getElementById('summary-adresse-arrivee-text');
                    const summaryHeureArrivee = document.getElementById('summary-heure-arrivee');

                    if (summaryAdresseDepart) summaryAdresseDepart.textContent = data.adresse_depart_passager || 'Non spécifiée';
                    if (summaryDateDepart) summaryDateDepart.textContent = data.date_depart_passager || 'N/A';
                    if (summaryHeureDepart) summaryHeureDepart.textContent = data.heure_depart_passager || 'N/A';
                    
                    if (adresseArriveeSummaryText) {
                        if (data.adresse_arrivee_passager) {
                            adresseArriveeSummaryText.textContent = `Arrivée à ${data.adresse_arrivee_passager}.`;
                        } else {
                            adresseArriveeSummaryText.textContent = ''; 
                        }
                    }
                    if (summaryHeureArrivee) summaryHeureArrivee.textContent = data.heure_arrivee_passager || 'N/A';
                    if (searchSummaryDiv) searchSummaryDiv.style.display = 'block';

                    const listeTrajetsDiv = document.getElementById('liste-trajets');
                    const noTrajetsMessage = document.getElementById('no-trajets-message');

                    if (listeTrajetsDiv) listeTrajetsDiv.innerHTML = ''; 
                    if (noTrajetsMessage) noTrajetsMessage.style.display = 'none';

                    if (data.trajets && data.trajets.length > 0) {
                        data.trajets.forEach(trajet => {
                           
                            const trajetCardHTML = `
                                <div class="col-md-6 col-lg-4 mb-4">
                                    <div class="card driver-card">
                                        <div class="card-body">
                                            <h5 class="card-title">${trajet.conducteur_username}</h5>
                                            <h6 class="card-subtitle mb-2 text-muted">${trajet.conducteur_marque_voiture || 'Véhicule'} - ${trajet.nb_places_disponibles_trajet || 'N/A'} places disponibles</h6>
                                            <p class="card-text">
                                                Distance de votre départ au point de départ du conducteur: <strong>${trajet.distance_depart ? trajet.distance_depart.toFixed(2) : 'N/A'} km</strong><br>
                                                ${trajet.distance_arrivee !== null && data.adresse_arrivee_passager ? `Distance de votre arrivée au point d'arrivée du conducteur: <strong>${trajet.distance_arrivee.toFixed(2)} km</strong><br>` : ''}
                                                Départ du conducteur: <strong>${trajet.adresse_depart_trajet || 'Non spécifiée'}</strong> à ${trajet.heure_depart_trajet || 'N/A'}<br>
                                                Arrivée du conducteur: <strong>${trajet.adresse_arrivee_trajet || 'Non spécifiée'}</strong> à ${trajet.heure_arrivee_trajet || 'N/A'}<br>
                                                Prix: <strong>${trajet.prix_par_passager ? trajet.prix_par_passager + ' FCFA' : 'N/A'}</strong><br>
                                                Téléphone: <a href="tel:${trajet.conducteur_phone}">${trajet.conducteur_phone || 'N/A'}</a>
                                            </p>
                                            <div class="mt-auto">
                                                <button class="btn btn-primary btn-sm">Contacter</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            if (listeTrajetsDiv) listeTrajetsDiv.insertAdjacentHTML('beforeend', trajetCardHTML);
                        });
                    } else {
                        if (noTrajetsMessage) {
                            noTrajetsMessage.style.display = 'block';
                        } else if (listeTrajetsDiv) {
                            listeTrajetsDiv.innerHTML = '<div class="col-12"><p class="alert alert-info">Aucun trajet trouvé pour votre recherche.</p></div>';
                        }
                    }
                } else {
                    
                    displayFormErrors(data.errors ? JSON.parse(data.errors) : { '__all__': ['Une erreur inattendue est survenue côté serveur.'] });
                }
            })
            .catch(error => {
                console.error("❌ Erreur lors de la récupération des trajets:", error);
                let errorMessage = "Une erreur inattendue est survenue. Veuillez réessayer.";
                if (error.errors) {
                    displayFormErrors(error.errors);
                    if (error.errors.__all__) {
                        errorMessage = error.errors.__all__.join('<br>');
                    } else if (Object.keys(error.errors).length > 0) {
                         errorMessage = "Veuillez corriger les erreurs dans le formulaire.";
                    }
                } else if (error && error.message) {
                    errorMessage = error.message;
                }
               
                if (!error.errors || Object.keys(error.errors).length === 0) {
                    alert("❌ " + errorMessage);
                }
            });
        });
    } else {
        console.error("❌ Formulaire 'rechercheTrajetForm' introuvable. Les fonctionnalités de recherche pourraient être limitées.");
    }

    
    function displayFormErrors(errors) {
        const rechercheFormElement = document.getElementById("rechercheTrajetForm");
        if (!rechercheFormElement) {
            console.error("❌ Formulaire de recherche introuvable pour afficher les erreurs.");
            return;
        }

        clearFormErrors();

      
        if (typeof errors === 'string') {
            try {
                errors = JSON.parse(errors);
            } catch (e) {
                console.error("Erreur de parsing des erreurs reçues:", e);
                alert("Une erreur de format est survenue lors de l'affichage des erreurs du formulaire.");
                return;
            }
        }
        
        for (const fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                const errorMessages = errors[fieldName];
                if (fieldName === '__all__') {
                    const nonFieldErrorsDiv = rechercheFormElement.querySelector('.alert-danger');
                    if (nonFieldErrorsDiv) {
                        nonFieldErrorsDiv.innerHTML = '';
                        errorMessages.forEach(msg => {
                            const p = document.createElement('p');
                            p.textContent = msg;
                            nonFieldErrorsDiv.appendChild(p);
                        });
                        nonFieldErrorsDiv.style.display = 'block';
                    } else {
                        
                        console.warn("Div pour les erreurs générales non trouvé. Erreurs:", errorMessages);
                        alert("Erreur générale du formulaire: " + errorMessages.join(', '));
                    }
                } else {
                    const field = document.getElementById('id_' + fieldName);
                    if (field) {
                        let errorDiv = field.nextElementSibling;
                        if (!errorDiv || !errorDiv.classList.contains('text-danger')) {
                            errorDiv = document.createElement('div');
                            errorDiv.classList.add('text-danger', 'small', 'mt-1');
                            field.parentNode.insertBefore(errorDiv, field.nextElementSibling);
                        }
                        errorDiv.innerHTML = errorMessages.map(msg => `<div>${msg}</div>`).join('');
                    } else {
                        console.warn(`Champ de formulaire "${fieldName}" (id_` + fieldName + `) introuvable pour afficher les erreurs.`);
                    }
                }
            }
        }
    }

    function clearFormErrors() {
        const rechercheFormElement = document.getElementById("rechercheTrajetForm");
        if (!rechercheFormElement) return;

        const generalErrorsDiv = rechercheFormElement.querySelector('.alert-danger');
        if (generalErrorsDiv) {
            generalErrorsDiv.style.display = 'none';
            generalErrorsDiv.innerHTML = '';
        }

        rechercheFormElement.querySelectorAll('.text-danger.small.mt-1').forEach(div => {
            if (div.id !== 'depart-coords-error' && div.id !== 'arrivee-coords-error') {
                div.innerHTML = '';
            }
        });
    }
});