document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la demande de trajet (avec deux cartes Leaflet)!");

    const defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin
    const defaultZoom = 13;

    let mapDepart = null;
    let markerDepart = null;
    let mapArrivee = null;
    let markerArrivee = null;

    // Constantes pour les IDs des champs de formulaire
    const ID_ADRESSE_DEPART = "id_adresse_depart";
    const ID_LATITUDE_DEPART = "id_latitude_depart";
    const ID_LONGITUDE_DEPART = "id_longitude_depart";

    const ID_ADRESSE_ARRIVEE = "id_adresse_arrivee";
    const ID_LATITUDE_ARRIVEE = "id_latitude_arrivee";
    const ID_LONGITUDE_ARRIVEE = "id_longitude_arrivee";

    // Variables pour les timers de recherche automatique (pour éviter les requêtes excessives)
    let searchDepartTimeout = null;
    let searchArriveeTimeout = null;
    const SEARCH_DELAY_MS = 800; // Délai avant de lancer la recherche après la dernière frappe

    function initializeMaps() {
        // Initialisation de la carte de départ
        const mapDepartDiv = document.getElementById('map_demande_depart');
        if (mapDepartDiv) {
            if (mapDepart !== null) mapDepart.remove();
            mapDepart = L.map('map_demande_depart').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapDepart);
            console.log("Map de départ initialisée.");

            // MODIFICATION: Géocodage inverse au clic sur la carte de départ
            mapDepart.on('click', function (e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                updateMarkerAndFields(mapDepart, 'depart', lat, lng,
                    `<b>Point de Départ</b>`);
                reverseGeocode(lat, lng, 'depart'); // Ajout de l'appel au géocodage inverse
            });
        } else {
            console.error("❌ Élément 'map_demande_depart' introuvable. La carte de départ ne peut pas être initialisée.");
        }

        // Initialisation de la carte d'arrivée
        const mapArriveeDiv = document.getElementById('map_demande_arrivee');
        if (mapArriveeDiv) {
            if (mapArrivee !== null) mapArrivee.remove();
            mapArrivee = L.map('map_demande_arrivee').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapArrivee);
            console.log("Map d'arrivée initialisée.");

            // MODIFICATION: Géocodage inverse au clic sur la carte d'arrivée
            mapArrivee.on('click', function (e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                updateMarkerAndFields(mapArrivee, 'arrivee', lat, lng,
                    `<b>Point d'Arrivée</b>`);
                reverseGeocode(lat, lng, 'arrivee'); // Ajout de l'appel au géocodage inverse
            });
        } else {
            console.error("❌ Élément 'map_demande_arrivee' introuvable. La carte d'arrivée ne peut pas être initialisée.");
        }

        // Récupération des valeurs initiales si elles existent dans les champs cachés
        const initialLatDepart = parseFloat(document.getElementById(ID_LATITUDE_DEPART)?.value);
        const initialLngDepart = parseFloat(document.getElementById(ID_LONGITUDE_DEPART)?.value);
        if (!isNaN(initialLatDepart) && !isNaN(initialLngDepart) && mapDepart) {
            updateMarkerAndFields(mapDepart, 'depart', initialLatDepart, initialLngDepart, "Départ initial");
            mapDepart.setView([initialLatDepart, initialLngDepart], defaultZoom);
        }

        const initialLatArrivee = parseFloat(document.getElementById(ID_LATITUDE_ARRIVEE)?.value);
        const initialLngArrivee = parseFloat(document.getElementById(ID_LONGITUDE_ARRIVEE)?.value);
        if (!isNaN(initialLatArrivee) && !isNaN(initialLngArrivee) && mapArrivee) {
            updateMarkerAndFields(mapArrivee, 'arrivee', initialLatArrivee, initialLngArrivee, "Arrivée initiale");
            mapArrivee.setView([initialLatArrivee, initialLngArrivee], defaultZoom);
        }
    }
    // --- FONCTIONS DE GESTION DES MARQUEURS ET CHAMPS ---

    /**
     * Ajoute ou met à jour un marqueur sur la carte spécifiée et met à jour les champs de coordonnées.
     * @param {L.Map} mapInstance - Instance de la carte (mapDepart ou mapArrivee).
     * @param {'depart'|'arrivee'} type - Type de point (départ ou arrivée).
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     * @param {string} popupContent - Contenu de la popup du marqueur.
     */
    function updateMarkerAndFields(mapInstance, type, lat, lng, popupContent) {
        let currentMarkerRef, latField, lngField;
        if (type === 'depart') {
            currentMarkerRef = markerDepart;
            latField = document.getElementById(ID_LATITUDE_DEPART);
            lngField = document.getElementById(ID_LONGITUDE_DEPART);
        } else {
            currentMarkerRef = markerArrivee;
            latField = document.getElementById(ID_LATITUDE_ARRIVEE);
            lngField = document.getElementById(ID_LONGITUDE_ARRIVEE);
        }

        if (!latField || !lngField) {
            console.error(`❌ Champs de coordonnées pour le ${type} introuvables. Vérifiez les IDs.`);
            return;
        }

        if (currentMarkerRef) {
            mapInstance.removeLayer(currentMarkerRef);
        }


        const newMarker = L.marker([lat, lng]).addTo(mapInstance);
        newMarker.bindPopup(popupContent).openPopup();

        if (type === 'depart') {
            markerDepart = newMarker;
        } else {
            markerArrivee = newMarker;
        }


        latField.value = lat;
        lngField.value = lng;


        const errorDiv = document.getElementById(`error_${type === 'depart' ? 'adresse_depart' : 'adresse_arrivee'}`);
        if (errorDiv) errorDiv.textContent = '';
        const addressField = document.getElementById(type === 'depart' ? ID_ADRESSE_DEPART : ID_ADRESSE_ARRIVEE);
        if (addressField) addressField.classList.remove('is-invalid');

        console.log(`✅ Coordonnées ${type} mises à jour : Lat: ${lat}, Lng: ${lng}`);
    }


    window.getUserPosition = function (type) {
        let mapInstance;
        if (type === 'depart') {
            mapInstance = mapDepart;
        } else {
            mapInstance = mapArrivee;
        }

        if (navigator.geolocation && mapInstance) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                mapInstance.setView([lat, lng], 13);

                const popupContent = "Votre Position Actuelle";
                updateMarkerAndFields(mapInstance, type, lat, lng, popupContent);

                reverseGeocode(lat, lng, type);

            }, function (error) {
                console.error(`❌ Erreur géolocalisation pour ${type}:`, error);
                alert(`Erreur lors de la récupération de la position pour le ${type}: ` + error.message);
            });
        } else {
            alert("La géolocalisation ou la carte ne sont pas supportées par ce navigateur.");
        }
    }


    function reverseGeocode(lat, lng, type) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data.display_name) {
                    const addressField = document.getElementById(type === 'depart' ? ID_ADRESSE_DEPART : ID_ADRESSE_ARRIVEE);
                    if (addressField) {
                        addressField.value = data.display_name;
                        console.log(`✅ Adresse ${type} mise à jour par géolocalisation inverse: ${data.display_name}`);
                    }
                }
            })
            .catch(error => {
                console.error("Erreur lors du géocodage inverse:", error);
                // Optionnel: Afficher un message à l'utilisateur si le géocodage inverse échoue
                // alert("Impossible de trouver une adresse pour ce point. Veuillez réessayer ou entrer une adresse manuellement.");
            });
    }


    function searchLocation(addressFieldId, type) {
        const addressInput = document.getElementById(addressFieldId);
        if (!addressInput) {
            console.error(`❌ Champ d'adresse '${addressFieldId}' introuvable.`);
            // alert("Erreur interne: champ d'adresse manquant."); // Désactivé car la recherche est automatique
            return;
        }

        const address = addressInput.value;
        if (!address.trim()) {
            // alert("Veuillez entrer une adresse."); // Désactivé pour la recherche automatique (peut être vide temporairement)
            return; // Ne pas rechercher si le champ est vide
        }

        let mapInstance;
        if (type === 'depart') {
            mapInstance = mapDepart;
        } else {
            mapInstance = mapArrivee;
        }

        if (!mapInstance) {
            console.warn(`La carte pour le ${type} n'est pas initialisée. Impossible de rechercher.`);
            return;
        }

        const searchQuery = address + ", Bénin"; // Spécifier le pays pour une meilleure précision

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    mapInstance.setView([lat, lon], 15); // Centre la carte sur le résultat

                    const popupContent = `Adresse trouvée: ${data[0].display_name}`;
                    updateMarkerAndFields(mapInstance, type, lat, lon, popupContent);
                    // Laissez le champ d'adresse avec la valeur que l'utilisateur a tapée ou la valeur normalisée si différente
                    // addressInput.value = data[0].display_name; // Optionnel: mettez à jour avec le nom affiché par l'API
                } else {
                    // MODIFICATION: Gérer l'absence de résultats de manière plus silencieuse pour la recherche automatique
                    // alert(`Aucune adresse trouvée pour "${address}".`);
                    console.log(`🔎 Aucune adresse trouvée pour "${address}" pour le ${type}.`);
                    // Optionnel: Effacer le marqueur si la recherche ne donne rien
                    if (type === 'depart' && markerDepart) {
                        mapDepart.removeLayer(markerDepart);
                        markerDepart = null;
                        document.getElementById(ID_LATITUDE_DEPART).value = '';
                        document.getElementById(ID_LONGITUDE_DEPART).value = '';
                    } else if (type === 'arrivee' && markerArrivee) {
                        mapArrivee.removeLayer(markerArrivee);
                        markerArrivee = null;
                        document.getElementById(ID_LATITUDE_ARRIVEE).value = '';
                        document.getElementById(ID_LONGITUDE_ARRIVEE).value = '';
                    }
                }
            })
            .catch(error => {
                console.error("Erreur lors de la recherche d'adresse:", error);
                // alert("Erreur lors de la recherche d'adresse. Vérifiez votre connexion internet."); // Désactivé
            });
    }


    initializeMaps();

    const demandeTrajetForm = document.getElementById('demandeTrajetForm');
    if (!demandeTrajetForm) {
        console.error("Le formulaire 'demandeTrajetForm' est introuvable. Assurez-vous que l'ID est correct.");
        return;
    }

    // MODIFICATION: Suppression des écouteurs de clic sur les boutons de recherche
    // const searchDepartButton = document.getElementById('search_depart_button');
    // if (searchDepartButton) searchDepartButton.addEventListener('click', () => searchLocation(ID_ADRESSE_DEPART, 'depart'));
    // const searchArriveeButton = document.getElementById('search_arrivee_button');
    // if (searchArriveeButton) searchArriveeButton.addEventListener('click', () => searchLocation(ID_ADRESSE_ARRIVEE, 'arrivee'));

    // NOUVEAU: Ajout des écouteurs d'événements 'input' pour la recherche automatique
    const adresseDepartInput = document.getElementById(ID_ADRESSE_DEPART);
    if (adresseDepartInput) {
        adresseDepartInput.addEventListener('input', function () {
            clearTimeout(searchDepartTimeout); // Réinitialise le timer à chaque frappe
            searchDepartTimeout = setTimeout(() => {
                searchLocation(ID_ADRESSE_DEPART, 'depart');
            }, SEARCH_DELAY_MS);
        });
    }

    const adresseArriveeInput = document.getElementById(ID_ADRESSE_ARRIVEE);
    if (adresseArriveeInput) {
        adresseArriveeInput.addEventListener('input', function () {
            clearTimeout(searchArriveeTimeout); // Réinitialise le timer à chaque frappe
            searchArriveeTimeout = setTimeout(() => {
                searchLocation(ID_ADRESSE_ARRIVEE, 'arrivee');
            }, SEARCH_DELAY_MS);
        });
    }

    const geolocationDepartButton = document.getElementById('geolocation_depart_button');
    if (geolocationDepartButton) geolocationDepartButton.addEventListener('click', () => window.getUserPosition('depart'));
    const geolocationArriveeButton = document.getElementById('geolocation_arrivee_button');
    if (geolocationArriveeButton) geolocationArriveeButton.addEventListener('click', () => window.getUserPosition('arrivee'));


    demandeTrajetForm.addEventListener('submit', function (e) {
        e.preventDefault();


        const latDepartField = document.getElementById(ID_LATITUDE_DEPART);
        const lngDepartField = document.getElementById(ID_LONGITUDE_DEPART);
        const adresseDepartField = document.getElementById(ID_ADRESSE_DEPART);

        const latArriveeField = document.getElementById(ID_LATITUDE_ARRIVEE);
        const lngArriveeField = document.getElementById(ID_LONGITUDE_ARRIVEE);
        const adresseArriveeField = document.getElementById(ID_ADRESSE_ARRIVEE);

        clearFormErrors();

        let formIsValid = true;


        if (!latDepartField.value || !lngDepartField.value || isNaN(parseFloat(latDepartField.value)) || isNaN(parseFloat(lngDepartField.value)) || !adresseDepartField.value.trim()) {
            displayFieldError(ID_ADRESSE_DEPART, "Veuillez définir un point de départ sur la carte (clic ou recherche).");
            formIsValid = false;
        }


        if (adresseArriveeField.value.trim()) {
            if (!latArriveeField.value || !lngArriveeField.value || isNaN(parseFloat(latArriveeField.value)) || isNaN(parseFloat(lngArriveeField.value))) {
                displayFieldError(ID_ADRESSE_ARRIVEE, "Si vous avez entré une adresse d'arrivée, veuillez la sélectionner sur la carte ou utiliser le bouton de recherche.");
                formIsValid = false;
            }
        } else {
            // Si le champ d'adresse d'arrivée est vide mais qu'un marqueur ou des coords sont là
            if (latArriveeField.value || lngArriveeField.value) {
                // MODIFICATION: Le message est plus précis maintenant que la recherche est automatique
                displayFieldError(ID_ADRESSE_ARRIVEE, "Vous avez un point d'arrivée sur la carte sans adresse. Veuillez effacer le point ou taper une adresse.");

                // Réinitialise le marqueur et les champs si l'adresse est vide pour forcer une correction
                latArriveeField.value = '';
                lngArriveeField.value = '';
                if (markerArrivee) {
                    mapArrivee.removeLayer(markerArrivee);
                    markerArrivee = null;
                }
            }
        }

        if (!formIsValid) {
            displayGeneralError("Veuillez corriger les erreurs dans le formulaire avant de soumettre.");
            return;
        }

        console.log("📤 Soumission du formulaire de demande AJAX...");

        const formData = new FormData(this);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        console.log("Données JSON envoyées:", jsonData);

        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Soumission en cours...';
        }

        fetch(this.action, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': jsonData['csrfmiddlewaretoken'],
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        throw { status: response.status, data: data };
                    }
                    return data;
                });
            })
            .then(data => {
                console.log("✅ Réponse du serveur (succès):", data);
                displayGeneralSuccess(data.message || 'Votre demande de trajet a été soumise avec succès !');

                demandeTrajetForm.reset();
                // Effacer explicitement les valeurs des champs cachés et supprimer les marqueurs
                document.getElementById(ID_LATITUDE_DEPART).value = '';
                document.getElementById(ID_LONGITUDE_DEPART).value = '';
                document.getElementById(ID_LATITUDE_ARRIVEE).value = '';
                document.getElementById(ID_LONGITUDE_ARRIVEE).value = '';
                if (markerDepart) { mapDepart.removeLayer(markerDepart); markerDepart = null; }
                if (markerArrivee) { mapArrivee.removeLayer(markerArrivee); markerArrivee = null; }

                // Recentrer les cartes sur les coordonnées par défaut après soumission
                mapDepart.setView(defaultCoords, defaultZoom);
                mapArrivee.setView(defaultCoords, defaultZoom);

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Soumettre la Demande';
                }
            })
            .catch(error => {
                console.error('❌ Erreur lors de la soumission AJAX:', error);
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Soumettre la Demande';
                }

                if (error.data && error.data.errors) {
                    try {
                        const parsedErrors = JSON.parse(error.data.errors);
                        displayFormErrors(parsedErrors);
                    } catch (e) {
                        console.error("Erreur de parsing des erreurs du serveur:", e);
                        displayGeneralError("Erreur de format des messages d'erreur du serveur.");
                    }
                } else {
                    displayGeneralError(error.data ? (error.data.message || "Une erreur inattendue est survenue.") : "Une erreur réseau ou inattendue est survenue. Veuillez réessayer.");
                }
            });
    });


    function displayGeneralSuccess(message) {
        const successDiv = document.getElementById('message_success');
        const errorDiv = document.getElementById('message_error');
        if (successDiv) {
            successDiv.innerHTML = message;
            successDiv.style.display = 'block';
        }
        if (errorDiv) errorDiv.style.display = 'none';
    }

    function displayGeneralError(message) {
        const successDiv = document.getElementById('message_success');
        const errorDiv = document.getElementById('message_error');
        if (errorDiv) {
            errorDiv.innerHTML = message;
            errorDiv.style.display = 'block';
        }
        if (successDiv) successDiv.style.display = 'none';
    }

    function displayFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            let feedbackDiv = document.getElementById(`error_${fieldId.replace('id_', '')}`);
            if (!feedbackDiv) {
                feedbackDiv = document.createElement('div');
                feedbackDiv.classList.add('invalid-feedback');
                feedbackDiv.id = `error_${fieldId.replace('id_', '')}`;
                field.parentNode.insertBefore(feedbackDiv, field.nextSibling);
            }
            feedbackDiv.textContent = message;
        } else {
            console.warn(`Champ "${fieldId}" introuvable pour afficher l'erreur.`);
        }
    }

    function clearFormErrors() {
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
        document.getElementById('message_success').style.display = 'none';
        document.getElementById('message_error').style.display = 'none';
    }

    function displayFormErrors(errors) {
        clearFormErrors();

        for (const fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                const fieldErrors = errors[fieldName];

                if (fieldName === '__all__') {
                    displayGeneralError(fieldErrors.join('<br>'));
                } else {
                    const field = document.getElementById(`id_${fieldName}`);
                    if (field) {
                        field.classList.add('is-invalid');
                        let feedbackDiv = document.getElementById(`error_${fieldName}`);
                        if (!feedbackDiv) {
                            feedbackDiv = document.createElement('div');
                            feedbackDiv.classList.add('invalid-feedback');
                            feedbackDiv.id = `error_${fieldName}`;
                            field.parentNode.insertBefore(feedbackDiv, field.nextSibling);
                        }
                        feedbackDiv.innerHTML = fieldErrors.map(msg => `<div>${msg}</div>`).join('');
                    } else {
                        console.warn(`Champ de formulaire "${fieldName}" (id_` + fieldName + `) introuvable pour afficher les erreurs.`);
                    }
                }
            }
        }
    }
});