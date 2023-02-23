const fs = require('fs');
const parserUeSalle = require('./parserUeSalle.js');
const parserGeneral = require('./Parser.js');
const path = require('path');
const vega = require('vega');
const lite = require('vega-lite');
const open = require('open');
const express = require('express');
const prompts = require('prompts');
const ical = require('ical-generator');
const http = require('http');
var app = express();



class Actions{
/**
 * This function read every files and give the content of every files as argument on the parser for parsing
 * @param {parserGeneral} parser the general parser as argument on the ./Parser.js file
 */
    static parseAll = function(parser) {
        const directoryPath = path.join('.','SujetA_data');
        let listpath;
        let allData;

        //searching all the directory on the directory SujetA_data
        listpath = fs.readdirSync(directoryPath, function (err, listpath) {
            if (err) {
                return console.log("Unable to find path : "+ err);
            } 
        })
        //read every files on the directory SujetA_data and put the content of each file together on allData
        listpath.forEach(function (data) {
            allData += fs.readFileSync('./SujetA_data/'+data+'/edt.cru','utf8');
        })
        parser.parse(allData);
    }


    /**
     * function that ask the user for informations and give back a ics file.
     * Open a window for the download.
     */

    static actionIcalendar = function({logger, args}){
        /**
         * Asynchrone function that allow to use await operator to wait the fulfillment of the prompts.
         */
        (async () => {
            let parser = new parserGeneral();
            Actions.parseAll(parser);

            //Regex for the verification of the date enter by the user
            const verifDate = /(?:0[1-9]|[12][0-9]|3[01])\/(?:0[1-9]|1[012])\/202[2-9]/gm;
            const today = new Date();
            const splitDate = /\//;
            //Regex for the verification of the UE
            const verifUE = /[A-Z]{2,10}[0-9]{0,2}[A-Z]{0,1}[0-9]{0,1}/gm;
            //Ask the user to enter two dates and the UE, the answers are stored in response
            const response = await prompts ([
                {
                    type : 'text',
                    name : 'dateDebut',
                    message : "rentrer la date de début (DD/MM/YYYY)",
                    validate : dateDebut => {
                        let d = dateDebut.split(splitDate);
                        let jourD = d.shift();
                        let moisD = d.shift()-1;
                        let anneeD = d.shift();
                        d = new Date(anneeD, moisD, jourD);
                        if (!dateDebut.match(verifDate)) {
                            return "la date n'est pas au bon format"; 
                        } else if (d < today) {
                            return "la date doit être supérieur à celle d'aujourd'hui";
                        } else {
                            return true; 
                        };
                    }
                },
                {
                    type : 'text',
                    name : 'dateFin',
                    message : "rentrer la date de fin (DD/MM/YYY)",
                    validate : dateFin => !dateFin.match(verifDate) ? "date pas bonne" : true
                },
                {
                    type : 'list',
                    name : 'UE',
                    message : 'entrer vos UE (en majuscule) séparées par une ","',
                    separator : ','
                }
            ]);

            //Initialisation of all the var that we need to get each UE
            let tabUE = [];
            let creneau = [];
            let objCreneau;
            let horaire;
            let indice;
            let nomUE;
            let typeCours;
            let nomSalle;
            let jour;
            let heureD;
            let heureF;
            let groupe;

            //loop for each room
            parser.listeSalle.forEach(salle => {
                //store the name of the room
                nomSalle = salle.nomSalle;

                salle.agenda.forEach((day, j)  => {
                    //store the day according to the indice of the array
                    switch (j) {
                        case 0 : 
                            jour = "Lundi";
                            break;
                        case 1 : 
                            jour = "Mardi";
                            break;
                        case 2 : 
                            jour = "Mercredi";
                            break;
                        case 3 : 
                            jour = "Jeudi";
                            break;
                        case 4 : 
                            jour = "Vendredi";
                            break;
                        case 5 : 
                            jour = "Samedi";
                            break;
                        case 6 : 
                            jour = "Dimanche";
                            break;
                    }


                    day.forEach((c, h) => {
                        //store start and end time.
                        heureD = h;
                        heureF = h+1;

                        //if the lesson schedule exist
                        if(c !== undefined) {
                            //if the UE corresponds with one of those entered by the user
                            groupe = c.type;
                            if (response.UE.includes(c.nomUE)) {
                                typeCours = c.type;
                                if (typeCours.includes("C")) {
                                    typeCours = "CM";
                                } else if (typeCours.includes("T")) {
                                    typeCours = "TP";
                                } else {
                                    typeCours = "TD";
                                }
                                nomUE = c.nomUE;
                                creneau = [];
                                //create an object with the name of the room, day, start and end time                               
                                objCreneau = {nomSalle, jour, heureD, heureF, typeCours, groupe};
                                //object that stores the EU name and a array who will receive objCreneau.
                                horaire = {nomUE, creneau};

                                //test that checks if the UE is already present the object horaire.
                                const exist = (e) => e.nomUE === horaire.nomUE;
                                //Retrieves the index where the UE is stored if it is ever found.
                                indice = tabUE.findIndex(exist);
                                
                                //Initialization, if tabUE is empty, automatically filled with the first data.
                                if (tabUE.length === 0) {
                                    horaire.creneau.push(objCreneau)
                                    tabUE.push(horaire);
                                //Checks if the unit being processed already exists in the tabUE table
                                } else if (tabUE.some(exist)) {
                                    //test to see if the slot fits
                                    const verifCreneau = (e) => e.nomSalle === objCreneau.nomSalle && e.jour === objCreneau.jour && e.heureF === objCreneau.heureD && e.groupe === objCreneau.groupe;
                                    //retrieves the index of the corresponding slot if it exists.
                                    let indiceCreneau = tabUE[indice].creneau.findIndex(verifCreneau);
                                    // console.log(tabUE[indice]);

                                    //if the slot exists
                                    if (tabUE[indice].creneau.some(verifCreneau)) {
                                        //add half an hour to the end time
                                        tabUE[indice].creneau[indiceCreneau].heureF++;
                                    } else {
                                        //Otherwise, push in the EU
                                        tabUE[indice].creneau.push(objCreneau);
                                    }
                                //If the desired EU does not exist
                                } else {
                                    //Push the new data.
                                    horaire.creneau.push(objCreneau);
                                    tabUE.push(horaire);
                                }
                            }
                        }
                    })
                });
            })
            //change of start and end times from 1/2 hour to hours.
            tabUE.forEach(ue => {
                ue.creneau.forEach(c => {
                    c.heureD = c.heureD/2;
                    //if, after division, the number is not round, subtract 0.2
                    if (c.heureD%1 === 0.5) {
                        c.heureD -= 0.20;
                    }
                    c.heureF = c.heureF/2;
                    if (c.heureF%1 === 0.5) {
                        c.heureF -= 0.20;
                    }
                });
            });

            /** 
             * Retrieves the dates entered by the user and puts them in javascript Date format
             * return dateFin and dateDebut  
             */
            response.dateDebut = response.dateDebut.split(splitDate);
            let jourD = response.dateDebut.shift();
            let moisD = response.dateDebut.shift()-1;
            let anneeD = response.dateDebut.shift();
            let dateDebut = new Date(anneeD, moisD, jourD);
            response.dateFin = response.dateFin.split(splitDate);
            let jourF = response.dateFin.shift();
            let moisF = response.dateFin.shift()-1;
            let anneeF = response.dateFin.shift();
            let dateFin = new Date(anneeF, moisF, jourF);
            let jourFin = dateFin.getDate()
            dateFin.setDate(jourFin+1);

            //if dateDebut is after dateFin, warn the user
            if (dateDebut > dateFin) {
                return logger.error("La date de début ne peux pas être après la date de fin");
            }

            /**
             * store in arrayChoice the list of EU schedules selected
             */
            let arrayChoice = [];
            let arrayNom = [];
            //Foreach UE
            tabUE.forEach(e => {
                let arrayUE = [];
                arrayNom.push(e.nomUE);
                e.creneau.forEach((c, i) => {
                    //preparation for the prompts (asks the user to choose the schedules at which he participate)
                    let title = c.typeCours+ " en salle : "+c.nomSalle+" le "+c.jour+" de "+c.heureD+"h a "+c.heureF+"h";
                    let value = i;
                    let objChoice = {title, value};
                    arrayUE.push(objChoice);
                });
                arrayChoice.push(arrayUE);
            });

            /**
             * Store in the array multi everything for the prompts (type, name ...)
             */
            let multi = [];
            let type = 'multiselect';
            let name;
            let message = "Choisir les créneaux auxquels vous participez pour le cours ";
            let choices;
            arrayChoice.forEach((e, i) => {
                let select = {type, name, message, choices};
                select.name = arrayNom[i];
                select.message += arrayNom[i];
                select.choices = e;
                multi.push(select);
            });
            
            //ask the user to select every schedule in wich he participates and store the answer 
            //store the coresponding index in response2
            const response2 = await prompts (multi);
                    
            /** 
             * Sorts through the EU slots, keeping only those selected by the user
             * return tabIcalendar (same as tabUE but only with the selected schedule).
             */
            let cre = Object.values(response2); 
            let tabIcalendar = tabUE;
            tabUE.forEach((e, i) => {
                let tabSelect = [];
                e.creneau.forEach((c, y) => {
                    //if the schedule index is one of those selected
                    if(cre[i].includes(y)) {

                        /**
                         * change les heures qui étaient en chaine de caractère dans la classe Date
                         */
                            let heureD = new Date(dateDebut);
                            heureD.setHours(c.heureD);
                            //if the time is not round, set the minutes to 30
                            if (c.heureD%1 > 0) {
                                heureD.setMinutes(30);
                            }
                            c.heureD = heureD;
                            
                            let heureF = new Date(dateDebut);
                            heureF.setHours(c.heureF);
                            if (c.heureF%1 > 0) {
                                heureF.setMinutes(30);
                            }
                            c.heureF = heureF;

                        
                        tabSelect.push(c);
                    };
                });
                //replaces all schedules with the selected ones
                tabIcalendar[i].creneau = tabSelect;
            });

            
            /**
             * Beginning of the iCalendar
             */
            const calendar = ical({name : 'agenda UE'});
            let nomJourDebut = getDayOfWeek(dateDebut);

            /** 
             * for each UE in tabIcalendar
             */
            tabIcalendar.forEach(ical => {
                let nomUE = ical.nomUE;

                //for each schedules, in the UE, and while the schedule is between the beginning and ending date, create a new event
                ical.creneau.forEach(c => {                      
                    while (dateDebut < c.heureD && c.heureD < dateFin) {
                        switch (c.jour) {
                            case "Lundi":
                                if (nomJourDebut === 'lundi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Mardi":
                                if (nomJourDebut === 'mardi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Mercredi":
                                if (nomJourDebut === 'mercredi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Jeudi":
                                if (nomJourDebut === 'jeudi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Vendredi":
                                if (nomJourDebut === 'vendredi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Samedi":
                                if (nomJourDebut === 'vendredi') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                            case "Dimanche":
                                if (nomJourDebut === 'dimanche') {
                                    nomJourDebut = "";
                                    creationEvent(c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                } else {
                                    let j = c.jour.toLowerCase();
                                    caseJour(j, c.heureD, c.heureF, c.typeCours, nomUE, c.nomSalle);
                                }
                                break;
                        }
                    };
                });
            });  

            /**
             * function that return a string corresponding to the date enter
             * (lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche)
             * @param {Date} d 
             * @returns {String}
             */
            function getDayOfWeek(d) {
                d = new Date(d).toLocaleDateString('default', {weekday : 'long'});
                return d;
            }


            /**
             * function that create a new event on the calendar
             * 
             * @param {Date} depart 
             * @param {Date} fin 
             * @param {String} type 
             * @param {String} nom 
             * @param {String} salle 
             */
            function creationEvent(depart, fin, type, nom, salle) {
                calendar.createEvent({
                    start : depart,
                    end : fin,
                    summary : type+' de '+nom,
                    desciption : type+" de "+nom+" le Lundi",
                    location : salle
                })
            }

            /**
             * create a new event on the calendar and ad +7 to change the week
             * 
             * @param {Number} jour 
             * @param {Date} depart 
             * @param {Date} fin 
             * @param {String} type 
             * @param {String} nom 
             * @param {String} salle 
             */
            function caseJour(jour, depart, fin, type, nom, salle) {
                let d;
                //while the start date does not correspond to the day of the course, ad +1 day
                while (getDayOfWeek(depart) !== jour) {
                    d = depart.getDate();
                    depart.setDate(d + 1);
                    fin.setDate(d + 1);
                }

                d = depart.getDate();
                let dDebut = new Date(depart.toString());
                let dFin = new Date(fin.toString());
                
                if (dDebut < dateFin) {
                    //call of the function creationEvent
                    creationEvent(dDebut, dFin, type, nom, salle);
                }
                //+7 to change the week.
                depart.setDate(d + 7);
                fin.setDate(d + 7);
            }

            /**
             * Open a local server to download the ics File.
             */
            http.createServer((req, res) => calendar.serve(res))
                .listen(3000, '127.0.0.1', () => {
                    console.log('Server running at http://127.0.0.1:3000/');
                    console.log('Ctrl + c pour fermer');
                    open('http://127.0.0.1:3000/');
                });
        })();
    }

    static actionUeSalle = function({logger, args}){
        let pathdata;
        //Take the first letter of the arugment of the command which is the first letter of the ue name 
        const firstLetter = String(args.ue).substring(0,1);
        //each ue is on the directory depending of the alphabet of the ue name, the switch case give the good directory depending of the first letter of the ue searched for the path
        switch(firstLetter){
            case "A": case "B":
                pathdata = "AB";
                break;
            case "C": case "D":
                pathdata = "CD";
                break;
            case "E": case "F":
                pathdata = "EF";
                break;
            case "G": case "H":
                pathdata = "GH";
                break;
            case "I": case "J":
                pathdata = "IJ";
                break;
            case "K": case "L":
                pathdata = "KL";
                break;
            case "M": case "N":
                pathdata = "MN";
                break;
            case "O": case "P":
                pathdata = "OP";
                break;
            case "Q": case "R":
                pathdata = "QR";
                break;
            case "S": case "T":
                pathdata = "ST";
                break;
        };
        //Read the files with the path found, so we don't need read every files but just the file searched
        fs.readFile('./SujetA_data/'+pathdata+'/edt.cru','utf8', function (err,data){

            if (err){
                return logger.warn("UE not found or not exist, please write the ue name with uppercase");
            }
            //need check if the user give a good syntax for the ue name as argument
            const expressionue = /[A-Z]{2,10}[0-9]{0,2}[A-Z]{0,1}[0-9]{0,1}/;
            if (String(args.ue).match(expressionue)){
            //instance of the parser, to get the block of data needed for spec 2
            var analyzer = new parserUeSalle();
            analyzer.parse(data,String(args.ue),2);
            const expressionsalle = /S=[A-Z][0-9]{3}|S=[A-Z]{3}[0-9]|S=[A-Z]{4}/g;
            //if the parser didn't find any information about the ue
            if (typeof analyzer.searched === 'undefined'){ 
                console.log("UE not found on the data base or wrong syntax for the name of the UE");
            } else {
            //selecting each room linked with the ue
            let listesalle = analyzer.searched.match(expressionsalle);
            var listesalleunique = new Set();
            //remove duplicate rooms and the "S="
            listesalle.forEach(element => {
                listesalleunique.add(element.substring(2));
            });
            logger.info("The list of rooms of %s is", args.ue);
            console.log(listesalleunique);
            }
        } else {
            console.log("UE not found because of wrong syntax for the name of the UE");
        }
        })
    }



    static actionCapacity = function({logger, args}){
        let allData;
        const directoryPath = path.join('.','SujetA_data');

        //searching all the directory on the directory SujetA_data
        fs.readdir(directoryPath, function (err, listpath) {
            if (err) {
                return console.log("Unable to find capacity "+ err);
            } 
            //read every files on the directory SujetA_data and put the content of each file together on allData
            listpath.forEach(function (letterpath) {
                allData += fs.readFileSync('./SujetA_data/'+letterpath+'/edt.cru','utf8');
            })
            //need check if the user give a good syntax for the room name as argument
            const expressionsalle2 = /[A-Z][0-9]{3}|[A-Z]{3}[0-9]|[A-Z]{4}/;
            if (String(args.room).match(expressionsalle2)){
            //instance of the parser, to get the block of data needed for spec 3
            var analyzer2 = new parserUeSalle();
            analyzer2.parse(allData,String(args.room),3);
            const expressioncapacity = /P=[0-9]{1,3}/;
            let capacity = 0;
            let stringcap;
            //if the parser didn't find any information about the room
            if (typeof analyzer2.searched[0] === 'undefined'){ 
                console.log("Room not found on the data base or wrong syntax for the name of the room, please write the room name with uppercase");
            } else {
                //selecting each number of place linked with the room
                analyzer2.searched.forEach(function(cap) {
                    stringcap = cap.match(expressioncapacity);
                    //keeping only the biggest number of place on the variable capacity after removing the "P=" on the string of the capacity and then convert on int to use the math.max which keep the bigger number
                    capacity = Math.max(capacity,parseInt(String(stringcap).substring(2)));
                
                    })
                    logger.info("The max capacity of the room %s is %s", args.room, String(capacity));
                }
            } else {
                console.log("Room not found because of wrong syntax for the name of the room, please write the room name with uppercase");
            }
        });
    }

    static actionManual = function({logger, args}){
        //read readme file and log the content on the terminal
        fs.readFile("./README.txt", 'utf8', function(err, data){
			if(err){
				return logger.warn("Unable to find manual : "+ err);
			}
			
			logger.info(data);
		});
    }

    /**
     * Function that display the schedule of a room in args
     */
    static displaydispo = function({logger, args}){

            //check the args format
            const expressionsalle = /([A-Z][0-9]{3})|([A-Z]{3}[0-9])|([A-Z]{4})/;
            if(!String(args.room).match(expressionsalle))
            {
                console.log("Room error ((ALPHA + 3DIGIT) ou (3ALPHA + DIGIT) ou 4ALPHA)")
                return;
            }

            //get parsed data
            const parseData = new parserGeneral();
            Actions.parseAll(parseData)

            //setup display
            const jour = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
            console.log("Room availability : "+args.room);

            //used if the room isn't found
            let salleExistante = false;

            //browse all rooms and when it find the searched room, browse the days and hours to display his schedule
            parseData.listeSalle.forEach(salle => {
                if (salle.nomSalle == args.room)
                {
                    salleExistante = true;
                    for (let day = 0; day < 7; day++) {
                        console.log(jour[day]);
                        console.log("-----------------------------------------------------------------------------------------------------");
                        console.log("0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18  19  20  21  22  23  24");
                        let listehoraire = "|"
                        for (let hour = 0; hour < 48; hour++) {
                            if (salle.agenda[day][hour] != undefined)
                            {
                                listehoraire += "X|"; 
                            }
                            else{
                                listehoraire += " |"; 
                            }
                        }
                        console.log(listehoraire);
                        console.log("-----------------------------------------------------------------------------------------------------");
                    }
                }    
        })

        //explain the user why nothing is displayed
        if (!salleExistante)
        {
            console.log("This room doesn't exist")
        }
    }

    /**
     * Function that make a percentage from the use of every room.
     * Then create a graph of those percentage and open it on your browser.
     */
     static tauxOccupation(){
        let parser = new parserGeneral();
        Actions.parseAll(parser);

        var dataRecup = {
            values : []
        };

        // get every percentage from every room and addit to a data
        parser.listeSalle.forEach(element => {
            let cpt = 0;
            let nSalle = element.nomSalle
            element.agenda.forEach(tab =>{
                tab.forEach(valeur => {
                    if(valeur != undefined){
                        cpt++;
                    }
                });
            })
            let result = (cpt /(7*48))*100;
            result = result.toFixed(2);
            dataRecup.values.push({NomSalle: nSalle, Pourcentage: result});
            
        });

        // create the VegaLite objet from previous to create a SVG
        var yourVlSpec = {
          $schema: 'https://vega.github.io/schema/vega-lite/v2.0.json',
          description: 'Graphique du taux d\'occupation des salles',
          data: dataRecup,
          mark: 'bar',
          encoding: {
            x: {field: 'NomSalle', type: 'ordinal'},
            y: {field: 'Pourcentage', type: 'quantitative'}
          }
        };
        let vegaspec = lite.compile(yourVlSpec).spec
        var view = new vega.View(vega.parse(vegaspec), {renderer: "none"})
        // create the SVG
        view.toSVG()
          .then(function(svg) {
            app.get('/', function(req, res){
              res.send(svg);
            });
            // open it on a server at http://127.0.0.1:3000/ so that it will open on your browser
            app.listen(3000,"127.0.0.1",()=> {
                open("http://127.0.0.1:3000/");
                console.log("ctrl+C to finsh");
            });
        
          })
          .catch(function(err) { console.error(err); });

          
    }
    /**
     * Function that display the list of rooms available for a day and time-slot
     */
    static viewfreeroom = function({logger, args}){

        //check the args format
        const expressiondate = /[0-3][0-9]\/[0-1][0-9]\/[0-9]{4}/;
        const expressionhour = /[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]/;
        if(!String(args.date).match(expressiondate))
        {
            console.log("Date error (DD/MM/YYYY)")
            return;
        }
        if(!String(args.hour).match(expressionhour))
        {
            console.log("Hour error (HH:MM-HH:MM, 1st hour < 2nd hour)")
            return;
        }

        //get parsed data
        const parseData = new parserGeneral();
        Actions.parseAll(parseData)

        //convert date DD/MM/YYYY to date object
        const chars = args.date.split('/');
        const date1 = new Date(chars[2],chars[1]-1,chars[0]);

        //get the day of week starting by monday
        let weekDay = date1.getDay();
        if (weekDay == 0)
        {
            weekDay = 6
        }
        else{
            weekDay -= 1 
        }
        const jour = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

        //separate the start and the end of the time-slot
        const startend = args.hour.split("-")
        let debut = startend[0].split(":")
        let fin = startend[1].split(":")

        //convert HH:MM to a number of half hour
        let mini = debut[0]*2;
        let max = fin[0]*2;
        if (debut[1] >= 30)
        {
            mini += 1
        }
        if (fin[1] >= 30)
        {
            max += 1
        }
        
        //initiate the list of room displayed
        let roomlist = ""
        let first = true
        parseData.listeSalle.forEach(salle => {
                let dispo = true;
                for (let hour = mini; hour < max; hour++) {
                    //check if the room have something planned during the timeslot
                    if(salle.agenda[weekDay][hour] != undefined)
                    {   
                        dispo = false;
                    }
                }
                if (dispo === true)
                    {    
                        //add the available room to the list and test if this is the first element of the list
                        if(first)
                        {
                            roomlist += "- "+salle.nomSalle 
                            first = false
                        }
                        else 
                        {
                            roomlist += ", "+salle.nomSalle 
                        }
                    }
            })
            if(mini%2 == 1)
            {
                debut[1] = "30";
            }
            else {
                debut[1] = "00"
            }
            if(max%2 == 1)
            {
                fin[1] = "30";
            }
            else {
                fin[1] = "00"
            }
            //display the result of the research
            console.log("List of rooms available on "+jour[weekDay]+" between : "+ debut[0]+":"+debut[1]+" and "+ fin[0]+":"+fin[1]+" (rounded at 30 min)")
             if (mini >= max)
            {
                console.log("Hour error (HH:MM-HH:MM, 1st hour < 2nd hour)")
                return;
            }
            console.log(roomlist)           
}
}

module.exports = Actions;

