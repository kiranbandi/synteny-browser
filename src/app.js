import p5 from 'p5';
import Link from './Link';
import Genome from './Genome';
import Region from './Region';
import LinkGroup from './LinkGroup';
import Chromosome from './Chromosome';
import axios from 'axios';
// import progressBar from './progressBar';

var pContext,
    links = [],
    connections = [],
    linkGroups1 = [],
    linkGroups2 = [],
    lightColors = [],
    darkColors = [],
    flipColors = [],
    controls = [],
    genomes = [],
    scaleLC = 950000.0,
    scaleMT = 200000.0,
    scaleCA = 190000.0;

var sketch = function (p) {
    pContext = p;
    p.setup = function () {

        var i, parts = [],
            genomeFile = '',
            genomeNick = '',
            compareFile = '',
            gff = [];

        lightColors = [p.color(255, 0, 0, 20), p.color(200, 110, 0, 20), p.color(255, 255, 0, 20), p.color(0, 255, 0, 20), p.color(0, 200, 255, 20), p.color(0, 0, 255, 20), p.color(200, 0, 200, 20), p.color(0)];
        darkColors = [p.color(255, 0, 0, 150), p.color(200, 110, 0, 150), p.color(255, 255, 0, 150), p.color(0, 255, 0, 150), p.color(0, 200, 255, 150), p.color(0, 0, 255, 150), p.color(200, 0, 200, 150), p.color(0)];
        flipColors = [p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150)];

        p.createCanvas(2000, 1600);

        document.getElementById('loaderText').innerText = 'This might take a couple of minutes ..So please wait ..';

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
            performGenomicComparision();

        })).catch(loadFileErrorCallback);

    };
};

function loadFileErrorCallback(error) {
    console.log(error);
    console.log("There was an error loading the required files , please try again");
}

function getGenomeRegions(gff, nick) {

    var regions = new Map(),
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
            regions.set(id, new Region(chrom, regionStart, regionEnd, id, nextOrdinal++));
        }
    }

    newGenome = new Genome(regions, nick);
    newGenome.summary();
    return newGenome;
}

function performGenomicComparision() {

    getLinks(genomes[0], genomes[1], linkGroups1, connections, 9, 7);
    findGroups2(linkGroups1);
    getLinks(genomes[0], genomes[2], linkGroups2, connections, 11, 12);
    findGroups2(linkGroups2);

    drawLinks(linkGroups1, 100, 300, "Lc", "Mt", scaleLC, scaleMT);
    drawGroups(linkGroups1, 400, 600, "Lc", "Mt", scaleLC, scaleMT);
    drawLinks(linkGroups2, 700, 900, "Lc", "Ca", scaleLC, scaleCA);
    drawGroups(linkGroups2, 1000, 1200, "Lc", "Ca", scaleLC, scaleCA);
    drawChromosomeMarkers();

    document.getElementById('loaderText').innerText = 'Synteny Plot';

}

function getLinks(g1, g2, linkGroups, connections, refColumn, scoreColumn) {
    // assume g1 is the main genome in the connections file, with
    // refColumn the reference to the matching region of g2, and
    // scoreColumn the association strength score out of 100.

    var connection = '',
        parts = [],
        sourceStart = 0,
        sourceEnd = 0,
        targetID = '',
        score = '',
        targetRegion = {},
        sourceRegion = {},
        subParts = [],
        sourceID = '',
        group = new LinkGroup(),
        groupIndex = 0,
        newLink;

    for (var i = 1; i < connections.length - 1; i++) {
        connection = connections[i];
        parts = connection.split('\t');

        sourceStart = parseInt(parts[2]);
        sourceEnd = parseInt(parts[3]);
        targetID = parts[refColumn];
        if (targetID == "NA") {
            // end this link group and start a new one
            linkGroups.push(group);
            group = new LinkGroup();
            continue;
        }
        score = parseFloat(parts[scoreColumn]);
        // get target ID and region
        if (g2.regions.has(targetID)) {
            targetRegion = g2.regions.get(targetID);
        } else {
            // target ID doesnt exist in the current genome
            continue;
        }
        // get source ID and region
        subParts = parts[0].split(".");
        sourceID = subParts[0];
        if (g1.regions.has(sourceID)) {
            sourceRegion = g1.regions.get(sourceID);
        } else {
            // source ID doesnt exist in the current genome
            continue;
        }
        // both regions exist, so create the link
        newLink = new Link(g1, sourceRegion, g2, targetRegion, score, groupIndex);
        group.links.push(newLink);
    }
}

function findGroups2(linkGroups) {

    var startOrd,
        endOrd,
        currOrd,
        skips,
        lg,
        maxSkip = 10,
        contiguous,
        totalSkips,
        skipSize;

    console.log("\n\nIn findGroups2 with linkGroups of size " + linkGroups.length);

    for (var i = 0; i < linkGroups.length; i++) {
        lg = linkGroups[i];
        skips = new Map();
        if (lg.links.length >= 5) {
            startOrd = lg.links[0].target.ordinal;
            endOrd = lg.links[lg.links.length - 1].target.ordinal;
            if (Math.abs((endOrd - startOrd) - lg.links.length - 1) <= 3) {
                contiguous = true;
                totalSkips = 0;
                skipSize;
                for (var j = 0; j < lg.links.length; j++) {
                    currOrd = lg.links[j].target.ordinal;
                    // check match cases
                    if (currOrd == (startOrd + j)) {
                        // match
                    } else if (currOrd > (startOrd + j)) {
                        // a skip has occurred
                        skipSize = currOrd - (startOrd + j);
                        if (skipSize > maxSkip) {
                            contiguous = false;
                        }
                        startOrd += skipSize;
                        totalSkips += skipSize;
                        // add this skip to the map
                        if (skips.has(skipSize)) {
                            skips.set(skipSize, skips.get(skipSize) + 1);
                        } else {
                            skips.set(skipSize, 1);
                        }
                    } else if (currOrd < (startOrd + j)) {
                        // a negative skip has occurred
                        // convert above to abs() and have just one case for both + and - skips?
                        // except that -ve skips have to go back beyond the start of the group...
                        skipSize = currOrd - (startOrd + j);
                        if (Math.abs(skipSize) > maxSkip) {
                            contiguous = false;
                        }
                        totalSkips += Math.abs(skipSize);
                        // add this skip to the map
                        if (skips.has(skipSize)) {
                            skips.set(skipSize, skips.get(skipSize) + 1);
                        } else {
                            skips.set(skipSize, 1);
                        }
                    }
                }
                if (contiguous) {
                    lg.skips = skips;
                    lg.contiguous = true;
                }
            }
        }
    }
}


