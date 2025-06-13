document.addEventListener('DOMContentLoaded', function() {
<<<<<<< HEAD
    // Gère le basculement de la sidebar
=======
>>>>>>> 0e3528d (Dashboard réalisé)
    var el = document.getElementById('wrapper');
    var toggleButton = document.getElementById('menu-toggle');

    if (toggleButton && el) {
        toggleButton.onclick = function () {
            el.classList.toggle('toggled');
        };
    }

<<<<<<< HEAD
    // Données de conversations (simulées)
    const conversations = [
        {
            id: 'conv-1',
            name: 'Jean',
            avatar: 'OIP(3).webp',
            lastMessage: 'Rendez-vous confirmé pour demain.',
            time: '15:30',
            unread: 2,
            messages: [
                { sender: 'Jean', content: 'Bonjour Sophie, Comment allez-vous ?', time: '15:20', type: 'received' },
                { sender: 'Sophia', content: 'Très bien, merci ! Et vous ?', time: '15:22', type: 'sent' },
                { sender: 'Jean', content: 'Parfait ! Juste pour confirmer notre rendez-vous demain à 10h ?', time: '15:25', type: 'received' },
                { sender: 'Sophia', content: 'Oui, tout à fait ! C\'est bien noté.', time: '15:26', type: 'sent' },
                { sender: 'Jean', content: 'Super. A demain alors !', time: '15:30', type: 'received' }
            ]
        },
        {
            id: 'conv-2',
            name: 'Service Support',
            avatar: 'OIP(3).webp',
            lastMessage: 'Votre ticket a été mis à jour.',
            time: 'Hier',
            unread: 0,
            messages: [
                { sender: 'Sophia', content: 'Bonjour, j\'ai un problème avec mon compte.', time: 'Hier 10:00', type: 'sent' },
                { sender: 'Service Support', content: 'Bonjour Sophie, quel est votre problème ?', time: 'Hier 10:15', type: 'received' },
                { sender: 'Service Support', content: 'Votre ticket #12345 a été mis à jour. Veuillez consulter notre centre d\'aide.', time: 'Hier 11:00', type: 'received' }
            ]
        },
        {
            id: 'conv-3',
            name: 'Équipe Marketing',
            avatar: 'OIP(3).webp',
            lastMessage: 'Nouvelle campagne à lancer.',
            time: '2 Jours',
            unread: 0,
            messages: [
                { sender: 'Équipe Marketing', content: 'Salut l\'équipe ! Nous avons une nouvelle campagne à lancer la semaine prochaine.', time: 'Il y a 2 jours', type: 'received' },
                { sender: 'Sophia', content: 'Super, j\'ai hâte de voir ça !', time: 'Il y a 2 jours', type: 'sent' }
            ]
        }
    ];

    const conversationsList = document.getElementById('conversations-list');
    const messageArea = document.querySelector('.message-area');
    const messageHeader = document.querySelector('.message-area .message-header');
    const messageBody = document.querySelector('.message-area .message-body');
    const messageReplyBox = document.querySelector('.message-area .message-reply-box');
    const mainTitle = document.querySelector('#page-content-wrapper .fs-2'); // Titre principal du contenu

    // Fonction pour rendre la liste des conversations
    function renderConversations() {
        conversationsList.innerHTML = '';
        conversations.forEach(conv => {
            const conversationDiv = document.createElement('a');
            conversationDiv.href = '#';
            conversationDiv.classList.add('list-group-item', 'list-group-item-action', 'bg-transparent', 'second-text', 'fw-bold', 'd-flex', 'align-items-center', 'conversation-item');
            conversationDiv.dataset.conversationId = conv.id;

            let unreadBadge = '';
            if (conv.unread > 0) {
                unreadBadge = `<span class="badge bg-primary rounded-pill ms-auto">${conv.unread}</span>`;
            }

            conversationDiv.innerHTML = `
                <img src="${conv.avatar}" alt="${conv.name}" class="rounded-circle me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold">${conv.name}</h6>
                    <p class="mb-0 text-muted small">${conv.lastMessage}</p>
                </div>
                <small class="text-muted float-end">${conv.time}</small>
                ${unreadBadge}
            `;
            conversationsList.appendChild(conversationDiv);
        });
    }

    // Fonction pour afficher une conversation spécifique
    function displayConversation(conversationId) {
        const selectedConv = conversations.find(conv => conv.id === conversationId);

        if (selectedConv) {
            // Mise à jour de la classe active dans la sidebar
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.add('active');

            // Mettre à jour le titre principal avec le nom de l'expéditeur
            mainTitle.textContent = selectedConv.name;

            // Mettre à jour l'en-tête du message
            messageHeader.innerHTML = `
                <img src="${selectedConv.avatar}" alt="${selectedConv.name}" class="rounded-circle me-3 sender-avatar">
                <div>
                    <h4 class="mb-0">${selectedConv.name}</h4>
                    <p class="text-muted mb-0 small">${selectedConv.time}</p>
                </div>
                <div class="ms-auto message-actions">
                    <button class="btn btn-outline-secondary btn-sm me-2"><i class="fas fa-reply"></i> Répondre</button>
                    <button class="btn btn-outline-secondary btn-sm me-2"><i class="fas fa-share"></i> Transférer</button>
                    <button class="btn btn-outline-danger btn-sm"><i class="fas fa-trash-alt"></i> Supprimer</button>
                </div>
            `;

            // Afficher les messages de la conversation
            messageBody.innerHTML = '';
            selectedConv.messages.forEach(msg => {
                const messageClass = msg.type === 'sent' ? 'text-end' : 'text-start';
                const messageBubbleClass = msg.type === 'sent' ? 'bg-primary text-white' : 'bg-light text-dark';
                const senderNameClass = msg.type === 'sent' ? 'd-none' : 'small text-muted mb-1'; // Cache le nom de l'expéditeur pour les messages envoyés

                messageBody.innerHTML += `
                    <div class="d-flex ${msg.type === 'sent' ? 'justify-content-end' : 'justify-content-start'} mb-3">
                        <div class="message-bubble p-3 rounded-3 ${messageBubbleClass}" style="max-width: 75%;">
                            <div class="${senderNameClass}">${msg.sender}</div>
                            <p class="mb-1">${msg.content}</p>
                            <small class="text-white-50 float-end">${msg.time}</small>
=======
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
>>>>>>> 0e3528d (Dashboard réalisé)
                        </div>
                    </div>
                `;
            });
<<<<<<< HEAD
            messageBody.scrollTop = messageBody.scrollHeight; // Scroll to bottom

            // S'assurer que le champ de réponse est visible
            messageReplyBox.style.display = 'block';

            // Marquer la conversation comme lue (si applicable)
            selectedConv.unread = 0;
            renderConversations(); // Re-rendre la liste pour mettre à jour le badge

        } else {
            // Afficher un message par défaut si aucune conversation n'est sélectionnée
            messageHeader.innerHTML = '<h4 class="mb-0">Sélectionnez une conversation</h4>';
            messageBody.innerHTML = '<p class="text-center text-muted mt-5">Cliquez sur une conversation pour afficher les messages.</p>';
            messageReplyBox.style.display = 'none';
            mainTitle.textContent = 'Boîte de réception';
        }
    }

    // Gestionnaire d'événements pour cliquer sur une conversation
    conversationsList.addEventListener('click', function(event) {
        const target = event.target.closest('.conversation-item');
        if (target) {
            const conversationId = target.dataset.conversationId;
            displayConversation(conversationId);
        }
    });

    // Initialiser le dashboard en affichant la première conversation par défaut (ou un message vide)
    if (conversations.length > 0) {
        renderConversations();
        displayConversation(conversations[0].id); // Affiche la première conversation par défaut
    } else {
        renderConversations(); // Pour afficher les badges si des conversations sont ajoutées plus tard
        displayConversation(null); // Affiche le message "Sélectionnez une conversation"
    }

    // Logique pour le bouton "Envoyer" dans la boîte de réponse
    const sendButton = messageReplyBox.querySelector('.btn-primary');
    const replyTextArea = document.getElementById('messageReply');

    if (sendButton && replyTextArea) {
        sendButton.addEventListener('click', function() {
            const messageContent = replyTextArea.value.trim();
            const currentConversationId = document.querySelector('.conversation-item.active')?.dataset.conversationId;

            if (messageContent && currentConversationId) {
                const currentConversation = conversations.find(conv => conv.id === currentConversationId);
                if (currentConversation) {
                    const now = new Date();
                    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
                    currentConversation.messages.push({
                        sender: 'Sophie Dupont', // Simuler l'utilisateur actuel
                        content: messageContent,
                        time: timeString,
                        type: 'sent'
                    });
                    currentConversation.lastMessage = messageContent; // Mettre à jour le dernier message
                    currentConversation.time = timeString; // Mettre à jour l'heure du dernier message

                    replyTextArea.value = ''; // Vider le champ de texte
                    displayConversation(currentConversationId); // Recharger la conversation pour afficher le nouveau message
                    renderConversations(); // Re-rendre la liste pour mettre à jour le dernier message et l'heure
                }
            } else {
                alert('Veuillez écrire un message.');
=======
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
>>>>>>> 0e3528d (Dashboard réalisé)
            }
        });
    }

<<<<<<< HEAD
    // Amélioration de la barre de défilement des messages (optionnel, nécessite du CSS personnalisé)
    // messageBody.style.overflowY = 'auto';
    // messageBody.style.maxHeight = 'calc(100vh - 400px)'; // Hauteur maximale pour le défilement
=======
    // Ici, vous pouvez ajouter plus de logique JavaScript pour :
    // 1. Charger dynamiquement l'historique des trajets depuis une API.
    // 2. Gérer l'ajout/modification/suppression de véhicules.
    // 3. Implémenter des fonctionnalités de messagerie, notifications, etc.
    // 4. Validation de formulaires.
    // 5. Interactivité des cartes (si vous intégrez une API cartographique comme Google Maps).
>>>>>>> 0e3528d (Dashboard réalisé)
});