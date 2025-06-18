document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la page de proposition de trajet !");

    // Vérifiez si Leaflet est chargé
    if (typeof L === 'undefined') {
        console.error("❌ Leaflet n'est pas chargé ! Assurez-vous que leaflet.js est inclus dans base.html avant ce script.");
        return; // Arrêter l'exécution si Leaflet n'est pas là
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
        mapProposerDepart.invalidateSize(); // Important si la carte est initialement dans un conteneur caché
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
        mapProposerArrivee.invalidateSize(); // Important si la carte est initialement dans un conteneur caché
    } else {
        console.error("❌ Élément 'map_proposer_arrivee' introuvable dans le DOM. La carte d'arrivée ne sera pas initialisée.");
    }

    // --- Références aux champs de formulaire et divs d'erreur spécifiques à proposer_trajet.html ---
    const latitudeDepartInput = document.getElementById('id_latitude_depart');
    const longitudeDepartInput = document.getElementById('id_longitude_depart');
    const adresseDepartInput = document.getElementById('id_adresse_depart');
    const departCoordsErrorDiv = document.getElementById('depart-coords-error'); // Assurez-vous que cet ID existe dans votre HTML pour proposer un trajet

    const latitudeArriveeInput = document.getElementById('id_latitude_arrivee');
    const longitudeArriveeInput = document.getElementById('id_longitude_arrivee');
    const adresseArriveeInput = document.getElementById('id_adresse_arrivee');
    const arriveeCoordsErrorDiv = document.getElementById('arrivee-coords-error'); // Assurez-vous que cet ID existe dans votre HTML pour proposer un trajet

    const heureDepartPrevueInput = document.getElementById('id_heure_depart_prevue');
    const heureArriveePrevueInput = document.getElementById('id_heure_arrivee_prevue');
    const nbPlacesInput = document.getElementById('id_nb_places_disponibles');
    
    // --- Fonctions utilitaires pour les marqueurs et champs ---
    /**
     * Met à jour le marqueur sur la carte et remplit les champs de coordonnées cachés.
     * Cette fonction ne met plus à jour le champ d'adresse principal directement,
     * c'est le reverseGeocode qui le fera.
     * @param {L.Map} mapInstance - L'instance de la carte Leaflet.
     * @param {object} markerRef - L'objet de référence du marqueur ({ current: L.Marker | null }).
     * @param {number} lat - Latitude du point.
     * @param {number} lng - Longitude du point.
     * @param {string} popupContent - Contenu HTML du popup du marqueur.
     * @param {HTMLElement} latInput - L'élément input HTML pour la latitude.
     * @param {HTMLElement} lngInput - L'élément input HTML pour la longitude.
     * @param {HTMLElement} coordsErrorDiv - La div d'erreur pour les coordonnées.
     */
    function updateMarkerAndFields(mapInstance, markerRef, lat, lng, popupContent, latInput, lngInput, coordsErrorDiv) {
        console.log(`Mise à jour du marqueur et des champs : Lat=${lat}, Lng=${lng}`);

        if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current); // Supprime l'ancien marqueur
        }
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance); // Ajoute le nouveau marqueur
        markerRef.current.bindPopup(popupContent).openPopup();

        mapInstance.setView([lat, lng], 15); // Centre la carte et zoome

        latInput.value = lat;
        lngInput.value = lng;

        // Cacher le message d'erreur si les coordonnées sont maintenant valides
        if (coordsErrorDiv) coordsErrorDiv.style.display = 'none';

        console.log(`✅ Coordonnées mises à jour : Lat: ${lat}, Lng: ${lng}`);
    }

    // --- Fonction de géocodage inverse Nominatim ---
    // Cette fonction retourne une Promise, ce qui la rend compatible avec async/await
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
                        resolve(data.display_name); // Résout la promesse avec l'adresse formatée
                    } else {
                        reject(`Aucune adresse trouvée pour les coordonnées Lat: ${lat}, Lng: ${lon}.`);
                    }
                })
                .catch(error => {
                    reject(`Erreur lors du géocodage inverse: ${error.message}`);
                });
        });
    }

    // --- Promisify la fonction de géocodage direct Nominatim (déjà fait, mais je la remets pour contexte) ---
    function directGeocodeNominatim(address) {
        return new Promise((resolve, reject) => {
            const searchQuery = encodeURIComponent(address + ", Bénin"); // Spécifier le pays pour de meilleurs résultats
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
                        resolve(null); // Aucune adresse trouvée
                    }
                })
                .catch(error => {
                    console.error("Erreur lors du géocodage direct:", error);
                    reject(error);
                });
        });
    }

    /**
     * Recherche une adresse et met à jour la carte et les champs.
     * Cette fonction est utilisée pour la recherche D'UN TEXTE (autocomplétion ou bouton rechercher).
     * Elle met à jour le marqueur et l'adresse.
     * @param {string} address - L'adresse à rechercher.
     * @param {L.Map} mapInstance - L'instance de la carte Leaflet.
     * @param {object} markerRef - L'objet de référence du marqueur.
     * @param {HTMLElement} latInput - L'élément input HTML pour la latitude.
     * @param {HTMLElement} lngInput - L'élément input HTML pour la longitude.
     * @param {HTMLElement} addressInput - L'élément input HTML pour l'adresse visible.
     * @param {HTMLElement} coordsErrorDiv - La div d'erreur pour les coordonnées.
     * @param {string} popupTitle - Le titre du popup du marqueur (ex: "Point de Départ").
     */
    async function searchAndPlaceMarker(address, mapInstance, markerRef, latInput, lngInput, addressInput, coordsErrorDiv, popupTitle) {
        if (!address.trim()) {
            // Si l'adresse est vide, vider les champs de coordonnées et supprimer le marqueur
            if (markerRef.current) {
                mapInstance.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            latInput.value = '';
            lngInput.value = '';
            addressInput.value = ''; // Vider aussi le champ adresse
            if (coordsErrorDiv) coordsErrorDiv.style.display = 'none'; // Cacher l'erreur si le champ est vide
            console.log(`Adresse vide. Marqueur et coordonnées pour ${popupTitle} réinitialisés.`);
            return;
        }

        try {
            const result = await directGeocodeNominatim(address);
            if (result) {
                const lat = result.lat;
                const lon = result.lon;
                const popupContent = `<b>${popupTitle}</b><br>${result.display_name}<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lon.toFixed(6)}`;
                // updateMarkerAndFields prend un 'addressInput' maintenant, on le passe ici
                updateMarkerAndFields(mapInstance, markerRef, lat, lon, popupContent, latInput, lngInput, coordsErrorDiv);
                addressInput.value = result.display_name; // Mettre à jour l'adresse visible ici
                clearCoordsError(coordsErrorDiv); // Assurez-vous que cette fonction existe ou que c'est géré

                console.log(`✅ Adresse ${popupTitle} trouvée et carte mise à jour: ${result.display_name}`);
            } else {
                if (markerRef.current) {
                    mapInstance.removeLayer(markerRef.current);
                    markerRef.current = null;
                }
                latInput.value = '';
                lngInput.value = '';
                addressInput.value = ''; // Vider l'adresse si aucun résultat
                if (coordsErrorDiv) {
                    coordsErrorDiv.textContent = `Aucun résultat trouvé pour "${address}". Veuillez être plus précis ou cliquer sur la carte.`;
                    coordsErrorDiv.style.display = 'block';
                }
                console.warn(`Aucune adresse trouvée pour: "${address}"`);
            }
        } catch (error) {
            console.error("Erreur lors de la recherche et du placement du marqueur:", error);
            if (coordsErrorDiv) {
                coordsErrorDiv.textContent = "Erreur de connexion pour la recherche d'adresse. Veuillez réessayer.";
                coordsErrorDiv.style.display = 'block';
            }
        }
    }


    // --- Écouteurs d'événements pour les clics sur les cartes ---
    if (mapProposerDepart) {
        mapProposerDepart.on('click', async function (e) { // Rendre la fonction async
            console.log("Clic sur la carte de départ (proposer) à :", e.latlng);
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            updateMarkerAndFields(mapProposerDepart, markerProposerDepartRef, lat, lng,
                                  `<b>Point de Départ</b>}`,
                                  latitudeDepartInput, longitudeDepartInput, departCoordsErrorDiv);
            
            // 2. Effectuer le géocodage inverse et mettre à jour le champ d'adresse visible
            try {
                const address = await reverseGeocodeNominatim(lat, lng);
                adresseDepartInput.value = address; // Remplir le champ d'adresse visible
                console.log(`✅ Adresse de départ trouvée via clic carte: ${address}`);
                // Assurez-vous d'effacer les erreurs de coordonnées après un succès
                if (departCoordsErrorDiv) departCoordsErrorDiv.style.display = 'none';
            } catch (error) {
                console.error("Erreur de géocodage inverse pour départ (clic carte):", error);
                if (departCoordsErrorDiv) {
                    departCoordsErrorDiv.textContent = `Impossible de trouver l'adresse pour ce point. ${error}`;
                    departCoordsErrorDiv.style.display = 'block';
                }
                adresseDepartInput.value = ''; // Vider le champ d'adresse si erreur
            }
        });
    }

    if (mapProposerArrivee) {
        mapProposerArrivee.on('click', async function (e) { // Rendre la fonction async
            console.log("Clic sur la carte d'arrivée (proposer) à :", e.latlng);
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            // 1. Mettre à jour le marqueur et les champs de coordonnées cachés immédiatement
            updateMarkerAndFields(mapProposerArrivee, markerProposerArriveeRef, lat, lng,
                                  `<b>Point d'Arrivée</b>}`,
                                  latitudeArriveeInput, longitudeArriveeInput, arriveeCoordsErrorDiv);

            // 2. Effectuer le géocodage inverse et mettre à jour le champ d'adresse visible
            try {
                const address = await reverseGeocodeNominatim(lat, lng);
                adresseArriveeInput.value = address; // Remplir le champ d'adresse visible
                console.log(`✅ Adresse d'arrivée trouvée via clic carte: ${address}`);
                // Assurez-vous d'effacer les erreurs de coordonnées après un succès
                if (arriveeCoordsErrorDiv) arriveeCoordsErrorDiv.style.display = 'none';
            } catch (error) {
                console.error("Erreur de géocodage inverse pour arrivée (clic carte):", error);
                if (arriveeCoordsErrorDiv) {
                    arriveeCoordsErrorDiv.textContent = `Impossible de trouver l'adresse pour ce point. ${error}`;
                    arriveeCoordsErrorDiv.style.display = 'block';
                }
                adresseArriveeInput.value = ''; // Vider le champ d'adresse si erreur
            }
        });
    }

    // --- Implémentation du Debounce pour l'autocomplétion ---
    let debounceTimerDepart;
    let debounceTimerArrivee;
    const DEBOUNCE_DELAY = 1000; // milliseconds (réduit pour une meilleure réactivité)

    // Champ de texte pour l'adresse de départ
    if (adresseDepartInput) {
        adresseDepartInput.addEventListener("input", function() {
            clearTimeout(debounceTimerDepart);
            const address = this.value;
            debounceTimerDepart = setTimeout(() => {
                if (mapProposerDepart) {
                    searchAndPlaceMarker(address, mapProposerDepart, markerProposerDepartRef, latitudeDepartInput, longitudeDepartInput, adresseDepartInput, departCoordsErrorDiv, 'Adresse de Départ');
                } else {
                    console.warn("La carte de départ n'est pas initialisée pour l'autocomplétion.");
                }
            }, DEBOUNCE_DELAY);
        });
    } else {
        console.error("❌ Champ 'id_adresse_depart' introuvable. L'autocomplétion de départ ne sera pas activée.");
    }

    // Champ de texte pour l'adresse d'arrivée
    if (adresseArriveeInput) {
        adresseArriveeInput.addEventListener("input", function() {
            clearTimeout(debounceTimerArrivee);
            const address = this.value;
            debounceTimerArrivee = setTimeout(() => {
                if (mapProposerArrivee) {
                    searchAndPlaceMarker(address, mapProposerArrivee, markerProposerArriveeRef, latitudeArriveeInput, longitudeArriveeInput, adresseArriveeInput, arriveeCoordsErrorDiv, 'Adresse d\'Arrivée');
                } else {
                    console.warn("La carte d'arrivée n'est pas initialisée pour l'autocomplétion.");
                }
            }, DEBOUNCE_DELAY);
        });
    } else {
        console.error("❌ Champ 'id_adresse_arrivee' introuvable. L'autocomplétion d'arrivée ne sera pas activée.");
    }


    // --- Soumission du formulaire de proposition de trajet ---
    const proposerTrajetForm = document.getElementById("proposerTrajetForm"); // Assurez-vous que l'ID du formulaire est correct
    if (proposerTrajetForm) {
        proposerTrajetForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Empêche la soumission par défaut du formulaire

            let isValid = true;

            // Réinitialisation des erreurs des coordonnées avant la validation
            if (departCoordsErrorDiv) departCoordsErrorDiv.style.display = 'none';
            if (arriveeCoordsErrorDiv) arriveeCoordsErrorDiv.style.display = 'none';
            clearFormErrors(); // Nettoie toutes les autres erreurs du formulaire

            // Validation des coordonnées de départ
            if (!latitudeDepartInput.value || !longitudeDepartInput.value || isNaN(parseFloat(latitudeDepartInput.value)) || isNaN(parseFloat(longitudeDepartInput.value))) {
                if (departCoordsErrorDiv) {
                    departCoordsErrorDiv.textContent = "Veuillez sélectionner un point de départ sur la carte ou utiliser l'autocomplétion.";
                    departCoordsErrorDiv.style.display = 'block';
                }
                isValid = false;
            }

            // Validation des coordonnées d'arrivée
            if (!latitudeArriveeInput.value || !longitudeArriveeInput.value || isNaN(parseFloat(latitudeArriveeInput.value)) || isNaN(parseFloat(longitudeArriveeInput.value))) {
                if (arriveeCoordsErrorDiv) {
                    arriveeCoordsErrorDiv.textContent = "Veuillez sélectionner un point d'arrivée sur la carte ou utiliser l'autocomplétion.";
                    arriveeCoordsErrorDiv.style.display = 'block';
                }
                isValid = false;
            }

            // Validation des champs d'heure (similaire à la date, mais pour l'heure)
            // Assurez-vous que les champs heure_depart_prevue et heure_arrivee_prevue sont remplis
            if (!heureDepartPrevueInput || !heureDepartPrevueInput.value.trim()) {
                displayFieldError('heure_depart_prevue', 'L\'heure de départ est requise.');
                isValid = false;
            }
            if (!heureArriveePrevueInput || !heureArriveePrevueInput.value.trim()) {
                displayFieldError('heure_arrivee_prevue', 'L\'heure d\'arrivée est requise.');
                isValid = false;
            }

            // Validation du nombre de places disponibles
            if (!nbPlacesInput || !nbPlacesInput.value.trim() || isNaN(parseInt(nbPlacesInput.value)) || parseInt(nbPlacesInput.value) <= 0) {
                 displayFieldError('nb_places_disponibles', 'Le nombre de places disponibles doit être un nombre entier positif.');
                 isValid = false;
            }

          

            if (!isValid) {
                console.warn("❌ Formulaire invalide. Veuillez corriger les erreurs.");
                // Pas besoin d'alert() si les erreurs sont affichées à côté des champs.
                return;
            }

            console.log("📤 Tentative de soumission du formulaire de proposition de trajet...");

            const formData = new FormData(this);

            fetch(this.action, {
                method: "POST",
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest', // Indique au serveur que c'est une requête AJAX
                }
            })
            .then(response => {
                console.log("📡 Réponse reçue, status:", response.status);

                if (!response.ok) {
                    return response.text().then(text => {
                        try {
                            const errorData = JSON.parse(text);
                            // Le serveur peut renvoyer un objet errors ou une chaîne JSON parsable en errors
                            return Promise.reject({ status: response.status, errors: errorData.errors || errorData });
                        } catch (e) {
                            console.error("Réponse du serveur non-JSON en cas d'erreur HTTP:", text.substring(0, 500));
                            return Promise.reject({ status: response.status, errors: { '__all__': [`Erreur serveur (${response.status}): Réponse inattendue ou non JSON.`] } });
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ Données JSON reçues:", data);

                clearFormErrors(); // Nettoie toutes les erreurs précédentes
                if (departCoordsErrorDiv) departCoordsErrorDiv.style.display = 'none';
                if (arriveeCoordsErrorDiv) arriveeCoordsErrorDiv.style.display = 'none';


                if (data.success) {
                    alert("✅ Trajet proposé avec succès !");
                    // Optionnel: rediriger l'utilisateur ou mettre à jour l'interface
                    window.location.href = data.redirect_url || '/mes-trajets/'; // Redirige vers une page de succès ou mes trajets
                } else {
                    // Afficher les erreurs renvoyées par le serveur
                    displayFormErrors(data.errors || { '__all__': ['Une erreur inattendue est survenue lors de la proposition du trajet.'] });
                }
            })
            .catch(error => {
                console.error("❌ Erreur lors de la proposition du trajet:", error);
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
                // Si aucune erreur de champ spécifique n'est affichée, afficher une alerte générale
                if (!error.errors || Object.keys(error.errors).length === 0 || (error.errors.__all__ && error.errors.__all__.length > 0)) {
                    alert("❌ " + errorMessage);
                }
            });
        });
    } else {
        console.error("❌ Formulaire 'proposerTrajetForm' introuvable. Les fonctionnalités de proposition de trajet pourraient être limitées.");
    }

    // --- Fonctions d'affichage/nettoyage des erreurs de formulaire (adaptées) ---
    /**
     * Affiche les erreurs sous les champs de formulaire ou comme erreur générale.
     * @param {object} errors - Un objet où les clés sont les noms de champ et les valeurs sont des tableaux de messages d'erreur.
     */
    function displayFormErrors(errors) {
        const formElement = document.getElementById("proposerTrajetForm"); // Référence au formulaire de proposition
        if (!formElement) {
            console.error("❌ Formulaire de proposition de trajet introuvable pour afficher les erreurs.");
            return;
        }

        clearFormErrors(); // Nettoie toutes les erreurs précédentes

        // Gérer les erreurs générales (non liées à un champ spécifique)
        if (errors.__all__) {
            const nonFieldErrorsDiv = formElement.querySelector('.alert-danger'); // Assurez-vous d'avoir une div avec la classe .alert-danger pour les erreurs générales
            if (nonFieldErrorsDiv) {
                nonFieldErrorsDiv.innerHTML = '';
                errors.__all__.forEach(msg => {
                    const p = document.createElement('p');
                    p.textContent = msg;
                    nonFieldErrorsDiv.appendChild(p);
                });
                nonFieldErrorsDiv.style.display = 'block';
            } else {
                console.warn("Div pour les erreurs générales non trouvée. Erreurs:", errors.__all__);
                alert("Erreur générale du formulaire: " + errors.__all__.join(', '));
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

    /**
     * Affiche une erreur spécifique sous un champ de formulaire.
     * @param {string} fieldName - Le nom du champ (ex: 'adresse_depart').
     * @param {string|string[]} messages - Un message d'erreur ou un tableau de messages.
     */
    function displayFieldError(fieldName, messages) {
        const field = document.getElementById('id_' + fieldName);
        if (field) {
            let errorDiv = field.nextElementSibling;
            // Crée la div d'erreur si elle n'existe pas ou si ce n'est pas le bon type
            if (!errorDiv || !errorDiv.classList.contains('text-danger')) {
                errorDiv = document.createElement('div');
                errorDiv.classList.add('text-danger', 'small', 'mt-1');
                field.parentNode.insertBefore(errorDiv, field.nextElementSibling);
            }
            // Assurez-vous que messages est un tableau
            const msgsArray = Array.isArray(messages) ? messages : [messages];
            errorDiv.innerHTML = msgsArray.map(msg => `<div>${msg}</div>`).join('');
            errorDiv.style.display = 'block';
        } else {
            console.warn(`Champ de formulaire "${fieldName}" (id_` + fieldName + `) introuvable pour afficher les erreurs.`);
        }
    }


    /**
     * Cache toutes les erreurs de formulaire affichées.
     */
    function clearFormErrors() {
        const formElement = document.getElementById("proposerTrajetForm"); // Référence au formulaire de proposition
        if (!formElement) return;

        // Cacher la div des erreurs générales
        const generalErrorsDiv = formElement.querySelector('.alert-danger');
        if (generalErrorsDiv) {
            generalErrorsDiv.style.display = 'none';
            generalErrorsDiv.innerHTML = '';
        }

        // Cacher les erreurs sous les champs individuels
        formElement.querySelectorAll('.text-danger.small.mt-1').forEach(div => {
            // Ne pas toucher aux divs d'erreur de coordonnées si elles ont un contenu persistant,
            // mais étant donné qu'elles sont gérées par updateMarkerAndFields, on peut les réinitialiser ici aussi.
            // Cependant, dans ce setup, elles sont réinitialisées spécifiquement au début du submit.
            // Donc, cette boucle peut se concentrer sur les erreurs génériques de champs.
            div.innerHTML = '';
            div.style.display = 'none'; // Assurez-vous qu'elles sont masquées
        });
        // Pour les erreurs de coordonnées spécifiques, elles sont masquées en début de `submit` et par `updateMarkerAndFields`.
        if (departCoordsErrorDiv) departCoordsErrorDiv.style.display = 'none';
        if (arriveeCoordsErrorDiv) arriveeCoordsErrorDiv.style.display = 'none';
    }


    // This function can be used to clear errors for coordinate input divs specifically
    function clearCoordsError(errorDiv) {
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    }

    // This function can be used to display errors for coordinate input divs specifically
    function displayCoordsError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }


    // Gestion de l'affichage initial des cartes et des champs si des valeurs existent déjà (ex: après une erreur de validation Django)
    async function initializeMapAndMarkersFromForm() {
        // Départ
        const initialDepartLat = parseFloat(latitudeDepartInput.value);
        const initialDepartLng = parseFloat(longitudeDepartInput.value);
        const initialDepartAddr = adresseDepartInput.value;

        if (!isNaN(initialDepartLat) && !isNaN(initialDepartLng) && mapProposerDepart) {
            // Place le marqueur initialement
            updateMarkerAndFields(mapProposerDepart, markerProposerDepartRef, initialDepartLat, initialDepartLng,
                                 `<b>Point de Départ</b><br>Lat: ${initialDepartLat.toFixed(6)}<br>Lng: ${initialDepartLng.toFixed(6)}`,
                                 latitudeDepartInput, longitudeDepartInput, departCoordsErrorDiv);
            
            // Si l'adresse n'est pas déjà remplie ou est juste les coords, tenter un reverse geocoding
            if (!initialDepartAddr || initialDepartAddr.includes('Lat:') || initialDepartAddr.includes('Lng:')) {
                try {
                    const address = await reverseGeocodeNominatim(initialDepartLat, initialDepartLng);
                    adresseDepartInput.value = address;
                    console.log(`✅ Adresse de départ initialisée via reverse geocoding: ${address}`);
                } catch (error) {
                    console.warn(`Impossible de géocoder l'adresse de départ initiale: ${error}`);
                    // Laissez le champ vide ou avec les coordonnées si le reverse geocoding échoue
                }
            } else {
                adresseDepartInput.value = initialDepartAddr; // Utiliser l'adresse existante si valide
            }
            mapProposerDepart.setView([initialDepartLat, initialDepartLng], 15);
        }

        // Arrivée
        const initialArriveeLat = parseFloat(latitudeArriveeInput.value);
        const initialArriveeLng = parseFloat(longitudeArriveeInput.value);
        const initialArriveeAddr = adresseArriveeInput.value;

        if (!isNaN(initialArriveeLat) && !isNaN(initialArriveeLng) && mapProposerArrivee) {
            // Place le marqueur initialement
            updateMarkerAndFields(mapProposerArrivee, markerProposerArriveeRef, initialArriveeLat, initialArriveeLng,
                                 `<b>Point d'Arrivée</b><br>Lat: ${initialArriveeLat.toFixed(6)}<br>Lng: ${initialArriveeLng.toFixed(6)}`,
                                 latitudeArriveeInput, longitudeArriveeInput, arriveeCoordsErrorDiv);

            // Si l'adresse n'est pas déjà remplie ou est juste les coords, tenter un reverse geocoding
            if (!initialArriveeAddr || initialArriveeAddr.includes('Lat:') || initialArriveeAddr.includes('Lng:')) {
                try {
                    const address = await reverseGeocodeNominatim(initialArriveeLat, initialArriveeLng);
                    adresseArriveeInput.value = address;
                    console.log(`✅ Adresse d'arrivée initialisée via reverse geocoding: ${address}`);
                } catch (error) {
                    console.warn(`Impossible de géocoder l'adresse d'arrivée initiale: ${error}`);
                    // Laissez le champ vide ou avec les coordonnées si le reverse geocoding échoue
                }
            } else {
                adresseArriveeInput.value = initialArriveeAddr; // Utiliser l'adresse existante si valide
            }
            mapProposerArrivee.setView([initialArriveeLat, initialArriveeLng], 15);
        }
    }

    // Appeler cette fonction une fois que le DOM est chargé pour gérer les valeurs initiales (par exemple, si le formulaire est rechargé avec des erreurs)
    initializeMapAndMarkersFromForm();

    // Rendre les maps visibles et invalider la taille si elles étaient initialement cachées
    // Cela peut être utile si les cartes sont dans des onglets ou des modales
    if (mapProposerDepart) {
        mapProposerDepart.invalidateSize();
    }
    if (mapProposerArrivee) {
        mapProposerArrivee.invalidateSize();
    }
});