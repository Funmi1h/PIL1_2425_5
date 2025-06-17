function toggleIcon(){
    let burgerIcon = document.getElementById("burgerIcon")
    if (burgerIcon.getAttribute("name") == 'filter-outline'){
        burgerIcon.setAttribute("name" ,'close-outline')
    } else{
        burgerIcon.setAttribute("name", "filter-outline")
    }
} 