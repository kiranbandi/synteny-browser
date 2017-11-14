import Chromosome from './Chromosome';

var Genome = function (newRegions, nick) {
    this.regions = newRegions; // collection of regions with string type keys
    this.nickname = nick;
    this.chromosomes = {}; // collection of chromosome objects with the keys being 1 2 3 .. (numerical)
    this.totalLength = -1;
};

Genome.prototype.summary = function () {
    if (Object.keys(this.chromosomes).length == 0) {
        calculateChromosomeStarts();
    }
    console.log("Genome: " + this.nickname);
    console.log("Number of regions: " + Object.keys(this.regions).length);
    console.log("Chromosome starts:");
    Object.keys(this.chromosomes).forEach(function (key) {
        console.log(key + ": " + this.chromosomes[key].genomeStart);
    });

};

Genome.prototype.calculateChromosomeStarts = function () {

    Object.keys(this.regions).forEach(function (key) {
        var r = this.regions[key];
        var chrom = r.chromosome;
        var start = r.start;
        var end = r.end;

        if (Object.keys(this.chromosomes).indexOf(chrom) == -1) {
            this.chromosomes[chrom] = new Chromosome(chrom);
        }
        c = this.chromosomes[chrom];
        if (c.localEnd < end) {
            c.localEnd = end;
        }

    });

    this.chromosomes[1].genomeStart = 0;
    this.chromosomes[1].genomeEnd = c.localEnd;

    for (var i = 2; i <= Object.keys(this.chromosomes).length; i++) {
        c = this.chromosomes[i];
        prevC = this.chromosomes[i - 1];
        c.genomeStart = prevC.genomeEnd + 1;
        c.genomeEnd = prevC.genomeEnd + c.localEnd;
    }

    // set length of entire genome
    this.totalLength = this.chromosomes[Object.keys(this.chromosomes).length].genomeEnd;

};

export default Genome;