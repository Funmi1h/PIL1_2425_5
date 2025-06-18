L.Icon.Default.mergeOptions({
    iconRetinaUrl: '{% static "leaflet/images/marker-icon-2x.png" %}',
    iconUrl: '{% static "leaflet/images/marker-icon.png" %}',
    shadowUrl: '{% static "leaflet/images/marker-shadow.png" %}',
});
if (typeof L !== 'undefined' && typeof window.leafletDefaultIconPaths !== 'undefined') {
    L.Icon.Default.mergeOptions(window.leafletDefaultIconPaths);
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la page de proposition de trajet !");

    if (typeof L === 'undefined') {
        console.error("❌ Leaflet n'est pas chargé ! Assurez-vous que leaflet.js est inclus dans base.html avant ce script.");
        return;
    }

    var defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin
    var defaultZoom = 13;

    // --- Initialisation de la carte de départ (pour la proposition de trajet) ---
    const mapProposerDepartElement = document.getElementById('map_proposer_depart');
    let mapProposerDepart;
    let markerProposerDepartRef = { current: null };

    if (mapProposerDepartElement) {
        mapProposerDepart = L.map('map_proposer_depart').setView(defaultCoords, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapProposerDepart);
        mapProposerDepart.invalidateSize();
    } else {
        console.error("❌ Élément 'map_proposer_depart' introuvable dans le DOM. La carte de départ ne sera pas initialisée.");
    }

    // --- Initialisation de la carte d'arrivée (pour la proposition de trajet) ---
    const mapProposerArriveeElement = document.getElementById('map_proposer_arrivee');
    let mapProposerArrivee;
    let markerProposerArriveeRef = { current: null };

    if (mapProposerArriveeElement) {
        mapProposerArrivee = L.map('map_proposer_arrivee').setView(defaultCoords, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapProposerArrivee);
        mapProposerArrivee.invalidateSize();
    } else {
        console.error("❌ Élément 'map_proposer_arrivee' introuvable dans le DOM. La carte d'arrivée ne sera pas initialisée.");
    }

    // --- Références aux champs de formulaire et divs d'erreur spécifiques à proposer_trajet.html ---
    const latitudeDepartInput = document.getElementById('id_latitude_depart');
    const longitudeDepartInput = document.getElementById('id_longitude_depart');
    const adresseDepartInput = document.getElementById('id_adresse_depart');

    const latitudeArriveeInput = document.getElementById('id_latitude_arrivee');
    const longitudeArriveeInput = document.getElementById('id_longitude_arrivee');
    const adresseArriveeInput = document.getElementById('id_adresse_arrivee');

    const heureDepartPrevueInput = document.getElementById('id_heure_depart_prevue');
    const heureArriveePrevueInput = document.getElementById('id_heure_arrivee_prevue');
    const nbPlacesInput = document.getElementById('id_nb_places_disponibles');
    const dateDepartInput = document.getElementById('id_date_depart');
    
    // --- Fonctions utilitaires pour les marqueurs et champs ---
    function updateMarkerAndFields(mapInstance, markerRef, lat, lng, popupContent, latInput, lngInput) { // Retire coordsErrorDiv car displayFieldError gère maintenant l'affichage
        console.log(`Mise à jour du marqueur et des champs : Lat=${lat}, Lng=${lng}`);

        if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance);
        markerRef.current.bindPopup(popupContent).openPopup();

        mapInstance.setView([lat, lng], 15);

        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;

        console.log(`✅ Coordonnées mises à jour : Lat: ${lat}, Lng: ${lng}`);
    }

    function reverseGeocodeNominatim(lat, lon) {
        return new Promise((resolve, reject) => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.display_name) {
                        resolve(data.display_name);
                    } else {
                        reject(`Aucune adresse trouvée pour les coordonnées Lat: ${lat}, Lng: ${lon}.`);
                    }
                })
                .catch(error => {
                    reject(`Erreur lors du géocodage inverse: ${error.message}`);
                });
        });
    }

    function directGeocodeNominatim(address) {
        return new Promise((resolve, reject) => {
            const searchQuery = encodeURIComponent(address + ", Bénin");
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&addressdetails=1&limit=1`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.length > 0) {
                        resolve({
                            lat: parseFloat(data[0].lat),
                            lon: parseFloat(data[0].lon),
                            display_name: data[0].display_name
                        });
                    } else {
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error("Erreur lors du géocodage direct:", error);
                    reject(error);
                });
        });
    }

    async function searchAndPlaceMarker(address, mapInstance, markerRef, latInput, lngInput, addressInput, popupTitle) { // Retire coordsErrorDiv
        if (!address.trim()) {
            if (markerRef.current) {
                mapInstance.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            if (latInput) latInput.value = '';
            if (lngInput) lngInput.value = '';
            if (addressInput) addressInput.value = '';
            clearFieldError(addressInput.id.replace('id_', '')); // Nettoie l'erreur du champ d'adresse
            console.log(`Adresse vide. Marqueur et coordonnées pour ${popupTitle} réinitialisés.`);
            return;
        }

        try {
            const result = await directGeocodeNominatim(address);
            if (result) {
                const lat = result.lat;
                const lon = result.lon;
                const popupContent = `<b>${popupTitle}</b><br>${result.display_name}<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lon.toFixed(6)}`;
                updateMarkerAndFields(mapInstance, markerRef, lat, lon, popupContent, latInput, lngInput);
                if (addressInput) addressInput.value = result.display_name;
                clearFieldError(addressInput.id.replace('id_', '')); // Nettoie l'erreur du champ d'adresse
                
                // Si ce sont les champs de départ, on valide explicitement les coordonnées
                if (addressInput.id === 'id_adresse_depart' && (lat === 0 || lng === 0)) { // Si les coordonnées sont à 0, elles sont peut-être invalides
                    displayFieldError('latitude_depart', "Veuillez sélectionner un point de départ valide sur la carte.");
                    displayFieldError('longitude_depart', "Veuillez sélectionner un point de départ valide sur la carte.");
                } else if (addressInput.id === 'id_adresse_arrivee' && (lat === 0 || lng === 0)) {
                    displayFieldError('latitude_arrivee', "Veuillez sélectionner un point d'arrivée valide sur la carte.");
                    displayFieldError('longitude_arrivee', "Veuillez sélectionner un point d'arrivée valide sur la carte.");
                }

                console.log(`✅ Adresse ${popupTitle} trouvée et carte mise à jour: ${result.display_name}`);
            } else {
                if (markerRef.current) {
                    mapInstance.removeLayer(markerRef.current);
                    markerRef.current = null;
                }
                if (latInput) latInput.value = '';
                if (lngInput) lngInput.value = '';
                if (addressInput) addressInput.value = '';
                displayFieldError(addressInput.id.replace('id_', ''), `Aucun résultat trouvé pour "${address}". Veuillez être plus précis ou cliquer sur la carte.`);
                console.warn(`Aucune adresse trouvée pour: "${address}"`);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche et du placement du marqueur:", error);
            displayFieldError(addressInput.id.replace('id_', ''), "Erreur de connexion pour la recherche d'adresse. Veuillez réessayer.");
        }
    }

    // --- Écouteurs d'événements pour les clics sur les cartes ---
    if (mapProposerDepart) {
        mapProposerDepart.on('click', async function (e) {
            console.log("Clic sur la carte de départ (proposer) à :", e.latlng);
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            updateMarkerAndFields(mapProposerDepart, markerProposerDepartRef, lat, lng,
                `<b>Point de Départ</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`,
                latitudeDepartInput, longitudeDepartInput); // Retire coordsErrorDiv

            try {
                const address = await reverseGeocodeNominatim(lat, lng);
                adresseDepartInput.value = address;
                console.log(`✅ Adresse de départ trouvée via clic carte: ${address}`);
                // Nettoie les erreurs des champs cachés et de l'adresse visible
                clearFieldError('latitude_depart');
                clearFieldError('longitude_depart');
                clearFieldError('adresse_depart');
            } catch (error) {
                console.error("Erreur de géocodage inverse pour départ (clic carte):", error);
                displayFieldError('adresse_depart', `Impossible de trouver l'adresse pour ce point. ${error}`);
                adresseDepartInput.value = '';
            }
        });
    }

    if (mapProposerArrivee) {
        mapProposerArrivee.on('click', async function (e) {
            console.log("Clic sur la carte d'arrivée (proposer) à :", e.latlng);
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            updateMarkerAndFields(mapProposerArrivee, markerProposerArriveeRef, lat, lng,
                `<b>Point d'Arrivée</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`,
                latitudeArriveeInput, longitudeArriveeInput); // Retire coordsErrorDiv

            try {
                const address = await reverseGeocodeNominatim(lat, lng);
                adresseArriveeInput.value = address;
                console.log(`✅ Adresse d'arrivée trouvée via clic carte: ${address}`);
                clearFieldError('latitude_arrivee');
                clearFieldError('longitude_arrivee');
                clearFieldError('adresse_arrivee');
            } catch (error) {
                console.error("Erreur de géocodage inverse pour arrivée (clic carte):", error);
                displayFieldError('adresse_arrivee', `Impossible de trouver l'adresse pour ce point. ${error}`);
                adresseArriveeInput.value = '';
            }
        });
    }

    // --- Implémentation du Debounce pour l'autocomplétion ---
    let debounceTimerDepart;
    let debounceTimerArrivee;
    const DEBOUNCE_DELAY = 1000;

    if (adresseDepartInput) {
        adresseDepartInput.addEventListener("input", function() {
            clearTimeout(debounceTimerDepart);
            const address = this.value;
            debounceTimerDepart = setTimeout(() => {
                if (mapProposerDepart) {
                    searchAndPlaceMarker(address, mapProposerDepart, markerProposerDepartRef, latitudeDepartInput, longitudeDepartInput, adresseDepartInput, 'Adresse de Départ');
                } else {
                    console.warn("La carte de départ n'est pas initialisée pour l'autocomplétion.");
                }
            }, DEBOUNCE_DELAY);
        });
        document.getElementById('searchDepartAddressBtn').addEventListener('click', () => {
            clearTimeout(debounceTimerDepart); // Exécute immédiatement
            searchAndPlaceMarker(adresseDepartInput.value, mapProposerDepart, markerProposerDepartRef, latitudeDepartInput, longitudeDepartInput, adresseDepartInput, 'Adresse de Départ');
        });
    } else {
        console.error("❌ Champ 'id_adresse_depart' introuvable. L'autocomplétion de départ ne sera pas activée.");
    }

    if (adresseArriveeInput) {
        adresseArriveeInput.addEventListener("input", function() {
            clearTimeout(debounceTimerArrivee);
            const address = this.value;
            debounceTimerArrivee = setTimeout(() => {
                if (mapProposerArrivee) {
                    searchAndPlaceMarker(address, mapProposerArrivee, markerProposerArriveeRef, latitudeArriveeInput, longitudeArriveeInput, adresseArriveeInput, 'Adresse d\'Arrivée');
                } else {
                    console.warn("La carte d'arrivée n'est pas initialisée pour l'autocomplétion.");
                }
            }, DEBOUNCE_DELAY);
        });
        document.getElementById('searchArriveeAddressBtn').addEventListener('click', () => {
            clearTimeout(debounceTimerArrivee); // Exécute immédiatement
            searchAndPlaceMarker(adresseArriveeInput.value, mapProposerArrivee, markerProposerArriveeRef, latitudeArriveeInput, longitudeArriveeInput, adresseArriveeInput, 'Adresse d\'Arrivée');
        });
    } else {
        console.error("❌ Champ 'id_adresse_arrivee' introuvable. L'autocomplétion d'arrivée ne sera pas activée.");
    }


    // --- Fonctions d'affichage/nettoyage des erreurs de formulaire ---

    /**
     * Nettoie toutes les erreurs de validation affichées dans le formulaire.
     */
    function clearFormErrors() {
        // Supprime les classes is-invalid des inputs
        document.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        // Cache et vide tous les messages invalid-feedback
        document.querySelectorAll('.invalid-feedback').forEach(element => {
            element.innerHTML = '';
            element.style.display = 'none';
        });
        // Cache et vide l'alerte générale
        const globalErrorDiv = document.getElementById('form-global-errors');
        if (globalErrorDiv) {
            globalErrorDiv.innerHTML = '';
            globalErrorDiv.style.display = 'none';
        }
    }

    /**
     * Nettoie l'erreur spécifique pour un champ donné.
     * @param {string} fieldName - Le nom du champ (ex: 'date_depart', 'adresse_depart').
     */
    function clearFieldError(fieldName) {
        const inputElement = document.getElementById(`id_${fieldName}`);
        const errorDiv = document.getElementById(`id_${fieldName}_errors`);

        if (inputElement) {
            inputElement.classList.remove('is-invalid');
        }
        if (errorDiv) {
            errorDiv.innerHTML = '';
            errorDiv.style.display = 'none';
        }
    }


    /**
     * Affiche une erreur spécifique sous un champ de formulaire.
     * @param {string} fieldName - Le nom du champ (ex: 'adresse_depart', 'latitude_depart').
     * @param {string|string[]|object[]} messages - Un message d'erreur ou un tableau de messages.
     * Peut être [{'message': '...', 'code': '...'}] ou ['message']
     */
    function displayFieldError(fieldName, messages) {
        const inputElement = document.getElementById(`id_${fieldName}`);
        const errorDiv = document.getElementById(`id_${fieldName}_errors`); // Cible la div invalid-feedback spécifique

        if (inputElement) {
            inputElement.classList.add('is-invalid');
        }

        if (errorDiv) {
            let htmlMessages = '';
            // Assurez-vous que messages est un tableau et itérez
            const msgsArray = Array.isArray(messages) ? messages : [messages];
            msgsArray.forEach(msg => {
                if (typeof msg === 'object' && msg.message) { // Format Django (as_json)
                    htmlMessages += `<div>${msg.message}</div>`;
                } else { // Simple chaîne ou autre format
                    htmlMessages += `<div>${msg}</div>`;
                }
            });
            errorDiv.innerHTML = htmlMessages;
            errorDiv.style.display = 'block';
        } else {
            console.warn(`Impossible de trouver l'élément d'erreur pour le champ: id_${fieldName}_errors`);
            // Fallback si la div d'erreur spécifique n'existe pas.
            // Il pourrait être utile d'ajouter un message d'erreur général ici.
            const globalErrorDiv = document.getElementById('form-global-errors');
            if (globalErrorDiv) {
                globalErrorDiv.innerHTML += `<div>Erreur pour le champ ${fieldName}: ${JSON.stringify(messages)}</div>`;
                globalErrorDiv.style.display = 'block';
            }
        }
    }

    /**
     * Affiche toutes les erreurs de formulaire (champs spécifiques et erreurs générales).
     * @param {object} errors - Un objet où les clés sont les noms de champ et les valeurs sont des tableaux de messages d'erreur.
     */
    function displayFormErrors(errors) {
        clearFormErrors(); // Nettoie toutes les erreurs précédentes

        const globalErrorDiv = document.getElementById('form-global-errors');

        // Gérer les erreurs générales (non liées à un champ spécifique)
        if (errors.__all__) {
            if (globalErrorDiv) {
                globalErrorDiv.innerHTML = errors.__all__.map(msg => {
                    return `<div>${typeof msg === 'object' && msg.message ? msg.message : msg}</div>`;
                }).join('');
                globalErrorDiv.style.display = 'block';
            } else {
                console.warn("Conteneur global d'erreurs du formulaire (form-global-errors) non trouvé.");
            }
        }

        // Gérer les erreurs spécifiques aux champs
        for (const fieldName in errors) {
            if (errors.hasOwnProperty(fieldName) && fieldName !== '__all__') {
                const errorMessages = errors[fieldName];
                displayFieldError(fieldName, errorMessages);
            }
        }
    }

    // --- Soumission du formulaire de proposition de trajet ---
    const proposerTrajetForm = document.getElementById("proposerTrajetForm");
    if (proposerTrajetForm) {
        proposerTrajetForm.addEventListener("submit", function (event) {
            event.preventDefault();

            clearFormErrors(); // Toujours nettoyer au début de la soumission AJAX

            let isValidClientSide = true; // Pour la validation côté client

            // Validation des champs de coordonnées (côté client, avant l'envoi)
            if (!latitudeDepartInput.value || !longitudeDepartInput.value || isNaN(parseFloat(latitudeDepartInput.value)) || isNaN(parseFloat(longitudeDepartInput.value))) {
                displayFieldError('adresse_depart', "Veuillez sélectionner un point de départ sur la carte ou utiliser l'autocomplétion.");
                isValidClientSide = false;
            } else {
                clearFieldError('adresse_depart'); // Nettoie si valide
            }

            // Seulement valider l'arrivée si une adresse d'arrivée est saisie (comme votre validation Django)
            if (adresseArriveeInput.value.trim() !== '') {
                if (!latitudeArriveeInput.value || !longitudeArriveeInput.value || isNaN(parseFloat(latitudeArriveeInput.value)) || isNaN(parseFloat(longitudeArriveeInput.value))) {
                    displayFieldError('adresse_arrivee', "Veuillez sélectionner un point d'arrivée sur la carte ou utiliser l'autocomplétion.");
                    isValidClientSide = false;
                } else {
                    clearFieldError('adresse_arrivee'); // Nettoie si valide
                }
            } else {
                // Si l'adresse d'arrivée est vide, on s'assure que les champs cachés sont vides et qu'il n'y a pas d'erreur
                latitudeArriveeInput.value = '';
                longitudeArriveeInput.value = '';
                clearFieldError('adresse_arrivee');
            }


            if (!heureDepartPrevueInput || !heureDepartPrevueInput.value.trim()) {
                displayFieldError('heure_depart_prevue', 'L\'heure de départ est requise.');
                isValidClientSide = false;
            } else { clearFieldError('heure_depart_prevue'); }

            if (!heureArriveePrevueInput || adresseArriveeInput.value.trim() && !heureArriveePrevueInput.value.trim()) {
                displayFieldError('heure_arrivee_prevue', 'L\'heure d\'arrivée est requise si une adresse d\'arrivée est spécifiée.');
                isValidClientSide = false;
            } else { clearFieldError('heure_arrivee_prevue'); }
            
            if (!dateDepartInput || !dateDepartInput.value.trim()) {
                displayFieldError('date_depart', 'La date de départ est requise.');
                isValidClientSide = false;
            } else { clearFieldError('date_depart'); }

            if (!nbPlacesInput || !nbPlacesInput.value.trim() || isNaN(parseInt(nbPlacesInput.value)) || parseInt(nbPlacesInput.value) <= 0) {
                displayFieldError('nb_places_disponibles', 'Le nombre de places disponibles doit être un nombre entier positif.');
                isValidClientSide = false;
            } else { clearFieldError('nb_places_disponibles'); }

            if (!isValidClientSide) {
                console.warn("❌ Formulaire invalide côté client. Veuillez corriger les erreurs.");
                return;
            }

            console.log("📤 Tentative de soumission du formulaire de proposition de trajet...");

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
                // Si la réponse n'est pas OK (ex: 400 Bad Request)
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.log("❌ Erreurs JSON du serveur reçues:", errorData);
                        displayFormErrors(errorData.errors || {}); // S'attend à 'errors' dans le JSON
                        throw new Error('Server validation failed'); // Pour passer au bloc .catch
                    }).catch(jsonParseError => {
                        console.error("Erreur lors du parsing JSON de la réponse d'erreur:", jsonParseError);
                        // Tente de lire comme du texte pour voir ce que le serveur renvoie exactement
                        return response.text().then(text => {
                            console.error("Réponse brute du serveur en cas d'erreur HTTP:", text.substring(0, 500) + '...');
                            displayFormErrors({ '__all__': [{ message: `Erreur inattendue du serveur (${response.status}). Réponse non JSON ou invalide.` }] });
                            throw new Error('Non-JSON server response'); // Continue de propager l'erreur
                        });
                    });
                }
                return response.json(); // Traite la réponse réussie
            })
            .then(data => {
                console.log("✅ Données JSON reçues (succès ou échec logique):", data);

                clearFormErrors(); // Nettoie toutes les erreurs précédentes
                // Nettoyage des erreurs de coordonnées des cartes
                // (maintenant géré par clearFieldError qui cible les divs invalid-feedback)

                if (data.success) {
                    // Redirection après un court délai
                    // Assurez-vous que MES_TRAJETS_OFFERTS_URL est définie dans le template proposer_trajet.html
                    if (typeof MES_TRAJETS_OFFERTS_URL !== 'undefined') {
                        setTimeout(() => {
                            window.location.href = MES_TRAJETS_OFFERTS_URL;
                        }, 1500); // Redirection après 1.5 secondes (ajustez ce délai si vous voulez)
                    } else {
                        console.error("MES_TRAJETS_OFFERTS_URL n'est pas définie. Redirection automatique impossible.");
                        // Fallback: Afficher un message persistant et/ou proposer un lien manuel
                        displayGeneralSuccess("Votre trajet a été proposé avec succès ! (Redirection automatique non disponible)");
                        // Optionnel: document.getElementById('votre_lien_mes_trajets').style.display = 'block';
                    }
                } else {
                    
                    console.log("Le serveur a signalé un échec logique (success: false) avec statut OK.");
                    displayFormErrors(data.errors || { '__all__': ['Une erreur inattendue est survenue lors de la proposition du trajet (statut OK).'] });
                }
            })
            .catch(error => {
                console.error("🚨 Erreur finale lors de la soumission du formulaire:", error);
                
                if (!error.errors) { 
                    displayFormErrors({ '__all__': [{ message: "Une erreur réseau ou une erreur inattendue est survenue." }] });
                }
            });
        });
    } else {
        console.error("❌ Formulaire 'proposerTrajetForm' introuvable. Les fonctionnalités de proposition de trajet pourraient être limitées.");
    }
});