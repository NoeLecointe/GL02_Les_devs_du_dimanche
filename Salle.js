 class Salle {
    
    /**
     * Create a Salle with a name and initiate a Array of 7 by 48 representing the 7 days in a week and everyday seperated 
     * in 48 * 30 mins. The array is filled with undefined object instead of null so that we can iterate on it.
     * @param  {String} nom
     */
    constructor(nom){
        this.nomSalle = nom,
        this.agenda = Array.apply(null, new Array(7)).map(function(){ return Array.apply(null,new Array(48)); });
        Object.seal(this.agenda);
    }

    /**
     * function to calculate the index of the array corresponding to an hour or hour and a half
     * @param  {String} heure format = "<hours>:<minutes"
     * @returns {Integer} indiceHeure
     */
    calculHeurIndice = function(heure){
        let indiceheure;
        const tabHeureMinute = heure.split(":");
        indiceheure = Number(tabHeureMinute[0]) * 2;
        if(Number(tabHeureMinute[1]) >= 30){
            indiceheure++;
        }
        return indiceheure;
    }
    /**
     * function to add a Creneau at the right place in the Array. 
     * take all param to know where to put it, then place that Creneau in all tab between the start hours and the end hours
     * in the right day tab.
     * for exemple if we got jour = MA, debut = 13:00, fin = 14h30
     * Then we will add the creneau in all cell between Array[1][26] and Array[1][29]
     * @param  {String} jour format  = /L|MA|ME|J|V|S|D/
     * @param  {String} debut format = "<hours>:<minutes"
     * @param  {String} fin format = "<hours>:<minutes"
     * @param  {Creneau} creneau
     */
    addCreneau = function(jour, debut, fin, creneau){
        // switch to translate the day acronym in the first index of our array
        let indiceJour;
        switch(jour){
            case "L":
                indiceJour = 0;
                break;
            case "MA":
                indiceJour = 1;
                break;
            case "ME":
                indiceJour = 2;
                break;
            case "J":
                indiceJour = 3;
                break;
            case "V":
                indiceJour = 4;
                break;
            case "S":
                indiceJour = 5;
                break;
            case "D":
                indiceJour = 6;
                break;
            default:
                indiceJour = -1;
                break;
        }
        
        let indiceDebut = this.calculHeurIndice(debut);
        let indiceFin = this.calculHeurIndice(fin);
        // add creneau to all cell of our array between the starting hours of the classes to the end of it
        let dispo = true;
        for(let i = indiceDebut; i< indiceFin; i++){
            if(this.agenda[indiceJour][i] != undefined){
                dispo = false;
                break;
            }
        }
        if(dispo){
            for(let i = indiceDebut; i< indiceFin; i++){
                this.agenda[indiceJour][i] = creneau;
            }
        }

        
    }
}

module.exports = Salle;