function drawLinks(linkGroups, top, bottom, labelTop, labelBottom, scale1, scale2) {

    var linkGroup,
        link,
        sourceX,
        targetX,
        sourceC,
        targetC;

    for (var lgIndex = 0; lgIndex < linkGroups.length; lgIndex++) {
        linkGroup = linkGroups[lgIndex];
        for (var linkIndex = 0; linkIndex < linkGroup.links.length; linkIndex++) {
            link = linkGroup.links[linkIndex];
            sourceC = link.g1.chromosomes.get(link.source.chromosome);
            targetC = link.g2.chromosomes.get(link.target.chromosome);
            sourceX = (sourceC.genomeStart + link.source.start) / scale1;
            targetX = (targetC.genomeStart + link.target.start) / scale2;
            pContext.stroke(lightColors[link.source.chromosome - 1]);
            pContext.line(50 + sourceX, top, 50 + targetX, bottom);
        }
    }

    pContext.textSize(32);
    pContext.fill(0);
    pContext.textAlign(pContext.LEFT, pContext.CENTER);
    pContext.text(labelTop, 5, top - 5);
    pContext.text(labelBottom, 5, bottom - 5);
    pContext.stroke(0);
    pContext.line(50, top, 2000, top);
    pContext.line(50, bottom, 2000, bottom);
}

function drawGroups(linkGroups, top, bottom, labelTop, labelBottom, scale1, scale2) {

    var linkGroup,
        link,
        sourceX,
        targetX,
        sourceC,
        targetC;

    for (var lgIndex = 0; lgIndex < linkGroups.length; lgIndex++) {
        linkGroup = linkGroups[lgIndex];
        if (linkGroup.contiguous) {
            for (var linkIndex = 0; linkIndex < linkGroup.links.length; linkIndex++) {
                link = linkGroup.links[linkIndex];
                sourceC = link.g1.chromosomes.get(link.source.chromosome);
                targetC = link.g2.chromosomes.get(link.target.chromosome);
                sourceX = (sourceC.genomeStart + link.source.start) / scale1;
                targetX = (targetC.genomeStart + link.target.start) / scale2;
                pContext.stroke(darkColors[link.source.chromosome - 1]);
                pContext.line(50 + sourceX, top, 50 + targetX, bottom);
            }
        }
    }
    pContext.textSize(32);
    pContext.fill(0);
    pContext.textAlign(pContext.LEFT, pContext.CENTER);
    pContext.text(labelTop, 5, top - 5);
    pContext.text(labelBottom, 5, bottom - 5);
    pContext.stroke(0);
    pContext.line(50, top, 2000, top);
    pContext.line(50, bottom, 2000, bottom);
}

function drawChromosomeMarkers() {
    var startX, endX, c;

    // hack, Lc is genome 0, Mt is genome 1, Ca is genome 2
    var lc = genomes[0];
    var mt = genomes[1];
    var ca = genomes[2];

    pContext.strokeWeight(10);
    pContext.strokeCap(pContext.SQUARE);

    // Repeating line strokes twice to darken the color of the bands -- Need to work on an alternate for this !!

    for (var c of lc.chromosomes.values()) {
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        pContext.stroke(darkColors[c.id - 1]);
        pContext.line(50 + startX, 94, 50 + endX, 94);
        pContext.line(50 + startX, 394, 50 + endX, 394);
        pContext.line(50 + startX, 694, 50 + endX, 694);
        pContext.line(50 + startX, 994, 50 + endX, 994);

        pContext.line(50 + startX, 94, 50 + endX, 94);
        pContext.line(50 + startX, 394, 50 + endX, 394);
        pContext.line(50 + startX, 694, 50 + endX, 694);
        pContext.line(50 + startX, 994, 50 + endX, 994);

    }

    for (var c of mt.chromosomes.values()) {
        startX = (c.genomeStart) / scaleMT;
        endX = (c.genomeEnd) / scaleMT;
        pContext.stroke(flipColors[c.id - 1]);
        pContext.line(50 + startX, 306, 50 + endX, 306);
        pContext.line(50 + startX, 606, 50 + endX, 606);

        pContext.line(50 + startX, 306, 50 + endX, 306);
        pContext.line(50 + startX, 606, 50 + endX, 606);
    };


    for (var c of lc.chromosomes.values()) {
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        pContext.stroke(flipColors[c.id - 1]);
        pContext.line(50 + startX, 906, 50 + endX, 906);
        pContext.line(50 + startX, 1206, 50 + endX, 1206);

        pContext.line(50 + startX, 906, 50 + endX, 906);
        pContext.line(50 + startX, 1206, 50 + endX, 1206);
    };

    pContext.strokeWeight(1);
}

new p5(sketch.bind(this), document.getElementById("root"));