var Genome = function (newRegions, nick) {
    this.regions = newRegions; // map of regions with string type keys
    this.nickname = nick;
    this.chromosomes = new Map(); // map of chromosome objects with the keys being 1 2 3 .. (numerical)
    this.totalLength = -1;

    // Keeping functions locally instead of attaching them to prototype 
    // because mapping them to webworkers while passing scope is causing an error 
    // since paralleljs's implementation of copying functions to web worker's scope skips the functions that are attached to the functions prototype

    this.summary = function () {
        if (this.chromosomes.size == 0) {
            this.calculateChromosomeStarts();
        }
        console.log("Genome: " + this.nickname);
        console.log("Number of regions: " + this.regions.size);
        console.log("Chromosome starts:");
        for (var key of this.chromosomes.keys()) {
            console.log(key + ": " + this.chromosomes.get(key).genomeStart);
        }
    };

    this.calculateChromosomeStarts = function () {
        var c = {},
            prevC = {};

        for (var r of this.regions.values()) {
            var chrom = r.chromosome;
            var start = r.start;
            var end = r.end;
            if (!this.chromosomes.has(chrom)) {
                //Chromosome import is passed in locally to the webworker where Genome is instantiated
                this.chromosomes.set(chrom, new ChromosomeImport(chrom));
            }
            c = this.chromosomes.get(chrom);
            if (c.localEnd < end) {
                c.localEnd = end;
            }
        }
        c = this.chromosomes.get(1);
        c.genomeStart = 0;
        c.genomeEnd = c.localEnd;

        for (var i = 2; i <= this.chromosomes.size; i++) {
            c = this.chromosomes.get(i);
            prevC = this.chromosomes.get(i - 1);
            c.genomeStart = prevC.genomeEnd + 1;
            c.genomeEnd = prevC.genomeEnd + c.localEnd;
        }

        // set length of entire genome
        this.totalLength = this.chromosomes.get(this.chromosomes.size).genomeEnd;
        console.log(this.totalLength);

    };
};

export default Genome;