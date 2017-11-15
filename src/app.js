import p5 from 'p5';
import Link from './Link';
import Genome from './Genome';
import Region from './Region';
import LinkGroup from './LinkGroup';
import Chromosome from './Chromosome';
import axios from 'axios';

var pContext,
    links = [],
    linkGroups1 = [],
    linkGroups2 = [],
    lightColors = [],
    darkColors = [],
    flipColors = [],
    controls = [],
    genomes = [],
    scaleLC = 950000.0,
    scaleMT = 210000.0,
    scaleCA = 190000.0;

var sketch = function (p) {
    pContext = p;
    p.setup = function () {

        var i, parts = [],
            genomeFile = '',
            genomeNick = '',
            compareFile = '',
            connections = [],
            gff = [];

        lightColors = [p.color(255, 0, 0, 20), p.color(200, 110, 0, 20), p.color(255, 255, 0, 20), p.color(0, 255, 0, 20), p.color(0, 200, 255, 20), p.color(0, 0, 255, 20), p.color(200, 0, 200, 20), p.color(0)];
        darkColors = [p.color(255, 0, 0, 150), p.color(200, 110, 0, 150), p.color(255, 255, 0, 150), p.color(0, 255, 0, 150), p.color(0, 200, 255, 150), p.color(0, 0, 255, 150), p.color(200, 0, 200, 150), p.color(0)];
        flipColors = [p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150)];

        p.createCanvas(2000, 1600);

        axios.all([axios.get('assets/files/comparative_rbh.txt'),
            axios.get('assets/files/Lens-genes-only.gff3'),
            axios.get('assets/files/Medicago-genes-only.gff3'),
            axios.get('assets/files/Cicer-mRNA-only.gff3')
        ]).then(axios.spread(function (connectionsResponse, lentilsGff, medicagoGff, cicerGff) {

            connections = connectionsResponse.data.split("\n");
            console.log("Size of comparison file: " + connections.length);
            genomes.push(getGenomeRegions(lentilsGff.data.split("\n"), 'Lc'));
            genomes.push(getGenomeRegions(medicagoGff.data.split("\n"), 'Mt'));
            genomes.push(getGenomeRegions(cicerGff.data.split("\n"), 'Ca'));

            drawChromosomeMarkers();
            performGenomicComparision();

        })).catch(loadFileErrorCallback);

    };
};

function loadFileErrorCallback(error) {
    console.log(error);
    console.log("There was an error loading the required files , please try again");
}

function getGenomeRegions(gff, nick) {

    var regions = {},
        starts = {},
        info = [],
        id = '',
        chromString = '',
        chrom = 0,
        regionStart = 0,
        regionEnd = 0,
        parts = [],
        subParts = [],
        matchCheck = [],
        nextOrdinal = 0,
        newGenome = {};

    for (var i = 0; i < gff.length; i++) {
        parts = gff[i].split('\t');
        if (parts.length >= 9) {
            chromString = parts[0];
            matchCheck = chromString.match("scaffold|Contig");
            if (matchCheck != null) {
                continue;
            }
            info = parts[8].split(";");
            subParts = pContext.splitTokens(info[0], "=:;");
            id = subParts[subParts.length - 1];
            chromString = chromString.replace(/[^0-9]/g, "");
            chrom = parseInt(chromString);
            if (chrom > 15) {
                continue;
            }

            regionStart = parseInt(parts[3]);
            regionEnd = parseInt(parts[4]);
            regions[id] = new Region(chrom, regionStart, regionEnd, id, nextOrdinal++);
        }
    }

    newGenome = new Genome(regions, nick);
    newGenome.summary();
    return newGenome;
}


function performGenomicComparision() {

    // getLinks(genomes.get(0), genomes.get(1), linkGroups1, connections, 9, 7);
    // findGroups2(linkGroups1);

    // getLinks(genomes.get(0), genomes.get(2), linkGroups2, connections, 11, 12);
    // findGroups2(linkGroups2);

    // drawLinks(linkGroups1, 100, 300, "Lc", "Mt", scaleLC, scaleMT);
    // drawGroups(linkGroups1, 400, 600, "Lc", "Mt", scaleLC, scaleMT);
    // drawLinks(linkGroups2, 700, 900, "Lc", "Ca", scaleLC, scaleCA);
    // drawGroups(linkGroups2, 1000, 1200, "Lc", "Ca", scaleLC, scaleCA);
    // drawChromosomeMarkers();

}

function drawChromosomeMarkers() {
    var startX, endX, c;

    // hack, Lc is genome 0, Mt is genome 1, Ca is genome 2
    var lc = genomes[0];
    var mt = genomes[1];
    var ca = genomes[2];

    pContext.strokeWeight(10);
    pContext.strokeCap(pContext.SQUARE);

    Object.keys(lc.chromosomes).forEach(function (key) {
        c = lc.chromosomes[key];
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        pContext.stroke(darkColors[c.id - 1]);
        pContext.line(50 + startX, 94, 50 + endX, 94);
        pContext.line(50 + startX, 394, 50 + endX, 394);
        pContext.line(50 + startX, 694, 50 + endX, 694);
        pContext.line(50 + startX, 994, 50 + endX, 994);
    });

    Object.keys(mt.chromosomes).forEach(function (key) {
        c = mt.chromosomes[key];
        startX = (c.genomeStart) / scaleMT;
        endX = (c.genomeEnd) / scaleMT;
        pContext.stroke(flipColors[c.id - 1]);
        pContext.line(50 + startX, 306, 50 + endX, 306);
        pContext.line(50 + startX, 606, 50 + endX, 606);
    });


    Object.keys(lc.chromosomes).forEach(function (key) {
        c = lc.chromosomes[key];
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        pContext.stroke(flipColors[c.id - 1]);
        pContext.line(50 + startX, 906, 50 + endX, 906);
        pContext.line(50 + startX, 1206, 50 + endX, 1206);
    });

    pContext.strokeWeight(1);
}

new p5(sketch.bind(this), document.getElementById("root"));