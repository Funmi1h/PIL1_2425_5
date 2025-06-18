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
    const ID_HEURE_DEPART_PREVUE = "id_heure_depart_prevue"; // Ajouté
    const ID_DATE_DEPART = "id_date_depart"; // Ajouté

    const ID_ADRESSE_ARRIVEE = "id_adresse_arrivee";
    const ID_LATITUDE_ARRIVEE = "id_latitude_arrivee";
    const ID_LONGITUDE_ARRIVEE = "id_longitude_arrivee";
    const ID_HEURE_ARRIVEE_PREVUE = "id_heure_arrivee_prevue"; // Ajouté

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

            // Géocodage inverse au clic sur la carte de départ
            mapDepart.on('click', function (e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                updateMarkerAndFields(mapDepart, 'depart', lat, lng,
                    `<b>Point de Départ</b>`);
                reverseGeocode(lat, lng, 'depart');
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

            // Géocodage inverse au clic sur la carte d'arrivée
            mapArrivee.on('click', function (e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                updateMarkerAndFields(mapArrivee, 'arrivee', lat, lng,
                    `<b>Point d'Arrivée</b>`);
                reverseGeocode(lat, lng, 'arrivee');
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
            });
    }

    function searchLocation(addressFieldId, type) {
        const addressInput = document.getElementById(addressFieldId);
        if (!addressInput) {
            console.error(`❌ Champ d'adresse '${addressFieldId}' introuvable.`);
            return;
        }

        const address = addressInput.value;
        if (!address.trim()) {
            return;
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
                } else {
                    console.log(`🔎 Aucune adresse trouvée pour "${address}" pour le ${type}.`);
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
            });
    }

    initializeMaps();

    const demandeTrajetForm = document.getElementById('demandeTrajetForm');
    if (!demandeTrajetForm) {
        console.error("Le formulaire 'demandeTrajetForm' est introuvable. Assurez-vous que l'ID est correct.");
        return;
    }

    const adresseDepartInput = document.getElementById(ID_ADRESSE_DEPART);
    if (adresseDepartInput) {
        adresseDepartInput.addEventListener('input', function () {
            clearTimeout(searchDepartTimeout); 
            searchDepartTimeout = setTimeout(() => {
                searchLocation(ID_ADRESSE_DEPART, 'depart');
            }, SEARCH_DELAY_MS);
        });
    }

    const adresseArriveeInput = document.getElementById(ID_ADRESSE_ARRIVEE);
    if (adresseArriveeInput) {
        adresseArriveeInput.addEventListener('input', function () {
            clearTimeout(searchArriveeTimeout); 
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
        const heureDepartField = document.getElementById(ID_HEURE_DEPART_PREVUE); // Récupère le champ heure
        const dateDepartField = document.getElementById(ID_DATE_DEPART); // Récupère le champ date

        const latArriveeField = document.getElementById(ID_LATITUDE_ARRIVEE);
        const lngArriveeField = document.getElementById(ID_LONGITUDE_ARRIVEE);
        const adresseArriveeField = document.getElementById(ID_ADRESSE_ARRIVEE);
        const heureArriveeField = document.getElementById(ID_HEURE_ARRIVEE_PREVUE); // Récupère le champ heure d'arrivée

        clearFormErrors(); // Nettoie toutes les erreurs précédentes

        let formIsValid = true;

        // Validation côté client pour le champ adresse_depart
        if (!latDepartField.value || !lngDepartField.value || isNaN(parseFloat(latDepartField.value)) || isNaN(parseFloat(lngDepartField.value)) || !adresseDepartField.value.trim()) {
            displayFieldError(ID_ADRESSE_DEPART, "Veuillez définir un point de départ sur la carte (clic ou recherche).");
            formIsValid = false;
        }

        // Validation côté client pour le champ date_depart (nouveau)
        if (!dateDepartField.value.trim()) {
            displayFieldError(ID_DATE_DEPART, "Veuillez sélectionner une date de départ.");
            formIsValid = false;
        }

        // Validation côté client pour le champ heure_depart_prevue
        if (!heureDepartField.value.trim()) {
            displayFieldError(ID_HEURE_DEPART_PREVUE, "Veuillez spécifier une heure de départ.");
            formIsValid = false;
        }

        // Validation conditionnelle pour l'arrivée
        if (adresseArriveeField.value.trim()) {
            if (!latArriveeField.value || !lngArriveeField.value || isNaN(parseFloat(latArriveeField.value)) || isNaN(parseFloat(lngArriveeField.value))) {
                displayFieldError(ID_ADRESSE_ARRIVEE, "Si vous avez entré une adresse d'arrivée, veuillez la sélectionner sur la carte ou utiliser le bouton de recherche.");
                formIsValid = false;
            }
            if (!heureArriveeField.value.trim()) {
                displayFieldError(ID_HEURE_ARRIVEE_PREVUE, "Si vous avez entré une adresse d'arrivée, veuillez spécifier une heure d'arrivée.");
                formIsValid = false;
            }
        } else {
            // Si le champ d'adresse d'arrivée est vide mais qu'un marqueur ou des coords sont là
            if (latArriveeField.value || lngArriveeField.value) {
                displayFieldError(ID_ADRESSE_ARRIVEE, "Vous avez un point d'arrivée sur la carte sans adresse. Veuillez effacer le point ou taper une adresse.");
                // Optionnel: Réinitialiser les champs et le marqueur d'arrivée si l'adresse est vide
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
            return; // Arrête la soumission si la validation client échoue
        }

        console.log("📤 Soumission du formulaire de demande AJAX...");

        const formData = new FormData(this);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });

        // Debugging: Afficher les données JSON avant l'envoi
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
            // Toujours essayer de lire la réponse comme JSON
            return response.json().then(data => {
                if (!response.ok) {
                    // Si la réponse n'est pas OK (statut >= 400), rejeter la promesse avec les données d'erreur
                    throw { status: response.status, data: data };
                }
                return data; // Si la réponse est OK, retourner les données de succès
            });
        })
        .then(data => {
            // Bloc de succès
            console.log("✅ Réponse du serveur (succès):", data);
            displayGeneralSuccess(data.message || 'Votre demande de trajet a été soumise avec succès !');

            // Réinitialiser le formulaire et les cartes après un succès
            demandeTrajetForm.reset();
            document.getElementById(ID_LATITUDE_DEPART).value = '';
            document.getElementById(ID_LONGITUDE_DEPART).value = '';
            document.getElementById(ID_LATITUDE_ARRIVEE).value = '';
            document.getElementById(ID_LONGITUDE_ARRIVEE).value = '';
            if (markerDepart) { mapDepart.removeLayer(markerDepart); markerDepart = null; }
            if (markerArrivee) { mapArrivee.removeLayer(markerArrivee); markerArrivee = null; }
            mapDepart.setView(defaultCoords, defaultZoom);
            mapArrivee.setView(defaultCoords, defaultZoom);

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Soumettre la Demande';
            }
        })
        .catch(error => {
            // Bloc de gestion des erreurs
            console.error('❌ Erreur lors de la soumission AJAX:', error);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Soumettre la Demande';
            }

            if (error.data && error.data.errors) {
                try {
                    // Les erreurs de Django sont envoyées sous forme de chaîne JSON, il faut la parser
                    const parsedErrors = JSON.parse(error.data.errors);
                    displayFormErrors(parsedErrors);
                } catch (e) {
                    console.error("Erreur de parsing des erreurs du serveur (format JSON inattendu):", e);
                    displayGeneralError("Erreur interne: Impossible de lire les messages d'erreur du serveur.");
                }
            } else {
                // Erreur générale (par ex. réseau, ou erreur 500 sans data.errors)
                displayGeneralError(error.data ? (error.data.message || "Une erreur inattendue est survenue.") : "Une erreur réseau ou inattendue est survenue. Veuillez réessayer.");
            }
        });
    });

    // --- Fonctions d'affichage des messages (général et par champ) ---

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
            // L'ID du div de feedback est 'error_' suivi du nom du champ (sans 'id_')
            let feedbackDiv = document.getElementById(`error_${fieldId.replace('id_', '')}`); 
            if (!feedbackDiv) {
                // Crée le div de feedback si non existant (utile pour les erreurs côté client avant l'envoi)
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
        // Supprime la classe 'is-invalid' de tous les champs
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        // Vide le contenu de tous les divs de feedback d'erreur
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
        // Cache les messages généraux de succès/erreur
        document.getElementById('message_success').style.display = 'none';
        document.getElementById('message_error').style.display = 'none';
    }

    /**
     * Affiche les erreurs de validation reçues du serveur Django.
     * @param {object} errors - Un objet où les clés sont les noms de champ
     * et les valeurs sont des tableaux d'objets {message: "...", code: "..."}.
     * Peut contenir une clé '__all__' pour les erreurs non liées à un champ spécifique.
     */
    function displayFormErrors(errors) {
        clearFormErrors(); // Nettoie toutes les erreurs précédentes

        for (const fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                const fieldErrors = errors[fieldName]; // C'est un tableau d'objets {message: "...", code: "..."}

                if (fieldName === '__all__') {
                    // Gère les erreurs non liées à un champ spécifique
                    displayGeneralError(fieldErrors.map(errObj => errObj.message).join('<br>'));
                } else {
                    const field = document.getElementById(`id_${fieldName}`); // Cherche l'élément du champ par son ID Django
                    if (field) {
                        field.classList.add('is-invalid'); // Ajoute la classe de style pour indiquer une erreur
                        
                        // Cherche le div de feedback d'erreur spécifique à ce champ
                        let feedbackDiv = document.getElementById(`error_${fieldName}`); 
                        if (!feedbackDiv) {
                            // Si le div n'existe pas (par ex. si ajouté dynamiquement), le créer
                            feedbackDiv = document.createElement('div');
                            feedbackDiv.classList.add('invalid-feedback');
                            feedbackDiv.id = `error_${fieldName}`;
                            // Insère le div juste après le champ
                            field.parentNode.insertBefore(feedbackDiv, field.nextSibling);
                        }
                        // Remplir le div de feedback avec les messages d'erreur
                        // Map chaque objet d'erreur à sa propriété 'message' et joindre avec des <br>
                        feedbackDiv.innerHTML = fieldErrors.map(errObj => `<div>${errObj.message}</div>`).join('');
                    } else {
                        // Avertissement si le champ HTML n'est pas trouvé (pour le débogage)
                        console.warn(`Champ de formulaire HTML "${fieldName}" (ID attendu: id_` + fieldName + `) introuvable pour afficher les erreurs.`);
                    }
                }
            }
        }
    }
});