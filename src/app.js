import p5 from 'p5';
import Link from './Link';
import LinkGroup from './LinkGroup';
import axios from 'axios';
import getGenomes from './getGenomes';
import progressBar from './progressBar';
import Parallel from './parallel';

var pContext,
    graphicsBuffer,
    links = [],
    connections = [],
    linkGroups1 = [],
    linkGroups2 = [],
    lightColors = [],
    darkColors = [],
    markerColors = [],
    flipColors = [],
    controls = [],
    genomes = [],
    scaleLC = 950000.0,
    scaleMT = 200000.0,
    scaleCA = 190000.0,
    parallelLC,
    parallelMT,
    parallelCA;


var sketch = function (p) {
    pContext = p;
    // optimizing performance and speed 
    pContext.disableFriendlyErrors = true;

    p.setup = function () {

        var i, parts = [],
            genomeFile = '',
            genomeNick = '',
            compareFile = '',
            gff = [];

        lightColors = [p.color(255, 0, 0, 20), p.color(200, 110, 0, 20), p.color(255, 255, 0, 20), p.color(0, 255, 0, 20), p.color(0, 200, 255, 20), p.color(0, 0, 255, 20), p.color(200, 0, 200, 20), p.color(0)];
        darkColors = [p.color(255, 0, 0, 150), p.color(200, 110, 0, 150), p.color(255, 255, 0, 150), p.color(0, 255, 0, 150), p.color(0, 200, 255, 150), p.color(0, 0, 255, 150), p.color(200, 0, 200, 150), p.color(0)];
        markerColors = [p.color(255, 0, 0, 255), p.color(200, 110, 0, 255), p.color(255, 255, 0, 255), p.color(0, 255, 0, 255), p.color(0, 200, 255, 255), p.color(0, 0, 255, 255), p.color(200, 0, 200, 255), p.color(0)];
        flipColors = [p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150)];

        p.createCanvas(2000, 1600);
        graphicsBuffer = p.createGraphics(2000, 1600);
        progressBar.animate(0.0);

        axios.all([axios.get('assets/files/comparative_rbh.txt'),
            axios.get('assets/files/Lens-genes-only.gff3'),
            axios.get('assets/files/Medicago-genes-only.gff3'),
            axios.get('assets/files/Cicer-mRNA-only.gff3')
        ]).then(axios.spread(function (connectionsResponse, lentilsGff, medicagoGff, cicerGff) {

            progressBar.animate(0.25);

            connections = connectionsResponse.data.split("\n");
            console.log("Size of comparison file: " + connections.length);

            getGenomes([{
                'data': lentilsGff.data.split("\n"),
                'nickName': 'Lc'
            }, {
                'data': medicagoGff.data.split("\n"),
                'nickName': 'Mt'
            }, {
                'data': cicerGff.data.split("\n"),
                'nickName': 'Ca'
            }]).then(function (genomicDataArray) {
                genomes = genomicDataArray;
                progressBar.animate(0.50);
                performGenomicComparision();
            })
        })).catch(loadFileErrorCallback);

    };
};

function loadFileErrorCallback(error) {
    console.log(error);
    console.log("There was an error loading the required files , please try again");
}

