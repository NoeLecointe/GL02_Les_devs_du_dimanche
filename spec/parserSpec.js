const parser = require('../Parser.js')
const fs = require('fs');

describe("Program testing parser", function(){
	
	beforeAll(function() {
		this.p = new parser();
	});
	
	it("can create a new parser", function(){
		expect(this.p).toBeDefined();
	});

    it("can split and filter data", function(){
        const data = fs.readFileSync('.//SujetA_data/AB/edt.cru','utf8');
        let datasplit = this.p.splitAndFilter(data);
        expect(datasplit[0]).toBe("+AP03");
        expect(datasplit[1]).toBe("1,D1,P=25,H=V 9:00-12:00,F1,S=B103//");
        expect(datasplit[2]).toBe("1,D2,P=24,H=V 13:00-16:00,F1,S=B103//");
    });

    it("can supUVUV", function(){
        const data = ["+UVUV","1234"]
        expect(this.p.supUVUV(data)).toEqual(["1234"]);
    });

    it("can parse", function(){
        const data = fs.readFileSync('.//SujetA_data/AB/edt.cru','utf8');
        this.p.parse(data);
        expect(this.p.listeSalle[0].nomSalle).toBe("B103");
        expect(this.p.listeSalle[1].nomSalle).toBe("P101");
        expect(this.p.listeSalle[2].nomSalle).toBe("S104");

        expect(this.p.listeSalle[0].agenda[4][18].nomUE).toBe("AP03");
    });

     
    



	
	

	
});