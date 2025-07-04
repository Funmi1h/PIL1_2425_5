## G![](https://maps.google.com/mapfiles/ms/icons/green-dot.png)Together  ___PIL1_2425_5

### Contexte  
Une application web qui met en relation les étudiants de l’IFRI souhaitant partager leurs trajets quotidiens entre leur domicile et le campus. *
Chaque année, les élèves de la premiere année de l'Institut de Formation et de Recherche en Informatique doivent réalisés un projet. Au cours de ce projet, les étudiants doivent collaborer avec des pairs à la réalisation d’un projet de développement d’applications, mettre en oeuvre une solution informatique en utilisant les outils et techniques apprises et communiquer les démarches, résultats et limites d’un projet en informatique à l’écrit. Le projet de cette année à réaliser une application web qui met en relation les étudiants de l’IFRI souhaitant partager leurs trajets quotidiens entre leur domicile et le campus. Réalisé dans un délai de trois semaines, ce projet  apermis d'élargir nos connaissances du framework Django et de Javascript ( de certaines bibliotheques comme Leaflet.js ). Le style de l'application a été fait à l'aide de Bootsrap5


## Manuel d'utilisation 

![logo](https://github.com/user-attachments/assets/ef71815c-ba95-46ac-ab1b-56f7dad50523)


## Fonctionnalités

* Inscription et Connexion : Les utilisateurs peuvent s'inscrire et se connecter  pour accéder à l'application.
* Récupération de mot de passe : Les utilisateurs peuvent récuperer leurs mots de passe en cas d'oubli.
* Profil Utilisateur : Chaque utilisateur a un profil contenant ses informations personnelles qu'il eut modifier à tout moment.
* Mise en correspondance des conducteurs et passagers: Des offres et des demandes de covoiturage sont publiés. Un algorithme de matching est utilisé pour proposer des combinaisons conducteur-passager et les résultats de ce dernier affiche des informations pertinentes pour aider au covoiturage.
* Messagerie Instantanée : Les utilisateurs peuvent discuter en temps réel entre eux pour affiner les détails du trajet. Des suggestions deconducteurs ou de passagers sont faites àchaque utilisateur
* Liste des Discussions : Visualisez et accédez rapidement à vos discussions récentes.
* Suggestions de trajets : Découvrez en fonction de votre rôle des suggestions de trajets proposés par de conducteur ou des trajets demandés par des passagers.

## Installation 
- [Python](https://www.python.org/downloads/)
- [Django](https://www.djangoproject.com/)
- Autres dépendances listés dans le fichier requirements.txt

     ## Installation
1.  Créer un dossier et l'ouvrir dans l'éditeur de code
2.  Créer et activer l'environnement virtuel
    - Sous Windows:
    <pre>
      python -m venv env
     .\mon_env\Scripts\activate
    </pre>
    - Sous Linux:
    <pre>
        python3 -m venv mon env
        source env/bin/activate
    </pre>
  3. Cloner le dépot dans le dossier
     <pre>
       (env) git clone https://github.com/Funmi1h/PIL1_2425_5.git
     </pre>
  4. Naviguer dans le répertoire du projet PIL1_2425_5 et aller dans le sous dossier gotogether
     <pre>
          (env) cd PIL1_2425_5
          (env) cd gotogether
     </pre>

  5. Installer les dépendances
     <pre>
          (env) pip install -r requirements.txt
     </pre>
   6. Configurer les variables d'environnements 
       *  Copier le fichier '.env.example' dans le repertoire gotogether en fichier '.env'
          <pre>
               (env) cd gotogether
               (env) cp .env.example .env
          </pre>
          
       * Ouvrez le fichier .env et remplissez avec vos propres informations:
         - Les identifiants de votre base de données (your_db_name, your_db_user, your_secure_password )
         - L'adresse email d'envoi et le mot de passe d'application
     ⚠️ N'oubliez pas de remplir toutes les variables sinon il pourrait y avoir des bugs

7. Effectuer les migrations

   
   <pre>
        (env) python manage.py  makemigrations
        (env) python manage.py migrate
   </pre>

   
8. Démarrer le serveur de développement
   
   <pre>
        (env) daphne gotogether.asgi:application 
   </pre>
     
