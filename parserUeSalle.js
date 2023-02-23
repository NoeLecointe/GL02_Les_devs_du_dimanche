/**
 * parser of the spec 2 and 3 for the command getroom and getcap
 * searched contain the specific usefull block of the files
 */
var parser = function(){
    this.searched;
};
/**
 * This function take as arugument the content of the file, the room or ue searched and the spec number and call the function getlist to get a list of splitted data
 * Then the function will filter this list and keep only the block that contain the "name" like the ue name or room name that the user need find the information
 * Then after the block searched is taken (on target), it will be assigned to searched, which is a String for the spec 2 or a list of string for the spec 3
 * @param {String} data the content of the file or files
 * @param {String} name the ue name for spec 2 if getroom is used, or the room name for spec 3 if getcap is used, both need be on uppercase
 * @param {int} spec the number of the spec (2 or 3)
 */
parser.prototype.parse = function(data, name, spec){
	var tData = this.getlist(data, spec);
	var target = tData.filter((val) => val.match(name));
	if (spec === 2){
		this.searched = target[0];
	} else {
		this.searched = target;
	}
};
/**
 * This fucntion separate the data ( content of the file ) into many block separated with the separator
 * The spec 2 (as argument) separate the data on each "+" so each block is a UE section
 * The spec 3 (as argument) separate the data on each "//" so each block is mostly a line
 * Then each block is assigned on a list and this list is returned
 * @param {String} data the content of the file or files
 * @param {*} spec the number of the spec (2 or 3)
 * @returns data which is a list, each element separate with separator
 */
parser.prototype.getlist = function(data, spec){
	var separator;
	if (spec === 2){
		separator = /\+/;
	} else {
		separator = /\/\//;
	}
	data = data.split(separator);					
	return data;
};

module.exports = parser;
