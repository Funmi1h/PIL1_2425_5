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
  const resultsContainer = document.getElementById('global-results-container');

  let userProfileDisplay = document.getElementById('user-profile-display');
  let currentUsers = [];
  let debounceTimeout = null;

  // Affiche la barre et focus input au survol
  dropdown.addEventListener('mouseenter', () => {
    searchBar.style.display = 'block';
    searchInput.focus();
  });

  // Cache la barre si on quitte
  dropdown.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!searchBar.contains(document.activeElement)) {
        searchBar.style.display = 'none';
        clearResults();
        hideUserProfile();
      }
    }, 200);
  });

  // Clique ailleurs = fermer
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && !resultsContainer.contains(e.target)) {
      searchBar.style.display = 'none';
      clearResults();
      hideUserProfile();
    }
  });

  function clearResults() {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
  }

  function hideUserProfile() {
    userProfileDisplay.innerHTML = '';
    userProfileDisplay.style.display = 'none';
  }

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

  function renderResults(users) {
    clearResults();

    const rect = searchInput.getBoundingClientRect();
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = rect.bottom + window.scrollY + 'px';
    resultsContainer.style.left = rect.left + window.scrollX + 'px';
    resultsContainer.style.width = rect.width + 'px';
    resultsContainer.style.backgroundColor = 'white';
    resultsContainer.style.border = '1px solid #ccc';
    resultsContainer.style.maxHeight = '200px';
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.zIndex = '1000';
    resultsContainer.style.listStyle = 'none';
    resultsContainer.style.padding = '0';
    resultsContainer.style.margin = '0';

    if (!Array.isArray(users) || users.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucun résultat';
      li.style.padding = '8px 10px';
      resultsContainer.appendChild(li);
      resultsContainer.style.display = 'block';
      return;
    }

    users.forEach(user => {
      const li = document.createElement('li');
      li.style.padding = '8px 10px';
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

      li.addEventListener('click', () => {
        searchInput.value = `${user.first_name} ${user.last_name}`;
        displayUserProfile(user);
        clearResults();
      });

      li.appendChild(picture);
      li.appendChild(textDiv);
      li.appendChild(chatLink);
      resultsContainer.appendChild(li);
    });

    resultsContainer.style.display = 'block';
  }

  function displayUserProfile(user) {
    userProfileDisplay.innerHTML = '';
    userProfileDisplay.style.display = 'block';

    const picture = createProfilePicture(user, 80);
    picture.style.marginBottom = '10px';

    const role = document.createElement('div');
    role.textContent = `Rôle : ${user.role}`;
    role.style.fontWeight = 'bold';

    const name = document.createElement('div');
    name.textContent = `Nom complet : ${user.first_name} ${user.last_name}`;
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
        .then(res => res.json())
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

  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = searchInput.value.trim().toLowerCase();
      if (query.length === 0) return;

      const matchedUser = currentUsers.find(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName === query;
      });

      if (matchedUser) {
        displayUserProfile(matchedUser);
        clearResults();
      } else {
        hideUserProfile();
        alert('Utilisateur non trouvé dans les résultats.');
      }
    }
  });
});
