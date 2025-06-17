// algorithme/static/algorithme/js/formulaire_demande_map.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la demande de trajet (avec deux cartes Leaflet)!");

    const defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin
    const defaultZoom = 13;

    // Variables globales pour les cartes et les marqueurs
    let mapDepart = null;
    let markerDepart = null;
    let mapArrivee = null;
    let markerArrivee = null;

    // IDs des champs d'entrée du formulaire (AJUSTÉS POUR CORRESPONDRE À Django forms)
    const ID_ADRESSE_DEPART = "id_adresse_depart";
    const ID_LATITUDE_DEPART = "id_latitude_depart";
    const ID_LONGITUDE_DEPART = "id_longitude_depart";

    const ID_ADRESSE_ARRIVEE = "id_adresse_arrivee";
    const ID_LATITUDE_ARRIVEE = "id_latitude_arrivee";
    const ID_LONGITUDE_ARRIVEE = "id_longitude_arrivee";

    // --- INITIALISATION DES CARTES ---
    function initializeMaps() {
        // Initialisation de la carte de DÉPART
        const mapDepartDiv = document.getElementById('map_demande_depart');
        if (mapDepartDiv) {
            if (mapDepart !== null) mapDepart.remove(); // Supprime l'ancienne instance
            mapDepart = L.map('map_demande_depart').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapDepart);
            console.log("Map de départ initialisée.");

            // Événement clic sur la carte de DÉPART
            mapDepart.on('click', function (e) {
                updateMarkerAndFields(mapDepart, 'depart', e.latlng.lat, e.latlng.lng, 
                    `<b>Point de Départ</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`);
            });
        } else {
            console.error("❌ Élément 'map_demande_depart' introuvable. La carte de départ ne peut pas être initialisée.");
        }

        // Initialisation de la carte d'ARRIVÉE
        const mapArriveeDiv = document.getElementById('map_demande_arrivee');
        if (mapArriveeDiv) {
            if (mapArrivee !== null) mapArrivee.remove(); // Supprime l'ancienne instance
            mapArrivee = L.map('map_demande_arrivee').setView(defaultCoords, defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapArrivee);
            console.log("Map d'arrivée initialisée.");

            // Événement clic sur la carte d'ARRIVÉE
            mapArrivee.on('click', function (e) {
                updateMarkerAndFields(mapArrivee, 'arrivee', e.latlng.lat, e.latlng.lng, 
                    `<b>Point d'Arrivée</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`);
            });
        } else {
            console.error("❌ Élément 'map_demande_arrivee' introuvable. La carte d'arrivée ne peut pas être initialisée.");
        }

        // Initialiser les marqueurs si des valeurs sont déjà présentes dans les champs au chargement
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
        } else { // type === 'arrivee'
            currentMarkerRef = markerArrivee;
            latField = document.getElementById(ID_LATITUDE_ARRIVEE);
            lngField = document.getElementById(ID_LONGITUDE_ARRIVEE);
        }

        if (!latField || !lngField) {
            console.error(`❌ Champs de coordonnées pour le ${type} introuvables. Vérifiez les IDs.`);
            return;
        }

        // Supprime l'ancien marqueur si il existe
        if (currentMarkerRef) {
            mapInstance.removeLayer(currentMarkerRef);
        }

        // Ajoute le nouveau marqueur
        const newMarker = L.marker([lat, lng]).addTo(mapInstance);
        newMarker.bindPopup(popupContent).openPopup();

        // Met à jour la référence globale du marqueur
        if (type === 'depart') {
            markerDepart = newMarker;
        } else {
            markerArrivee = newMarker;
        }

        // Met à jour les champs cachés
        latField.value = lat;
        lngField.value = lng;
        
        // Nettoie l'erreur de validation JavaScript si elle était présente
        const errorDiv = document.getElementById(`error_${type === 'depart' ? 'adresse_depart' : 'adresse_arrivee'}`);
        if (errorDiv) errorDiv.textContent = '';
        const addressField = document.getElementById(type === 'depart' ? ID_ADRESSE_DEPART : ID_ADRESSE_ARRIVEE);
        if (addressField) addressField.classList.remove('is-invalid');

        console.log(`✅ Coordonnées ${type} mises à jour : Lat: ${lat}, Lng: ${lng}`);
    }

    // --- GÉOLOCALISATION DE L'UTILISATEUR ---
    window.getUserPosition = function (type) {
        let mapInstance;
        if (type === 'depart') {
            mapInstance = mapDepart;
        } else { // type === 'arrivee'
            mapInstance = mapArrivee;
        }

        if (navigator.geolocation && mapInstance) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                mapInstance.setView([lat, lng], 13);

                const popupContent = "Votre Position Actuelle";
                updateMarkerAndFields(mapInstance, type, lat, lng, popupContent);
                // Optionnel: Mettre l'adresse approximative dans le champ texte
                reverseGeocode(lat, lng, type);

            }, function (error) {
                console.error(`❌ Erreur géolocalisation pour ${type}:`, error);
                alert(`Erreur lors de la récupération de la position pour le ${type}: ` + error.message);
            });
        } else {
            alert("La géolocalisation ou la carte ne sont pas supportées par ce navigateur.");
        }
    }

    // Fonction de géocodage inverse (coordonnées vers adresse)
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
            });
    }

    // --- RECHERCHE D'ADRESSE (Nominatim) ---
    function searchLocation(addressFieldId, type) {
        const addressInput = document.getElementById(addressFieldId);
        if (!addressInput) {
            console.error(`❌ Champ d'adresse '${addressFieldId}' introuvable.`);
            alert("Erreur interne: champ d'adresse manquant.");
            return;
        }

        const address = addressInput.value;
        if (!address.trim()) {
            alert("Veuillez entrer une adresse.");
            return;
        }

        let mapInstance;
        if (type === 'depart') {
            mapInstance = mapDepart;
        } else {
            mapInstance = mapArrivee;
        }

        if (!mapInstance) {
            alert(`La carte pour le ${type} n'est pas initialisée.`);
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
                    mapInstance.setView([lat, lon], 15); // Centrer et zoomer sur le résultat

                    const popupContent = `Adresse trouvée: ${data[0].display_name}`;
                    updateMarkerAndFields(mapInstance, type, lat, lon, popupContent);
                    addressInput.value = data[0].display_name; // Met à jour le champ texte avec l'adresse complète
                } else {
                    alert(`Aucune adresse trouvée pour "${address}".`);
                }
            })
            .catch(error => {
                console.error("Erreur lors de la recherche d'adresse:", error);
                alert("Erreur lors de la recherche d'adresse. Vérifiez votre connexion internet.");
            });
    }

    // --- LIAISON DES ÉLÉMENTS DU FORMULAIRE ---
    initializeMaps(); // Initialiser les cartes au chargement du DOM

    const demandeTrajetForm = document.getElementById('demandeTrajetForm');
    if (!demandeTrajetForm) {
        console.error("Le formulaire 'demandeTrajetForm' est introuvable. Assurez-vous que l'ID est correct.");
        return;
    }

    // Boutons de recherche d'adresse
    const searchDepartButton = document.getElementById('search_depart_button');
    if (searchDepartButton) searchDepartButton.addEventListener('click', () => searchLocation(ID_ADRESSE_DEPART, 'depart'));
    const searchArriveeButton = document.getElementById('search_arrivee_button');
    if (searchArriveeButton) searchArriveeButton.addEventListener('click', () => searchLocation(ID_ADRESSE_ARRIVEE, 'arrivee'));

    // Boutons de géolocalisation
    const geolocationDepartButton = document.getElementById('geolocation_depart_button');
    if (geolocationDepartButton) geolocationDepartButton.addEventListener('click', () => window.getUserPosition('depart'));
    const geolocationArriveeButton = document.getElementById('geolocation_arrivee_button');
    if (geolocationArriveeButton) geolocationArriveeButton.addEventListener('click', () => window.getUserPosition('arrivee'));


    // --- GESTION DE LA SOUMISSION DU FORMULAIRE AJAX ---
    demandeTrajetForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Récupérer les champs de coordonnées pour validation
        const latDepartField = document.getElementById(ID_LATITUDE_DEPART);
        const lngDepartField = document.getElementById(ID_LONGITUDE_DEPART);
        const adresseDepartField = document.getElementById(ID_ADRESSE_DEPART);

        const latArriveeField = document.getElementById(ID_LATITUDE_ARRIVEE);
        const lngArriveeField = document.getElementById(ID_LONGITUDE_ARRIVEE);
        const adresseArriveeField = document.getElementById(ID_ADRESSE_ARRIVEE);

        clearFormErrors(); // Nettoyer les messages d'erreur précédents

        let formIsValid = true;

        // Validation du point de départ (obligatoire)
        if (!latDepartField.value || !lngDepartField.value || isNaN(parseFloat(latDepartField.value)) || isNaN(parseFloat(lngDepartField.value)) || !adresseDepartField.value.trim()) {
            displayFieldError(ID_ADRESSE_DEPART, "Veuillez définir un point de départ sur la carte (clic ou recherche).");
            formIsValid = false;
        }

        // Validation du point d'arrivée (si l'adresse d'arrivée est renseignée, les coords doivent l'être, sinon les coords doivent être vides)
        if (adresseArriveeField.value.trim()) {
            if (!latArriveeField.value || !lngArriveeField.value || isNaN(parseFloat(latArriveeField.value)) || isNaN(parseFloat(lngArriveeField.value))) {
                displayFieldError(ID_ADRESSE_ARRIVEE, "Si vous avez entré une adresse d'arrivée, veuillez la sélectionner sur la carte ou utiliser le bouton de recherche.");
                formIsValid = false;
            }
        } else {
            // Si l'adresse d'arrivée est vide, les coordonnées doivent aussi être vides
            if (latArriveeField.value || lngArriveeField.value) {
                // Si des coordonnées sont là sans adresse, on les efface et on prévient l'utilisateur
                displayFieldError(ID_ADRESSE_ARRIVEE, "Si vous avez défini un point d'arrivée sur la carte, veuillez renseigner l'adresse d'arrivée ou effacer le point.");
                // Effacer les coordonnées et le marqueur pour éviter l'envoi de données incohérentes
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
                // Réinitialiser les champs cachés et les marqueurs après succès
                document.getElementById(ID_LATITUDE_DEPART).value = '';
                document.getElementById(ID_LONGITUDE_DEPART).value = '';
                document.getElementById(ID_LATITUDE_ARRIVEE).value = '';
                document.getElementById(ID_LONGITUDE_ARRIVEE).value = '';
                if (markerDepart) { mapDepart.removeLayer(markerDepart); markerDepart = null; }
                if (markerArrivee) { mapArrivee.removeLayer(markerArrivee); markerArrivee = null; }
                
                // Réinitialiser la vue des cartes
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

    // --- Fonctions utilitaires d'affichage des messages ---

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
            errorDiv.innerHTML = message; // Use innerHTML to allow for <br>
            errorDiv.style.display = 'block';
        }
        if (successDiv) successDiv.style.display = 'none';
    }

    function displayFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            let feedbackDiv = document.getElementById(`error_${fieldId.replace('id_', '')}`); // Adjust ID for error div
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

    // Fonction pour afficher les erreurs reçues de Django (via form.errors.as_json())
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
                        let feedbackDiv = document.getElementById(`error_${fieldName}`); // Assurez-vous que l'ID correspond au template
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