// script.js

document.addEventListener('DOMContentLoaded', function() {
    // ----------------------------------------------------
    // Variables globales (ou à simuler depuis le backend)
    // ----------------------------------------------------
    // Simule les données utilisateur stockées localement
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
        name: 'Utilisateur', // Nom par défaut si non connecté
        email: 'utilisateur@example.com',
        phone: '+229 00 00 00 00',
        profilePic: 'OIP.webp' // Chemin de l'image de profil par défaut
    };

    // ----------------------------------------------------
    // Éléments du DOM à mettre à jour
    // ----------------------------------------------------
    const userNameDisplays = document.querySelectorAll('#user-name-display, #welcome-user-name, #inbox-user-name, #profile-page-name');
    const profileAvatars = document.querySelectorAll('#profile-avatar, #currentProfilePic, #profile-page-avatar');
    const userEmailDisplay = document.getElementById('userEmail');
    const userPhoneDisplay = document.getElementById('userPhone');
    const profilEmailDisplay = document.getElementById('profile-page-email');
    const profilPhoneDisplay = document.getElementById('profile-page-phone');
    const settingsUserNameInput = document.getElementById('userName');
    const profilePictureInput = document.getElementById('profilePicture');
    const settingsForm = document.getElementById('settings-form');

    // ----------------------------------------------------
    // Fonction pour mettre à jour l'interface utilisateur avec les données de l'utilisateur
    // ----------------------------------------------------
    function updateUIWithUserData() {
        userNameDisplays.forEach(element => {
            element.textContent = currentUser.name;
        });
        profileAvatars.forEach(img => {
            img.src = currentUser.profilePic;
        });
        if (userEmailDisplay) userEmailDisplay.value = currentUser.email;
        if (userPhoneDisplay) userPhoneDisplay.value = currentUser.phone;
        if (profilEmailDisplay) profilEmailDisplay.textContent = currentUser.email;
        if (profilPhoneDisplay) profilPhoneDisplay.textContent = currentUser.phone;
        if (settingsUserNameInput) settingsUserNameInput.value = currentUser.name;
    }

    // Appel initial pour charger les données au démarrage
    updateUIWithUserData();

    // ----------------------------------------------------
    // 1. Gestion du basculement de la sidebar
    // ----------------------------------------------------
    var el = document.getElementById('wrapper');
    var toggleButton = document.getElementById('menu-toggle');

    if (toggleButton && el) {
        toggleButton.onclick = function () {
            el.classList.toggle('toggled');
        };
    }

    // ----------------------------------------------------
    // 2. Gestion de l'affichage des sections de contenu
    // ----------------------------------------------------

    const sidebarLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item');
    const dropdownLinks = document.querySelectorAll('#navbarDropdown + .dropdown-menu .dropdown-item');
    const contentSections = document.querySelectorAll('.content-section');

    function showSection(sectionId) {
        contentSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }

        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.targetSection === sectionId.replace('-section', '')) {
                link.classList.add('active');
            }
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetSection = this.dataset.targetSection;
            if (targetSection) {
                showSection(targetSection + '-section');
            }
        });
    });

    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetAction = this.dataset.targetAction;
            if (targetAction) {
                showSection(targetAction + '-section');
            }
        });
    });

    showSection('menu-section');

    // ----------------------------------------------------
    // 3. Fonctionnalités des boutons spécifiques (incluant les nouvelles)
    // ----------------------------------------------------

    // Bouton de recherche principal (dans la section "Menu")
    const mainSearchInput = document.getElementById('searchInput');
    const mainSearchButton = document.getElementById('mainSearchButton');
    const searchTripButton = document.getElementById('searchTripButton');

    if (mainSearchButton) {
        mainSearchButton.addEventListener('click', function() {
            const destination = mainSearchInput.value.trim();
            if (destination) {
                alert(`Recherche rapide de trajets vers : ${destination}`);
                showSection('recherche-section');
                document.getElementById('arrivalLocation').value = destination;
            } else {
                alert('Veuillez entrer une destination pour la recherche.');
            }
        });
    }

    if (searchTripButton) {
        searchTripButton.addEventListener('click', function() {
            showSection('recherche-section');
        });
    }

    // Bouton "Créer votre propre trajet" (dans la section "Menu")
    const createTripButton = document.getElementById('createTripButton');
    if (createTripButton) {
        createTripButton.addEventListener('click', function() {
            alert("Redirection ou affichage du formulaire pour créer un nouveau trajet.");
        });
    }

    // Bouton "Rechercher" dans la section "Rechercher un Trajet"
    const executeSearchButton = document.getElementById('executeSearchButton');
    const departureLocationInput = document.getElementById('departureLocation');
    const arrivalLocationInput = document.getElementById('arrivalLocation');
    const searchResultsDiv = document.getElementById('searchResults');

    if (executeSearchButton) {
        executeSearchButton.addEventListener('click', function() {
            const departure = departureLocationInput.value.trim();
            const arrival = arrivalLocationInput.value.trim();

            if (departure || arrival) {
                searchResultsDiv.innerHTML = `
                    <div class="alert alert-success">
                        Recherche de trajets de <strong>${departure || 'N\'importe où'}</strong> à <strong>${arrival || 'N\'importe où'}</strong>...
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">Trajet: Cotonou <i class="fas fa-arrow-right"></i> Parakou</h5>
                            <p class="card-text">Date: 15/07/2025 à 08:00</p>
                            <p class="card-text">Conducteur: Jean OGOU</p>
                            <button class="btn btn-sm btn-success">Voir le trajet</button>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">Trajet: Abomey-Calavi <i class="fas fa-arrow-right"></i> Cotonou</h5>
                            <p class="card-text">Date: 16/07/2025 à 14:00</p>
                            <p class="card-text">Conducteur: Sophie IFE</p>
                            <button class="btn btn-sm btn-success">Voir le trajet</button>
                        </div>
                    </div>
                `;
            } else {
                searchResultsDiv.innerHTML = `
                    <div class="alert alert-warning">
                        Veuillez spécifier au moins un lieu de départ ou d'arrivée.
                    </div>
                `;
            }
        });
    }

    // Bouton "Proposer un nouveau trajet" (dans la section "Mes Trajets" - onglet Conducteur)
    const addDriverTripButton = document.getElementById('addDriverTripButton');
    if (addDriverTripButton) {
        addDriverTripButton.addEventListener('click', function() {
            alert("Affichage du formulaire pour proposer un nouveau trajet en tant que conducteur.");
        });
    }

    // Boutons "Détails" dans l'historique des trajets
    document.querySelectorAll('.history-section button[data-action="view-details"]').forEach(button => {
        button.addEventListener('click', function() {
            const tripId = this.dataset.tripId;
            alert(`Affichage des détails du trajet #${tripId}`);
        });
    });

    // Bouton "Voir tout l'historique"
    const viewAllHistoryButton = document.getElementById('viewAllHistoryButton');
    if (viewAllHistoryButton) {
        viewAllHistoryButton.addEventListener('click', function() {
            alert("Redirection vers une page dédiée à l'historique complet des trajets.");
        });
    }

    // Boutons "Modifier" et "Supprimer" dans "Mes véhicules"
    document.querySelectorAll('.vehicles-section button[data-action="edit-vehicle"]').forEach(button => {
        button.addEventListener('click', function() {
            const vehicleId = this.dataset.vehicleId;
            alert(`Modification du véhicule #${vehicleId}`);
        });
    });

    document.querySelectorAll('.vehicles-section button[data-action="delete-vehicle"]').forEach(button => {
        button.addEventListener('click', function() {
            const vehicleId = this.dataset.vehicleId;
            if (confirm(`Êtes-vous sûr de vouloir supprimer le véhicule #${vehicleId} ?`)) {
                alert(`Véhicule #${vehicleId} supprimé (simulation).`);
                this.closest('.col-md-6.mb-3').remove();
            }
        });
    });

    // Bouton "Ajouter un véhicule"
    const addVehicleButton = document.getElementById('addVehicleButton');
    if (addVehicleButton) {
        addVehicleButton.addEventListener('click', function() {
            alert("Affichage du formulaire pour ajouter un nouveau véhicule.");
        });
    }

    // ----------------------------------------------------
    // Gestion du formulaire de Paramètres (y compris la photo de profil)
    // ----------------------------------------------------
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Empêche le rechargement de la page

            // Met à jour les informations de l'utilisateur
            currentUser.name = settingsUserNameInput.value.trim();
            currentUser.phone = userPhoneDisplay.value.trim();
            // L'email reste en lecture seule dans cet exemple

            // Si une nouvelle photo a été sélectionnée
            if (profilePictureInput.files && profilePictureInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentUser.profilePic = e.target.result; // Stocke l'URL de l'image en base64
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Sauvegarde
                    updateUIWithUserData(); // Met à jour l'interface
                    alert("Paramètres et photo de profil mis à jour (simulation).");
                };
                reader.readAsDataURL(profilePictureInput.files[0]); // Lit le fichier comme URL de données
            } else {
                localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Sauvegarde si pas de nouvelle photo
                updateUIWithUserData(); // Met à jour l'interface
                alert("Paramètres enregistrés (simulation).");
            }
        });
    }

    // Bouton "Changer de mot de passe" (Paramètres)
    const changePasswordButton = document.getElementById('changePasswordButton');
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', function() {
            alert("Redirection vers la page de changement de mot de passe ou affichage d'un modal.");
        });
    }

    // ----------------------------------------------------
    // Logique de Connexion/Déconnexion Simulé
    // ----------------------------------------------------

    // Fonction de connexion simulée (quand l'utilisateur se connecte)
    function simulateLogin(userName, userEmail, userPhone = '', profilePic = 'OIP.webp') {
        currentUser = {
            name: userName,
            email: userEmail,
            phone: userPhone,
            profilePic: profilePic
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIWithUserData();
        alert(`Bienvenue, ${userName} ! Vous êtes connecté.`);
        showSection('menu-section'); // Revenir au dashboard après connexion
    }

    // Boutons de Déconnexion
    const confirmLogoutButton = document.getElementById('confirmLogoutButton');
    const cancelLogoutButton = document.getElementById('cancelLogoutButton');

    if (confirmLogoutButton) {
        confirmLogoutButton.addEventListener('click', function() {
            localStorage.removeItem('currentUser'); // Supprime les données utilisateur
            currentUser = { // Réinitialise à l'utilisateur par défaut
                name: 'Utilisateur',
                email: 'utilisateur@example.com',
                phone: '+229 00 00 00 00',
                profilePic: 'OIP.webp'
            };
            updateUIWithUserData();
            alert("Vous avez été déconnecté.");
            // Dans une vraie application, vous redirigeriez vers la page de connexion
            // window.location.href = '/login.html';
            showSection('menu-section'); // Pour la démo, on revient au menu principal
        });
    }

    if (cancelLogoutButton) {
        cancelLogoutButton.addEventListener('click', function() {
            showSection('menu-section');
        });
    }

    // ----------------------------------------------------
    // 4. Gestion des trajets à venir (Exemple dynamique)
    // ----------------------------------------------------
    const upcomingTripsContainer = document.getElementById('upcomingTripsContainer');
    const upcomingTripsData = [
        // { from: 'Cotonou', to: 'Porto-Novo', date: 'Le 20 juin 2025 à 09:00', driver: 'Paul Dubois' },
        // { from: 'Parakou', to: 'Cotonou', date: 'Le 25 juin 2025 à 16:30', driver: 'Marie Leroy' }
    ];

    function renderUpcomingTrips() {
        if (upcomingTripsData.length === 0) {
            upcomingTripsContainer.innerHTML = `
                <div class="alert alert-info text-center" role="alert">
                    <i class="fas fa-info-circle me-2"></i>Vous n'avez aucun trajet à venir.
                </div>
            `;
        } else {
            let tripsHtml = '';
            upcomingTripsData.forEach(trip => {
                tripsHtml += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${trip.from} <i class="fas fa-arrow-right"></i> ${trip.to}</h5>
                            <p class="card-text">${trip.date}</p>
                            <p class="card-text"><small class="text-muted">Avec ${trip.driver}</small></p>
                            <button class="btn btn-sm btn-outline-primary">Détails du trajet</button>
                        </div>
                    </div>
                `;
            });
            upcomingTripsContainer.innerHTML = tripsHtml;
        }
    }

    renderUpcomingTrips();

    // ----------------------------------------------------
    // Simulation de connexion pour tester la personnalisation
    // ----------------------------------------------------
    // Vous pouvez appeler cette fonction après une "connexion réussie"
    // Par exemple, si vous aviez un bouton de connexion:
    // document.getElementById('loginButton').addEventListener('click', function() {
    //     simulateLogin('Nouveau Utilisateur', 'nouvel.user@domaine.com', '+229 66 77 88 99');
    // });
    // Ou pour tester, décommentez la ligne suivante pour simuler une connexion au chargement
    // simulateLogin('Jean Dupont', 'jean.dupont@email.com', '+229 95 12 34 56', 'https://via.placeholder.com/80/0000FF/FFFFFF?text=JD');
});