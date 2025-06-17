document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé pour la page de proposition de trajet !");

    // Vérifiez si Leaflet est chargé
    if (typeof L === 'undefined') {
        console.error("❌ Leaflet n'est pas chargé ! Assurez-vous que leaflet.js est inclus dans base.html avant ce script.");
        return; // Arrêter l'exécution si Leaflet n'est pas là
    }

    var defaultCoords = [6.45, 2.35]; // Coordonnées pour Abomey-Calavi, Bénin (gardé comme référence)
    var defaultZoom = 13;

    // --- Initialisation de la carte de départ (pour la proposition de trajet) ---
    const mapProposerDepartElement = document.getElementById('map_proposer_depart');
    let mapProposerDepart;
    let markerProposerDepartRef = { current: null }; // Utiliser un objet de référence pour le marqueur

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
    let markerProposerArriveeRef = { current: null }; // Utiliser un objet de référence pour le marqueur

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
    const departCoordsErrorDiv = document.getElementById('depart-coords-error');

    const latitudeArriveeInput = document.getElementById('id_latitude_arrivee');
    const longitudeArriveeInput = document.getElementById('id_longitude_arrivee');
    const adresseArriveeInput = document.getElementById('id_adresse_arrivee');
    const arriveeCoordsErrorDiv = document.getElementById('arrivee-coords-error'); 

    // Champs de date/heure uniques pour 'prevue'
    const heureDepartPrevueInput = document.getElementById('id_heure_depart_prevue');
    const heureArriveePrevueInput = document.getElementById('id_heure_arrivee_prevue');
    
    const nbPlacesInput = document.getElementById('id_nb_places_disponibles'); 
    // const prixInput = document.getElementById('id_prix_par_passager'); // Supprimé car le prix n'est plus requis

    // --- Fonctions utilitaires pour les marqueurs et champs ---
    /**
     * Met à jour le marqueur sur la carte et remplit les champs de coordonnées cachés.
     * @param {L.Map} mapInstance - L'instance de la carte Leaflet.
     * @param {object} markerRef - L'objet de référence du marqueur ({ current: L.Marker | null }).
     * @param {number} lat - Latitude du point.
     * @param {number} lng - Longitude du point.
     * @param {string} popupContent - Contenu HTML du popup du marqueur.
     * @param {HTMLElement} latInput - L'élément input HTML pour la latitude.
     * @param {HTMLElement} lngInput - L'élément input HTML pour la longitude.
     * @param {HTMLElement} [addrInput] - L'élément input HTML pour l'adresse visible (optionnel, utilisé pour le géocodage direct).
     * @param {HTMLElement} coordsErrorDiv - La div d'erreur pour les coordonnées.
     */
    function updateMarkerAndFields(mapInstance, markerRef, lat, lng, popupContent, latInput, lngInput, addrInput = null, coordsErrorDiv) {
        console.log(`Mise à jour du marqueur et des champs : Lat=${lat}, Lng=${lng}`);

        if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current); // Supprime l'ancien marqueur
        }
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance); // Ajoute le nouveau marqueur
        markerRef.current.bindPopup(popupContent).openPopup();

        mapInstance.setView([lat, lng], 15); // Centre la carte et zoome

        latInput.value = lat;
        lngInput.value = lng;
        
        if (addrInput && popupContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = popupContent;
            
            const addressText = tempDiv.textContent
                                    .replace(/(<b>Point de Départ<\/b>|<br>Lat:.*|<br>Lng:.*|<b>Point d'Arrivée<\/b>|<b>Adresse de départ<\/b>|<b>Adresse d'arrivée<\/b>)/g, '') // Supprime les en-têtes et coordonnées brutes
                                    .trim();
            addrInput.value = addressText;
        }
        
        // Cacher le message d'erreur si les coordonnées sont maintenant valides
        if (coordsErrorDiv) coordsErrorDiv.style.display = 'none';

        console.log(`✅ Coordonnées mises à jour : Lat: ${lat}, Lng: ${lng}`);
    }

    // --- Promisify la fonction de géocodage direct Nominatim ---
    function directGeocodeNominatim(address) {
        return new Promise((resolve, reject) => {
            // Ajouter ", Bénin" pour affiner la recherche par défaut, ajustable
            const searchQuery = encodeURIComponent(address + ", Bénin");
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&addressdetails=1`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.length > 0) {
                        resolve(data[0]); // Renvoie le premier résultat
                    } else {
                        reject(`Aucun résultat de géocodage trouvé pour "${address}".`);
                    }
                })
                .catch(error => {
                    reject(`Erreur lors de la recherche d'adresse: ${error.message}`);
                });
        });
    }

    // --- Écouteurs d'événements pour les clics sur les cartes (SANS GÉOCODAGE INVERSÉ) ---
    if (mapProposerDepart) {
        mapProposerDepart.on('click', function (e) {
            console.log("Clic sur la carte de départ (proposer) à :", e.latlng);
            // Place le marqueur et met à jour les champs cachés SANS tenter d'obtenir une adresse.
            // Le popup affichera simplement "Point de Départ".
            updateMarkerAndFields(mapProposerDepart, markerProposerDepartRef, e.latlng.lat, e.latlng.lng, 
                                  `<b>Point de Départ</b>`, latitudeDepartInput, 
                                  longitudeDepartInput, null, departCoordsErrorDiv); // addrInput est null
        });
    }

    if (mapProposerArrivee) {
        mapProposerArrivee.on('click', function (e) {
            console.log("Clic sur la carte d'arrivée (proposer) à :", e.latlng);
            // Place le marqueur et met à jour les champs cachés SANS tenter d'obtenir une adresse.
            // Le popup affichera simplement "Point d'Arrivée".
            updateMarkerAndFields(mapProposerArrivee, markerProposerArriveeRef, e.latlng.lat, e.latlng.lng, 
                                  `<b>Point d'Arrivée</b>`, latitudeArriveeInput, 
                                  longitudeArriveeInput, null, arriveeCoordsErrorDiv); // addrInput est null
        });
    }

    // --- Écouteurs d'événements pour les boutons "Rechercher" d'adresse (AVEC GÉOCODAGE DIRECT) ---
    const searchDepartAddressBtn = document.getElementById("searchDepartAddressBtn");
    if (searchDepartAddressBtn && adresseDepartInput) {
        searchDepartAddressBtn.addEventListener("click", async function() {
            console.log("Bouton Rechercher Départ (proposer) cliqué.");
            const address = adresseDepartInput.value.trim();
            if (address) {
                try {
                    const result = await directGeocodeNominatim(address);
                    updateMarkerAndFields(mapProposerDepart, markerProposerDepartRef, parseFloat(result.lat), parseFloat(result.lon),
                                          `<b>Adresse de départ</b><br>${result.display_name}`, latitudeDepartInput, 
                                          longitudeDepartInput, adresseDepartInput, departCoordsErrorDiv); // adresseDepartInput est fourni
                } catch (error) {
                    console.error("Erreur de géocodage direct pour départ (proposer):", error);
                    displayCoordsError(departCoordsErrorDiv, `Adresse de départ "${address}" introuvable. Veuillez vérifier ou sélectionner un point approximatif sur la carte.`);
                    // Effacer les coordonnées si la recherche échoue
                    latitudeDepartInput.value = '';
                    longitudeDepartInput.value = '';
                    if (markerProposerDepartRef.current) {
                        mapProposerDepart.removeLayer(markerProposerDepartRef.current);
                        markerProposerDepartRef.current = null;
                    }
                }
            } else {
                displayCoordsError(departCoordsErrorDiv, "Veuillez entrer une adresse de départ à rechercher.");
            }
        });
    } else {
        console.error("❌ Bouton 'searchDepartAddressBtn' ou champ 'adresseDepartInput' introuvable.");
    }
    
    const searchArriveeAddressBtn = document.getElementById("searchArriveeAddressBtn");
    if (searchArriveeAddressBtn && adresseArriveeInput) {
        searchArriveeAddressBtn.addEventListener("click", async function() {
            console.log("Bouton Rechercher Arrivée (proposer) cliqué.");
            const address = adresseArriveeInput.value.trim();
            if (address) {
                try {
                    const result = await directGeocodeNominatim(address);
                    updateMarkerAndFields(mapProposerArrivee, markerProposerArriveeRef, parseFloat(result.lat), parseFloat(result.lon),
                                          `<b>Adresse d'arrivée</b><br>${result.display_name}`, latitudeArriveeInput, 
                                          longitudeArriveeInput, adresseArriveeInput, arriveeCoordsErrorDiv); 
                } catch (error) {
                    console.error("Erreur de géocodage direct pour arrivée (proposer):", error);
                    displayCoordsError(arriveeCoordsErrorDiv, `Adresse d'arrivée "${address}" introuvable. Veuillez vérifier ou sélectionner un point approximatif sur la carte.`);
                    
                    latitudeArriveeInput.value = '';
                    longitudeArriveeInput.value = '';
                    if (markerProposerArriveeRef.current) {
                        mapProposerArrivee.removeLayer(markerProposerArriveeRef.current);
                        markerProposerArriveeRef.current = null;
                    }
                }
            } else {
                displayCoordsError(arriveeCoordsErrorDiv, "Veuillez entrer une adresse d'arrivée à rechercher.");
            }
        });
    } else {
        console.error("❌ Bouton 'searchArriveeAddressBtn' ou champ 'adresseArriveeInput' introuvable.");
    }

    if (adresseDepartInput) {
        adresseDepartInput.addEventListener('change', function() {
            searchDepartAddressBtn.click();
        });
    }
    if (adresseArriveeInput) {
        adresseArriveeInput.addEventListener('change', function() {
            // Seulement si l'adresse est saisie, sinon effacer marqueur/coordonnées
            if (adresseArriveeInput.value.trim()) {
                searchArriveeAddressBtn.click(); // Simule le clic sur le bouton de recherche
            } else {
                // Si l'adresse est vidée, on efface le marqueur et les coordonnées associées
                if (markerProposerArriveeRef.current) {
                    mapProposerArrivee.removeLayer(markerProposerArriveeRef.current);
                    markerProposerArriveeRef.current = null;
                }
                latitudeArriveeInput.value = '';
                longitudeArriveeInput.value = '';
                clearCoordsError(arriveeCoordsErrorDiv);
            }
        });
    }

    // --- Gestion de la soumission du formulaire de proposition de trajet (AJAX) ---
    const proposerTrajetForm = document.getElementById("proposerTrajetForm"); // Assurez-vous que l'ID de votre formulaire est bien "proposerTrajetForm"
    if (proposerTrajetForm) {
        proposerTrajetForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Empêcher la soumission normale du formulaire

            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Envoi en cours...';
            }

            let isValid = true;
            clearFormErrors(); // Effacer les erreurs précédentes

            // --- Validation des champs côté client (ajoutez ici toutes les validations nécessaires) ---
            
            // Validation des coordonnées de départ (obligatoire)
            if (!latitudeDepartInput.value || !longitudeDepartInput.value || isNaN(parseFloat(latitudeDepartInput.value)) || isNaN(parseFloat(longitudeDepartInput.value))) {
                displayCoordsError(departCoordsErrorDiv, "Veuillez sélectionner un point de départ sur la carte ou rechercher une adresse.");
                isValid = false;
            } else {
                clearCoordsError(departCoordsErrorDiv);
            }

            // Validation des coordonnées d'arrivée (obligatoire)
            if (!latitudeArriveeInput.value || !longitudeArriveeInput.value || isNaN(parseFloat(latitudeArriveeInput.value)) || isNaN(parseFloat(longitudeArriveeInput.value))) {
                displayCoordsError(arriveeCoordsErrorDiv, "Veuillez sélectionner un point d'arrivée sur la carte ou rechercher une adresse.");
                isValid = false;
            } else {
                clearCoordsError(arriveeCoordsErrorDiv);
            }

            // Validation de la date et l'heure de départ
            if (!heureDepartPrevueInput || !heureDepartPrevueInput.value.trim()) {
                displaySpecificFieldError(heureDepartPrevueInput, "La date et l'heure de départ sont obligatoires.");
                isValid = false;
            } else {
                const departDateTime = new Date(heureDepartPrevueInput.value);
                if (isNaN(departDateTime.getTime())) {
                    displaySpecificFieldError(heureDepartPrevueInput, "Format de date et heure de départ invalide.");
                    isValid = false;
                } else if (departDateTime < new Date()) { // Vérifie si la date est dans le passé
                    displaySpecificFieldError(heureDepartPrevueInput, "La date et l'heure de départ ne peuvent pas être dans le passé.");
                    isValid = false;
                } else {
                    clearSpecificFieldError(heureDepartPrevueInput);
                }
            }
            
            // Validation de la date et l'heure d'arrivée
            if (!heureArriveePrevueInput || !heureArriveePrevueInput.value.trim()) {
                displaySpecificFieldError(heureArriveePrevueInput, "La date et l'heure d'arrivée sont obligatoires.");
                isValid = false;
            } else {
                const departDateTime = new Date(heureDepartPrevueInput.value); // Récupère à nouveau pour comparaison
                const arriveeDateTime = new Date(heureArriveePrevueInput.value);
                if (isNaN(arriveeDateTime.getTime())) {
                    displaySpecificFieldError(heureArriveePrevueInput, "Format de date et heure d'arrivée invalide.");
                    isValid = false;
                } else if (arriveeDateTime <= departDateTime) { // L'arrivée doit être strictement après le départ
                    displaySpecificFieldError(heureArriveePrevueInput, "L'heure d'arrivée doit être après l'heure de départ.");
                    isValid = false;
                } else {
                    clearSpecificFieldError(heureArriveePrevueInput);
                }
            }

            // Validation du nombre de places
            const nbPlacesValue = parseInt(nbPlacesInput.value);
            if (isNaN(nbPlacesValue) || nbPlacesValue <= 0) {
                displaySpecificFieldError(nbPlacesInput, "Le nombre de places doit être un nombre entier positif.");
                isValid = false;
            } else {
                clearSpecificFieldError(nbPlacesInput);
            }

            // --- NOTE: La validation du prix a été retirée ici ---

            if (!isValid) {
                console.log("Validation côté client échouée pour la proposition de trajet.");
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Proposer le trajet';
                }
                return;
            }

            console.log("📤 Soumission du formulaire de proposition de trajet (AJAX)...");
            const formData = new FormData(this);

            fetch(this.action, {
                method: "POST",
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest', // Important pour Django pour détecter les requêtes AJAX
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value // Récupérer le CSRF token
                }
            })
            .then(response => {
                console.log("📡 Réponse de proposition reçue, status:", response.status);
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
                console.log("✅ Données de proposition JSON reçues:", data);
                clearFormErrors(); // Effacer toutes les erreurs précédentes

                if (data.success) {
                    // Afficher un message de succès (peut-être via une div dédiée ou un alert)
                    const messagesDiv = document.querySelector('.messages'); // Assurez-vous d'avoir une div avec la classe 'messages'
                    if (messagesDiv) {
                        messagesDiv.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
                        messagesDiv.style.display = 'block';
                    } else {
                        alert("Succès: " + data.message);
                    }
                    // Optionnel : Réinitialiser le formulaire ou rediriger
                    proposerTrajetForm.reset();
                    // Réinitialiser les cartes et marqueurs après succès
                    if (markerProposerDepartRef.current) {
                        mapProposerDepart.removeLayer(markerProposerDepartRef.current);
                        markerProposerDepartRef.current = null;
                        mapProposerDepart.setView(defaultCoords, defaultZoom);
                    }
                    if (markerProposerArriveeRef.current) {
                        mapProposerArrivee.removeLayer(markerProposerArriveeRef.current);
                        markerProposerArriveeRef.current = null;
                        mapProposerArrivee.setView(defaultCoords, defaultZoom);
                    }
                    // Si vous voulez rediriger l'utilisateur après un succès
                    // setTimeout(() => { window.location.href = data.redirect_url || '/votre-url-de-succes/'; }, 2000);

                } else {
                    // Afficher les erreurs renvoyées par le serveur
                    displayFormErrors(data.errors);
                }
            })
            .catch(error => {
                console.error("❌ Erreur lors de la soumission du trajet:", error);
                let errorMessage = "Une erreur inattendue est survenue lors de la proposition de trajet. Veuillez réessayer.";
                if (error.errors) {
                    displayFormErrors(error.errors);
                    if (error.errors.__all__) {
                        errorMessage = error.errors.__all__.join('<br>');
                    } else if (Object.keys(error.errors).length > 0) {
                        errorMessage = "Veuillez corriger les erreurs dans le formulaire.";
                    }
                }
                // Afficher l'erreur générale
                const generalErrorsDiv = proposerTrajetForm.querySelector('.alert.alert-danger'); // Assurez-vous d'avoir une div pour les erreurs générales
                if (generalErrorsDiv) {
                    generalErrorsDiv.innerHTML = `<p>${errorMessage}</p>`;
                    generalErrorsDiv.style.display = 'block';
                } else {
                    alert("❌ " + errorMessage);
                }
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Proposer le trajet';
                }
            });
        });
    } else {
        console.error("❌ Formulaire 'proposerTrajetForm' introuvable. Les fonctionnalités de soumission pourraient être limitées.");
    }

    // --- Fonctions utilitaires pour afficher/effacer les erreurs du formulaire ---

    /**
     * Affiche un message d'erreur pour un champ de formulaire spécifique.
     * @param {HTMLElement} fieldElement - L'élément input/select/textarea du champ.
     * @param {string} message - Le message d'erreur à afficher.
     */
    function displaySpecificFieldError(fieldElement, message) {
        if (!fieldElement) {
            console.warn("displaySpecificFieldError: fieldElement est null pour le message:", message);
            return;
        }
        // Cherche une div d'erreur existante ou en crée une
        let errorDiv = fieldElement.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('text-danger')) {
            errorDiv = document.createElement('div');
            errorDiv.classList.add('text-danger', 'small', 'mt-1');
            fieldElement.parentNode.insertBefore(errorDiv, fieldElement.nextElementSibling);
        }
        errorDiv.innerHTML = `<div>${message}</div>`;
        errorDiv.style.display = 'block';
    }

    /**
     * Efface le message d'erreur pour un champ de formulaire spécifique.
     * @param {HTMLElement} fieldElement - L'élément input/select/textarea du champ.
     */
    function clearSpecificFieldError(fieldElement) {
        if (!fieldElement) return;
        let errorDiv = fieldElement.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('text-danger')) {
            errorDiv.innerHTML = '';
            errorDiv.style.display = 'none';
        }
    }

    /**
     * Affiche un message dans une div d'erreur de coordonnées spécifique.
     * @param {HTMLElement} coordsErrorDiv - La div d'erreur pour les coordonnées (e.g., depart-coords-error).
     * @param {string} message - Le message d'erreur.
     */
    function displayCoordsError(coordsErrorDiv, message) {
        if (coordsErrorDiv) {
            coordsErrorDiv.innerHTML = `<div>${message}</div>`;
            coordsErrorDiv.style.display = 'block';
        } else {
            console.warn("displayCoordsError: La div coordsErrorDiv est null.");
        }
    }

    /**
     * Efface le message dans une div d'erreur de coordonnées spécifique.
     * @param {HTMLElement} coordsErrorDiv - La div d'erreur pour les coordonnées.
     */
    function clearCoordsError(coordsErrorDiv) {
        if (coordsErrorDiv) {
            coordsErrorDiv.innerHTML = '';
            coordsErrorDiv.style.display = 'none';
        }
    }

    /**
     * Gère l'affichage de toutes les erreurs renvoyées par le serveur.
     * @param {Object} errors - Un objet contenant les erreurs (clé: nom du champ, valeur: tableau de messages).
     */
    function displayFormErrors(errors) {
        const formElement = document.getElementById("proposerTrajetForm");
        if (!formElement) {
            console.error("❌ Formulaire de proposition introuvable pour afficher les erreurs.");
            return;
        }

        clearFormErrors(); // Effacer toutes les erreurs précédentes

        // Gérer les erreurs non liées à un champ spécifique (souvent sous la clé '__all__')
        const generalErrorsDiv = formElement.querySelector('.alert.alert-danger'); // Div pour les erreurs globales du formulaire
        if (errors.__all__ && generalErrorsDiv) {
            generalErrorsDiv.innerHTML = '';
            errors.__all__.forEach(msg => {
                const p = document.createElement('p');
                p.textContent = msg;
                generalErrorsDiv.appendChild(p);
            });
            generalErrorsDiv.style.display = 'block';
        } else if (generalErrorsDiv) {
            generalErrorsDiv.style.display = 'none'; 
        }


        for (const fieldName in errors) {
            if (fieldName !== '__all__' && errors.hasOwnProperty(fieldName)) {
                const fieldErrors = errors[fieldName];
                

                if (fieldName === 'latitude_depart' || fieldName === 'longitude_depart') {
                    displayCoordsError(departCoordsErrorDiv, fieldErrors.join('<br>'));
                } else if (fieldName === 'latitude_arrivee' || fieldName === 'longitude_arrivee') {
                    displayCoordsError(arriveeCoordsErrorDiv, fieldErrors.join('<br>'));
                } else {

                    const fieldInput = document.getElementById(`id_${fieldName}`);
                    if (fieldInput) {
                        displaySpecificFieldError(fieldInput, fieldErrors.join('<br>'));
                    } else {
                        console.warn(`Champ de formulaire "${fieldName}" (id_` + fieldName + `) introuvable pour afficher les erreurs.`);
                    }
                }
            }
        }
    }


    function clearFormErrors() {
        const formElement = document.getElementById("proposerTrajetForm");
        if (!formElement) return;

    
        const generalErrorsDiv = formElement.querySelector('.alert.alert-danger');
        if (generalErrorsDiv) {
            generalErrorsDiv.style.display = 'none';
            generalErrorsDiv.innerHTML = '';
        }

      
        formElement.querySelectorAll('.text-danger').forEach(div => {
           
            if (div.id !== 'depart-coords-error' && div.id !== 'arrivee-coords-error') {
                 div.innerHTML = '';
                 div.style.display = 'none';
            }
        });

       
        clearCoordsError(departCoordsErrorDiv);
        clearCoordsError(arriveeCoordsErrorDiv);

        const messagesDiv = document.querySelector('.messages'); 
        if (messagesDiv) {
            messagesDiv.innerHTML = '';
        }
    }
});