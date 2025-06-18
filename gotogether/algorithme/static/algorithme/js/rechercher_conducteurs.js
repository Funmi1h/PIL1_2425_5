document.addEventListener("DOMContentLoaded", function () {
            console.log("✅ DOM chargé pour la page de recherche de trajets !");

            var defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin
            var defaultZoom = 13;

            
            var mapDepartSearch = L.map('map_depart_search').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapDepartSearch);
            var markerDepartSearchRef = { current: null }; 
            var mapArriveeSearch = L.map('map_arrivee_search').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapArriveeSearch);
            var markerArriveeSearchRef = { current: null };
            function updateMarkerAndFields(mapInstance, markerRef, latFieldId, lngFieldId, lat, lng, popupContent, errorDivId) {
                const latField = document.getElementById(latFieldId);
                const lngField = document.getElementById(lngFieldId);
                const errorDiv = document.getElementById(errorDivId);

                if (markerRef.current) {
                    mapInstance.removeLayer(markerRef.current);
                }
                markerRef.current = L.marker([lat, lng]).addTo(mapInstance);
                markerRef.current.bindPopup(popupContent).openPopup();

                if (latField && lngField) {
                    latField.value = lat;
                    lngField.value = lng;
                    if (errorDiv) errorDiv.style.display = 'none'; 
                    console.log(`✅ Coordonnées (${latFieldId.split('_')[2]}) mises à jour :`, lat, lng);
                    return true;
                } else {
                    console.error(`❌ Champs ${latFieldId}/${lngFieldId} introuvables !`);
                    return false;
                }
            }

          
            mapDepartSearch.on('click', function (e) {
                updateMarkerAndFields(mapDepartSearch, markerDepartSearchRef, 'id_latitude_depart_search', 'id_longitude_depart_search', e.latlng.lat, e.latlng.lng, 
                    `<b>Point de Départ</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`, 'depart-coords-error');
            });

            mapArriveeSearch.on('click', function (e) {
                updateMarkerAndFields(mapArriveeSearch, markerArriveeSearchRef, 'id_latitude_arrivee_search', 'id_longitude_arrivee_search', e.latlng.lat, e.latlng.lng, 
                    `<b>Point d'Arrivée</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`, 'arrivee-coords-error');
            });

            
            function searchAddress(addressFieldId, mapInstance, markerRef, latFieldId, lngFieldId, errorDivId) {
                var address = document.getElementById(addressFieldId).value;
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
                            mapInstance.setView([lat, lon], 15);
                            var popupContent = `<b>Adresse trouvée</b><br>${data[0].display_name}`;
                            updateMarkerAndFields(mapInstance, markerRef, latFieldId, lngFieldId, lat, lon, popupContent, errorDivId);
                        } else {
                            alert("Aucune adresse trouvée pour: " + address);
                        }
                    })
                    .catch(error => {
                        console.error("Erreur lors de la recherche d'adresse:", error);
                        alert("Erreur lors de la recherche d'adresse. Vérifiez votre connexion internet ou réessayez.");
                    });
            }

            document.getElementById("searchDepartAddressBtn").addEventListener("click", function() {
                searchAddress('id_adresse_depart', mapDepartSearch, markerDepartSearchRef, 'id_latitude_depart', 'id_longitude_depart', 'depart-coords-error');
            });

            document.getElementById("searchArriveeAddressBtn").addEventListener("click", function() {
                searchAddress('id_adresse_arrivee', mapArriveeSearch, markerArriveeSearchRef, 'id_latitude_arrivee_search', 'id_longitude_arrivee_search', 'arrivee-coords-error');
            });

           
            const rechercheForm = document.getElementById("rechercheTrajetForm");
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

              
                if (!departLatField.value || !departLngField.value || isNaN(parseFloat(departLatField.value)) || isNaN(parseFloat(departLngField.value))) {
                    departCoordsErrorDiv.style.display = 'block';
                    isValid = false;
                } else {
                    departCoordsErrorDiv.style.display = 'none';
                }

               
                if (arriveeAdresseField.value.trim() !== '' && (!arriveeLatField.value || !arriveeLngField.value || isNaN(parseFloat(arriveeLatField.value)) || isNaN(parseFloat(arriveeLngField.value)))) {
                    arriveeCoordsErrorDiv.style.display = 'block';
                    isValid = false;
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
                        return response.json().then(errorData => {
                            throw { status: response.status, errors: errorData.errors || { '__all__': ['Erreur inconnue du serveur.'] } };
                        }).catch(() => {
                            return response.text().then(text => {
                                console.error("Réponse texte non-JSON:", text.substring(0, 500));
                                throw { status: response.status, errors: { '__all__': ['Erreur serveur: Réponse inattendue.'] } };
                            });
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Données JSON reçues:", data);

                  
                    clearFormErrors();
                    departCoordsErrorDiv.style.display = 'none';
                    arriveeCoordsErrorDiv.style.display = 'none';

                    if (data.success) {
                        
                        const searchSummaryDiv = document.getElementById('search-summary');
                        document.getElementById('summary-adresse-depart').textContent = data.adresse_depart_passager || 'Non spécifiée';
                        document.getElementById('summary-date-depart').textContent = data.date_depart_passager || 'N/A';
                        document.getElementById('summary-heure-depart').textContent = data.heure_depart_passager || 'N/A';
                        
                        const adresseArriveeSummaryText = document.getElementById('summary-adresse-arrivee-text');
                        if (data.adresse_arrivee_passager) {
                            adresseArriveeSummaryText.textContent = `Arrivée à ${data.adresse_arrivee_passager}.`;
                        } else {
                            adresseArriveeSummaryText.textContent = ''; 
                        }
                        document.getElementById('summary-heure_arrivee').textContent = data.heure_arrivee_passager || 'N/A';
                        searchSummaryDiv.style.display = 'block';


                        const listeTrajetsDiv = document.getElementById('liste-trajets');
                        const noTrajetsMessage = document.getElementById('no-trajets-message');

                        listeTrajetsDiv.innerHTML = ''; 
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
                                                    ${trajet.distance_arrivee ? `Distance de votre arrivée au point d'arrivée du conducteur: <strong>${trajet.distance_arrivee.toFixed(2)} km</strong><br>` : ''}
                                                    Départ du conducteur: <strong>${trajet.adresse_depart_trajet || 'Non spécifiée'}</strong> à ${trajet.heure_depart_trajet || 'N/A'}<br>
                                                    Arrivée du conducteur: <strong>${trajet.adresse_arrivee_trajet || 'Non spécifiée'}</strong> à ${trajet.heure_arrivee_trajet || 'N/A'}
                                                    Téléphone: <a href="tel:${trajet.conducteur_phone}">${trajet.conducteur_phone || 'N/A'}</a>
                                                </p>
                                                <div class="mt-auto">
                                                    <button class="btn btn-primary btn-sm"  href = >Contacter</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                listeTrajetsDiv.insertAdjacentHTML('beforeend', trajetCardHTML);
                            });
                        } else {
                            if (noTrajetsMessage) {
                                noTrajetsMessage.style.display = 'block';
                            } else {
                                listeTrajetsDiv.innerHTML = '<div class="col-12"><p class="alert alert-info">Aucun trajet trouvé pour votre recherche.</p></div>';
                            }
                        }
                    } else {
                        displayFormErrors(JSON.parse(data.errors));
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
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    if (!error.errors || Object.keys(error.errors).length === 0) {
                        alert("❌ " + errorMessage);
                    }
                });
            });

            function displayFormErrors(errors) {
                clearFormErrors();

                if (typeof errors === 'string') {
                    try {
                        errors = JSON.parse(errors);
                    } catch (e) {
                        console.error("Erreur de parsing des erreurs:", e);
                        alert("Une erreur de format est survenue lors de l'affichage des erreurs.");
                        return;
                    }
                }
                
                for (const fieldName in errors) {
                    if (errors.hasOwnProperty(fieldName)) {
                        const errorMessages = errors[fieldName];
                        if (fieldName === '__all__') {
                            const nonFieldErrorsDiv = rechercheForm.querySelector('.alert-danger');
                            if (nonFieldErrorsDiv) {
                                nonFieldErrorsDiv.innerHTML = '';
                                errorMessages.forEach(msg => {
                                    const p = document.createElement('p');
                                    p.textContent = msg;
                                    nonFieldErrorsDiv.appendChild(p);
                                });
                                nonFieldErrorsDiv.style.display = 'block';
                            } else {
                                alert("Erreur générale: " + errorMessages.join(', '));
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
                                console.warn(`Champ de formulaire "${fieldName}" introuvable pour afficher les erreurs.`);
                            }
                        }
                    }
                }
            }

            function clearFormErrors() {
                const generalErrorsDiv = rechercheForm.querySelector('.alert-danger');
                if (generalErrorsDiv) {
                    generalErrorsDiv.style.display = 'none';
                    generalErrorsDiv.innerHTML = '';
                }

                rechercheForm.querySelectorAll('.text-danger.small.mt-1').forEach(div => {
                  
                    if (div.id !== 'depart-coords-error' && div.id !== 'arrivee-coords-error') {
                        div.innerHTML = '';
                    }
                });
            }
        })