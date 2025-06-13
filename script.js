document.addEventListener('DOMContentLoaded', function() {
    var el = document.getElementById('wrapper');
    var toggleButton = document.getElementById('menu-toggle');

    if (toggleButton && el) {
        toggleButton.onclick = function () {
            el.classList.toggle('toggled');
        };
    }

    // Gestion de l'affichage des trajets à venir (exemple simple)
    // Ici, vous feriez normalement un appel API pour récupérer les trajets
    const upcomingTripsContainer = document.querySelector('.upcoming-trips-section');
    const upcomingTripsData = [
        // { from: 'Paris', to: 'Lyon', date: 'Le 15 juillet 2025 à 10:00', driver: 'Jean Dupont' },
        // { from: 'Marseille', to: 'Nice', date: 'Le 20 juillet 2025 à 14:30', driver: 'Sophie Martin' }
    ]; // Simulation de données vides ou remplies

    function renderUpcomingTrips() {
        if (upcomingTripsData.length === 0) {
            upcomingTripsContainer.innerHTML = `
                <h3 class="fs-4 mb-3">Trajets à venir</h3>
                <div class="alert alert-info text-center" role="alert">
                    <i class="fas fa-info-circle me-2"></i>Vous n'avez aucun trajet à venir.
                </div>
            `;
        } else {
            let tripsHtml = '<h3 class="fs-4 mb-3">Trajets à venir</h3>';
            upcomingTripsData.forEach(trip => {
                tripsHtml += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${trip.from} <i class="fas fa-arrow-right"></i> ${trip.to}</h5>
                            <p class="card-text">${trip.date}</p>
                            <p class="card-text"><small class="text-muted">Avec ${trip.driver}</small></p>
                            <button class="btn btn-sm btn-outline-primary">Détails</button>
                        </div>
                    </div>
                `;
            });
            upcomingTripsContainer.innerHTML = tripsHtml;
        }
    }

    renderUpcomingTrips(); // Appel initial pour afficher l'état des trajets

    // Exemple de gestion de la recherche de trajet (très basique, pour démonstration)
    const searchInput = document.querySelector('.welcome-section input[type="text"]');
    const searchButton = document.querySelector('.welcome-section .input-group .btn-primary');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            const destination = searchInput.value.trim();
            if (destination) {
                alert(`Recherche de trajets vers : ${destination}`);
                // Ici, vous implémenteriez la logique de redirection ou d'affichage des résultats de recherche
            } else {
                alert('Veuillez entrer une destination.');
            }
        });
    }

    // Ici, vous pouvez ajouter plus de logique JavaScript pour :
    // 1. Charger dynamiquement l'historique des trajets depuis une API.
    // 2. Gérer l'ajout/modification/suppression de véhicules.
    // 3. Implémenter des fonctionnalités de messagerie, notifications, etc.
    // 4. Validation de formulaires.
    // 5. Interactivité des cartes (si vous intégrez une API cartographique comme Google Maps).
});