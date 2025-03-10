const addBtn = document.getElementById("addBtn")
const form = document.querySelector(".form")
const principal = document.querySelector(".principal")
function add(){
    form.classList.toggle("active")
}
addBtn.addEventListener("click",add)
const btnPerso = document.querySelector(".listesPersonnel")
const formPerso = document.querySelector(".formPersonnel")
function addPersonnel(){
    formPerso.classList.toggle("active")
    
}
btnPerso.addEventListener("click", addPersonnel)