function performGenomicComparision() {

    getLinks(genomes[0], genomes[1], linkGroups1, connections, 9, 7);
    findGroups2(linkGroups1);
    getLinks(genomes[0], genomes[2], linkGroups2, connections, 11, 12);
    findGroups2(linkGroups2);
    progressBar.animate(0.75);

    window.setTimeout(function () {
        drawLinks(linkGroups1, 100, 300, "Lc", "Mt", scaleLC, scaleMT);
        drawLinks(linkGroups2, 700, 900, "Lc", "Ca", scaleLC, scaleCA);
        drawGroups(linkGroups1, 400, 600, "Lc", "Mt", scaleLC, scaleMT);
        drawGroups(linkGroups2, 1000, 1200, "Lc", "Ca", scaleLC, scaleCA);
        drawChromosomeMarkers();
        pContext.image(graphicsBuffer, 0, 0);
        progressBar.animate(1);
        window.setTimeout(function () {
            document.getElementById('progressBarContainer').style.display = 'none';
        }, 1500);
    }, 1500);

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
            graphicsBuffer.stroke(lightColors[link.source.chromosome - 1]);
            graphicsBuffer.line(50 + sourceX, top, 50 + targetX, bottom);
        }
    }

    graphicsBuffer.textSize(32);
    graphicsBuffer.fill(0);
    graphicsBuffer.textAlign(graphicsBuffer.LEFT, graphicsBuffer.CENTER);
    graphicsBuffer.text(labelTop, 5, top - 5);
    graphicsBuffer.text(labelBottom, 5, bottom - 5);
    graphicsBuffer.stroke(0);
    graphicsBuffer.line(50, top, 2000, top);
    graphicsBuffer.line(50, bottom, 2000, bottom);

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
                graphicsBuffer.stroke(darkColors[link.source.chromosome - 1]);
                graphicsBuffer.line(50 + sourceX, top, 50 + targetX, bottom);
            }
        }
    }
    graphicsBuffer.textSize(32);
    graphicsBuffer.fill(0);
    graphicsBuffer.textAlign(graphicsBuffer.LEFT, graphicsBuffer.CENTER);
    graphicsBuffer.text(labelTop, 5, top - 5);
    graphicsBuffer.text(labelBottom, 5, bottom - 5);
    graphicsBuffer.stroke(0);
    graphicsBuffer.line(50, top, 2000, top);
    graphicsBuffer.line(50, bottom, 2000, bottom);
}

function drawChromosomeMarkers() {
    var startX, endX, c;

    // hack, Lc is genome 0, Mt is genome 1, Ca is genome 2
    var lc = genomes[0];
    var mt = genomes[1];
    var ca = genomes[2];

    // Repeating line strokes twice to darken the color of the bands -- Need to work on an alternate for this !!

    for (var c of lc.chromosomes.values()) {
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        graphicsBuffer.stroke(markerColors[c.id - 1]);
        graphicsBuffer.strokeWeight(10);
        graphicsBuffer.strokeCap(graphicsBuffer.SQUARE);
        graphicsBuffer.line(50 + startX, 95, 50 + endX, 95);
        graphicsBuffer.line(50 + startX, 395, 50 + endX, 395);
        graphicsBuffer.line(50 + startX, 695, 50 + endX, 695);
        graphicsBuffer.line(50 + startX, 995, 50 + endX, 995);
        // making chromosome number markers 
        graphicsBuffer.strokeWeight(1);
        graphicsBuffer.textSize(20);
        graphicsBuffer.stroke(0);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 80);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 380);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 680);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 980);

    }

    for (var c of mt.chromosomes.values()) {
        startX = (c.genomeStart) / scaleMT;
        endX = (c.genomeEnd) / scaleMT;
        graphicsBuffer.stroke(flipColors[c.id - 1]);
        graphicsBuffer.strokeWeight(10);
        graphicsBuffer.strokeCap(graphicsBuffer.SQUARE);
        graphicsBuffer.line(50 + startX, 306, 50 + endX, 306);
        graphicsBuffer.line(50 + startX, 606, 50 + endX, 606);
        // making chromosome number markers 
        graphicsBuffer.strokeWeight(1);
        graphicsBuffer.textSize(20);
        graphicsBuffer.stroke(0);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 321);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 621);
    };

    for (var c of lc.chromosomes.values()) {
        startX = c.genomeStart / scaleLC;
        endX = c.genomeEnd / scaleLC;
        graphicsBuffer.stroke(flipColors[c.id - 1]);
        graphicsBuffer.strokeWeight(10);
        graphicsBuffer.strokeCap(graphicsBuffer.SQUARE);
        graphicsBuffer.line(50 + startX, 906, 50 + endX, 906);
        graphicsBuffer.line(50 + startX, 1206, 50 + endX, 1206);
        // making chromosome number markers 
        graphicsBuffer.strokeWeight(1);
        graphicsBuffer.textSize(20);
        graphicsBuffer.stroke(0);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 921);
        graphicsBuffer.text('Chr ' + c.id, 50 + (endX + startX) / 2, 1221);
    };
    graphicsBuffer.strokeWeight(1);
}

new p5(sketch.bind(this), document.getElementById("root"));