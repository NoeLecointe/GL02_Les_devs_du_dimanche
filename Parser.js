const Salle = require("./Salle");
const Creneau = require('./Creneau.js');



class Parser{
    constructor(){
        this.listeSalle = [];
        this.cptErreur;
    }

    
    /**
     * Function that take the whole data and apply regex to it.
     * These regex will allow us to keep only the lines respecting the ABNF
     * 
     * @param  {String} data // all the line in all the file 
     * @returns {String} // all line respecting the regex
     */
    splitAndFilter = function(data){
        
        const regexCours = /(^\+([A-Z]{2,10}\d{0,2}[A-Z]?\d?)$)|(^1,.*\/\/$)/;
        const separator = /\r\n/;
        data = data.split(separator);
        data = data.filter((val,idx) => val.match(regexCours));
        data = this.supUVUV(data);
        return data;
    }

    
    /**
     * Function that delete the pattern "+UVUV"
     * in the data. 
     * I'm doing it this way because +UVUV respect the regex of the splitAndFilter function
     * 
     * @param  {} data 
     * @returns {String} // same as splitAndFilter() without the +UVUV
     */
    supUVUV = function(data){
        const regex = /\+UVUV/;
        data = data.filter((val,idx) => !val.match(regex));
        return data;
    }

    
    /**
     * This function allow us to get the name of the UE 
     * before calling the parser for each time slot of a UE
     * It also allows to recheck each line thanks to a regex
     * and to throw an error if a line does not respect the ABNF
     * @param  {} data
     */
    parse = function(data){
        const regexUE = /^\+([A-Z]{2,10}\d{0,2}[A-Z]?\d?)$/;
        const regexvaleur = /^1,(T|C|D)\d{1,2},P=\d{1,3},H=((L|MA|ME|J|V|S|D) ((\d|1\d|2[0-4]):(00|30)-(\d|1\d|2[0-4]):(00|30)),([A-Z][A-Z0-9]),S=([A-Z](\d{3}|[A-Z]{2}(\d|[A-Z])))\/)+\/$/
        data = this.splitAndFilter(data);
        let valeurUE = "";
        while(true){
            let valeur = data.shift();
            if(valeur.match(regexUE)){
                valeurUE =  valeur.replace("+", "")
            }
            else if(valeur.match(regexvaleur)){
                this.createCreneau(valeur,valeurUE);
            }
            else{
                console.log("Parsing Error ! on : \""+valeur+"\" -- msg : "+ "value doesn't respect the format");
            }
            if(data.length <= 0){
                break; 
            }
        }  
    }

    
    /** Function create room and time slot.
     * First, the function separates each piece of information in the imput according to "," or "\"
     * Then filter the empty cells of our array and cell corresponding to the separator.
     * 
     * Secondly, each information is shifted in a new variable corresponding to the information,
     * the function also delete useless part like "P="|"H="|"S="
     * With all the information needed, it will look if the room already exist in the array listeSalle[]
     * If not then it will create the room and add it to the array
     * If it already exist, it will store the Salle object in a variable.
     * Finally it will add the timeSlot in the agenda Array of a room
     *
     * If the line contains multiple time slot, then the function  store the new information for this time slot
     * and add it to the corresponding room.
     * 
     * It continue entils the data is empty.
     * 
     * @param  {String} valeurCreneau 
     * @param  {String} nomUE 
     */
    createCreneau = function(valeurCreneau,nomUE){
        const regexSplit = /(,|\/)/
        valeurCreneau = valeurCreneau.split(regexSplit);
        valeurCreneau = valeurCreneau.filter((val) => !val.match(regexSplit)); 
        valeurCreneau = valeurCreneau.filter((val) => !(val == '')); 
        valeurCreneau.shift();
        let typeCours = valeurCreneau.shift();
        let place = valeurCreneau.shift();
        place = place.replace("P=",'');
        let date = valeurCreneau.shift();
        date = date.split(" ");
        let jour = date[0].replace("H=",'');
        let heure = date[1].split("-");
        let debut = heure[0];
        let fin = heure[1];
        let sousGroupe = valeurCreneau.shift();
        let creneau = new Creneau(nomUE,typeCours,place,sousGroupe);
        let nomSalle = valeurCreneau.shift();
        nomSalle = nomSalle.replace("S=","");
        let salle;
        salle = this.listeSalle.find((val) => val.nomSalle == nomSalle);
        if(salle == undefined){
            salle = new Salle(nomSalle);
            this.listeSalle.push(salle);
        }
        salle.addCreneau(jour,debut,fin,creneau);
        while(valeurCreneau.length > 0){
            date = valeurCreneau.shift();
            date = date.split(" ");
            jour = date[0];
            heure = date[1].split("-");
            debut = heure[0];
            fin = heure[1];
            sousGroupe = valeurCreneau.shift();
            creneau = new Creneau(nomUE,typeCours,place,sousGroupe);
            let nomSalle = valeurCreneau.shift();
            nomSalle = nomSalle.replace("S=","");
            salle = this.listeSalle.find((val) => val.nomSalle == nomSalle);
            if(salle == undefined){
                salle = new Salle(nomSalle);
                this.listeSalle.push(salle);
            }
            salle.addCreneau(jour,debut,fin,creneau);
        }
    }
}

module.exports = Parser;




