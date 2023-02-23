const parserUeSalle = require('../parserUeSalle.js');

describe("Program testing parserUeSalle", function(){
	
	beforeAll(function() {

		this.p = new parserUeSalle();

	});
	
	it("can create a new parser", function(){
		
		expect(this.p).toBeDefined();
		
	});
	
	it("can separate data into a list", function(){
		
		let list = this.p.getlist("GL02//IF14//NF19", 3);
		expect(list).toEqual(["GL02","IF14","NF19"]);
        let list2 = this.p.getlist("GL02+IF14+NF19", 2);
		expect(list2).toEqual(["GL02","IF14","NF19"]);
		
	});

	it("can parse the data", function(){
		
		this.p.parse("GL02// IF14// NF19//", "GL02", 3);
		
		expect(this.p.searched).toEqual(["GL02"]);
		
	});
});