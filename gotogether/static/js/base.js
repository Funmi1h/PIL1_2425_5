function toggleIcon(){
    let burgerIcon = document.getElementById("burgerIcon")
    if (burgerIcon.getAttribute("name") == 'filter-outline'){
        burgerIcon.setAttribute("name" ,'close-outline')
    } else{
        burgerIcon.setAttribute("name", "filter-outline")
    }
}




document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.querySelector('.search-dropdown');
  const searchBar = dropdown.querySelector('.search-bar');
  const searchInput = searchBar.querySelector('input');

  // Container pour afficher les résultats
  const resultsContainer = document.createElement('ul');
  resultsContainer.style.position = 'absolute';
  resultsContainer.style.backgroundColor = 'white';
  resultsContainer.style.border = '1px solid #ccc';
  resultsContainer.style.width = searchInput.offsetWidth + 'px';
  resultsContainer.style.marginTop = '5px';
  resultsContainer.style.listStyle = 'none';
  resultsContainer.style.padding = '0';
  resultsContainer.style.maxHeight = '200px';
  resultsContainer.style.overflowY = 'auto';
  resultsContainer.style.zIndex = '1000';
  resultsContainer.style.display = 'none';
  searchBar.appendChild(resultsContainer);

  // Container pour afficher le profil complet de l’utilisateur sélectionné
  let userProfileDisplay = document.getElementById('user-profile-display');
  if (!userProfileDisplay) {
    userProfileDisplay = document.createElement('div');
    userProfileDisplay.id = 'user-profile-display';
    userProfileDisplay.style.border = '1px solid #ccc';
    userProfileDisplay.style.padding = '15px';
    userProfileDisplay.style.marginTop = '10px';
    userProfileDisplay.style.backgroundColor = '#fafafa';
    userProfileDisplay.style.display = 'none';
    userProfileDisplay.style.maxWidth = '350px';
    dropdown.appendChild(userProfileDisplay);
  }

  let currentUsers = [];
  let debounceTimeout = null;

  // Affiche la barre et focus input au survol
  dropdown.addEventListener('mouseenter', () => {
    searchBar.style.display = 'block';
    searchInput.focus();
  });

  // Cache la barre + résultats si on quitte, sauf si focus dans barre
  dropdown.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!searchBar.contains(document.activeElement)) {
        searchBar.style.display = 'none';
        clearResults();
        hideUserProfile();
      }
    }, 200);
  });

  // Clic hors dropdown ferme la barre + résultats + profil
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      searchBar.style.display = 'none';
      clearResults();
      hideUserProfile();
    }
  });

  // Utilitaire : nettoie les résultats
  function clearResults() {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
  }

  // Utilitaire : cache profil utilisateur affiché
  function hideUserProfile() {
    userProfileDisplay.innerHTML = '';
    userProfileDisplay.style.display = 'none';
  }

  // Crée photo profil ou fallback icône Ionicons
  function createProfilePicture(user, size = 40) {
    if (user.photo_profil && user.photo_profil.trim() !== '') {
      const img = document.createElement('img');
      img.src = user.photo_profil;
      img.alt = `${user.first_name} ${user.last_name}`;
      img.style.width = size + 'px';
      img.style.height = size + 'px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      return img;
    } else {
      const icon = document.createElement('ion-icon');
      icon.name = 'person-circle-outline';
      icon.style.fontSize = size + 'px';
      icon.style.color = '#666';
      return icon;
    }
  }

  // Affiche la liste des résultats sous la barre
  function renderResults(users) {
    clearResults();

    if (!Array.isArray(users) || users.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat';
      li.style.padding = '5px 10px';
      resultsContainer.appendChild(li);
      resultsContainer.style.display = 'block';
      return;
    }

    users.forEach(user => {
      const li = document.createElement('li');
      li.style.padding = '5px 10px';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '10px';

      const picture = createProfilePicture(user);

      const textDiv = document.createElement('div');
      textDiv.style.flexGrow = '1';

      const roleSpan = document.createElement('div');
      roleSpan.textContent = user.role;
      roleSpan.style.fontWeight = 'bold';
      roleSpan.style.fontSize = '0.9em';

      const nameSpan = document.createElement('div');
      nameSpan.textContent = `${user.first_name} ${user.last_name}`;

      textDiv.appendChild(roleSpan);
      textDiv.appendChild(nameSpan);

      const chatLink = document.createElement('a');
      chatLink.href = `/messagerie/chat/${user.id}/`;
      chatLink.textContent = 'Message';
      chatLink.style.padding = '5px 12px';
      chatLink.style.backgroundColor = '#007bff';
      chatLink.style.color = 'white';
      chatLink.style.borderRadius = '4px';
      chatLink.style.textDecoration = 'none';
      chatLink.style.fontWeight = 'bold';
      chatLink.style.whiteSpace = 'nowrap';
      chatLink.target = '_blank';

      // Clic sur le li remplit l'input, masque dropdown et résultats
      li.addEventListener('click', () => {
        searchInput.value = `${user.first_name} ${user.last_name}`;
        clearResults();
        hideUserProfile();
        searchBar.style.display = 'none';
      });

      li.appendChild(picture);
      li.appendChild(textDiv);
      li.appendChild(chatLink);

      resultsContainer.appendChild(li);
    });

    resultsContainer.style.display = 'block';
  }

  // Affiche le profil complet de l'utilisateur sélectionné
  function displayUserProfile(user) {
    userProfileDisplay.innerHTML = '';
    userProfileDisplay.style.display = 'block';

    const picture = createProfilePicture(user, 80);
    picture.style.marginBottom = '10px';

    const role = document.createElement('div');
    role.textContent = `Role: ${user.role}`;
    role.style.fontWeight = 'bold';

    const name = document.createElement('div');
    name.textContent = `Nom complet: ${user.first_name} ${user.last_name}`;
    name.style.marginBottom = '10px';

    const chatLink = document.createElement('a');
    chatLink.href = `/messagerie/chat/${user.id}/`;
    chatLink.textContent = 'Accéder au chat';
    chatLink.target = '_blank';
    chatLink.style.display = 'inline-block';
    chatLink.style.marginTop = '10px';
    chatLink.style.color = '#007bff';
    chatLink.style.textDecoration = 'none';
    chatLink.style.fontWeight = 'bold';

    userProfileDisplay.appendChild(picture);
    userProfileDisplay.appendChild(role);
    userProfileDisplay.appendChild(name);
    userProfileDisplay.appendChild(chatLink);
  }

  // Gérer recherche AJAX avec debounce
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimeout);

    if (query.length < 2) {
      clearResults();
      currentUsers = [];
      hideUserProfile();
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetch(`/search-users/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          currentUsers = Array.isArray(data) ? data : (data.users || []);
          renderResults(currentUsers);
          hideUserProfile();
        })
        .catch(() => {
          clearResults();
          currentUsers = [];
          hideUserProfile();
        });
    }, 300);
  });

  // Gérer touche Entrée dans champ recherche
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = searchInput.value.trim().toLowerCase();
      if (query.length === 0) return;

      // Chercher utilisateur dans currentUsers (nom complet exact)
      const matchedUser = currentUsers.find(user => {
        const fullName = (user.first_name + ' ' + user.last_name).toLowerCase();
        return fullName === query;
      });

      if (matchedUser) {
        displayUserProfile(matchedUser);
        clearResults();
        searchBar.style.display = 'none';
      } else {
        hideUserProfile();
        alert('Utilisateur non trouvé dans les résultats.');
      }
    }
  });
});
