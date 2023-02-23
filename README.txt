### MANUAL & README - Sujet A GL02

Description : Le logiciel a pour but de faciliter la gestion des locaux de l'université centrale de la république de Sealand ainsi que l'organisation de ses usagers qui sont les enseignants et les étudiants.

### Utilisation :

$ node caporal.js <command> <argument>

**************************************

<command> : getman          //(get manual)  

Donne accès au manuel d'utilisation contenant les informations de README et des commandes 

<argument> : Pas d'arguments

Exemple : node caporal.js getman

**************************************

<command> : getroom         //(get room) 

Donne une liste de toutes les salles en lien avec une UE donnée en argument

<argument> : <Nom_de_l'UE> Le nom de l'UE doit etre écrit en majuscule

Exemple : node caporal.js getroom GL02

**************************************

<command> : getcap          //(get capacity)

Donne la capacité maximale en terme de nombre de place d'une salle donnée en argument

<argument> : <Nom_de_la_salle> Le nom de la salle doit etre écrit en majuscule

Exemple : node caporal.js getcap B101

**************************************

<command> : makeiCalendar          //(get ics file)

Ouvre un serveur web local pour télécharger un fichier ics créer en fonction des différentes informations rentrées par l'utilisateur.
Les informations demandées sont : 
- Date de début 
- Date de fin
- UE participé
- choix des horaires pour chaque UE.

<argument> : Pas d'argument

Exemple : node caporal.js makeiCalendar

**************************************

<command> : occupancyRate 

Ouvre un graphe correspondant aux pourcentage d'occupation de chaque salle.
L'affichage se faire grâce à un serveur en local ouvert sur votre port 3000.
Si jamais rien ne s'affiche, vérifier que votre 3000 est bien ouvert. 

<argument> : Pas d'argument

Exemple : node caporal.js occupancyRate 

**************************************

<command> : displaydispo

Affiche tout les créneaux de 30 minutes d'une salle pour une semaine type.
Une croix signifie que la salle est occupée.

<argument> : <Nom_de_la_salle> Une lettre majuscule et 3 chiffres

Exemple : node caporal.js displaydispo B103

**************************************

<command> : viewfreeroom

Affiche toutes les salles disponible durant un créneau pour un jour donné (horaires arrondi à la demi-heure)

<argument> : <date> JJ/MM/AAAA <2_horaires> HH:MM-HH:MM

Exemple : node caporal.js viewfreeroom 01/12/2022 10:25-18:47

**************************************