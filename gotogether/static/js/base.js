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
  const resultsContainer = dropdown.querySelector('.results-container');
  const userProfileDisplay = document.getElementById('user-profile-display');

  let currentUsers = [];
  let debounceTimeout = null;

  // Ouvre la barre au survol ou au clic et focus
  const showBar = () => {
    searchBar.style.display = 'block';
    searchInput.focus();
  };
  dropdown.addEventListener('mouseenter', showBar);
  dropdown.addEventListener('click', showBar);

  // Ne ferme pas immédiatement si focus sur input ou results
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      searchBar.style.display = 'none';
      clearResults();
      hideUserProfile();
    }
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      clearResults();
      return;
    }
    debounceTimeout = setTimeout(() => {
      fetch(`/search-users/?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          currentUsers = Array.isArray(data) ? data : (data.users || []);
          renderResults(currentUsers);
        })
        .catch(clearResults);
    }, 300);
  });

  // Rendu des résultats
  function renderResults(users) {
  clearResults();
  users.forEach(u => {
    const li = document.createElement('li');
    li.className = 'd-flex align-items-center px-2 py-1';
    li.innerHTML = `
      ${u.photo_profil
        ? `<img src="${u.photo_profil}" width="40" height="40" class="rounded-circle me-2">`
        : `<ion-icon name="person-circle-outline" style="font-size:40px;" class="me-2"></ion-icon>`
      }
      <div class="flex-grow-1">
        <div><strong>${u.first_name} ${u.last_name}</strong></div>
        <small class="text-muted">${u.role}</small>
      </div>
      <a href="/messages/chat/${u.id}/" class="btn btn-sm btn-primary ms-2" target="_blank">Message</a>`;
    li.addEventListener('click', e => {
      // Si on clique sur le li (pas sur le lien), afficher profil
      if (!e.target.closest('a')) {
        displayUserProfile(u);
      }
    });
    resultsContainer.appendChild(li);
  });
  resultsContainer.style.display = 'block';
}


  function clearResults() {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
  }

  function hideUserProfile() {
    userProfileDisplay.innerHTML = '';
    userProfileDisplay.style.display = 'none';
  }

  function displayUserProfile(u) {
    userProfileDisplay.innerHTML = `
      ${u.photo_profil
        ? `<img src="${u.photo_profil}" width="80" height="80" class="rounded-circle mb-2">`
        : `<ion-icon name="person-circle-outline" style="font-size:80px;" class="mb-2"></ion-icon>`
      }
      <div><strong>${u.first_name} ${u.last_name}</strong></div>
      <div><small>${u.role}</small></div>
      <a href="/messagerie/chat/${u.id}/" class="btn btn-primary btn-sm mt-2" target="_blank">Accéder au chat</a>
    `;
    userProfileDisplay.style.display = 'block';
  }
});
