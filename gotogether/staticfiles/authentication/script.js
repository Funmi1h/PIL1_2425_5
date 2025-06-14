
document.getElementById("editProfileBtn").addEventListener("click", function() {
// Tous les inputs du formulaire
const inputs = document.querySelectorAll("form input");
// Activer tous les champs pour modification
inputs.forEach(input => {
input.removeAttribute("readonly");
input.style.backgroundColor = "#fff"; // Optionnel: change la couleur pour montrer que c'est
modifiable
});
// Optionnel: changer le texte du bouton pour "Enregistrer les modifications" this.textContent = "Enregistrer les modifications";
// Remplacer l'écouteur de clic par une fonction de sauvegarde
this.removeEventListener("click", arguments.callee);
this.addEventListener("click", function() {
alert("Modifications sauvegardées !"); // Ici tu feras un POST en vrai, si tu veux
this.textContent = "Modifier le profil";
// Rendre les champs en lecture seule à nouveau
inputs.forEach(input => {
input.setAttribute("readonly", true);
input.style.backgroundColor = "#f9f9f9";
});
});
});                                                                    