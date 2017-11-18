import p5 from 'p5';
import axios from 'axios';
import getGenomes from './getGenomes';
import progressBar from './progressBar';
import Parallel from './parallel';
import getLinks from './getLinks';
import findGroups from './findGroups';

var pContext,
    graphicsBuffer,
    verticalGraphicsBuffer,
    dotGraphicsBuffer,
    links = [],
    connections = [],
    linkGroups1 = [],
    linkGroups2 = [],
    lightColors = [],
    darkColors = [],
    flipColors = [],
    controls = [],
    genomes = [],
    scaleLC = 950000.0 * 2,
    scaleMT = 200000.0 * 2,
    scaleCA = 190000.0 * 2,
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
        darkColors = [p.color(255, 0, 0, 255), p.color(200, 110, 0, 255), p.color(255, 255, 0, 255), p.color(0, 255, 0, 255), p.color(0, 200, 255, 255), p.color(0, 0, 255, 255), p.color(200, 0, 200, 255), p.color(0)];
        flipColors = [p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150), p.color(100), p.color(150)];

        p.createCanvas(2000, 2200);
        graphicsBuffer = p.createGraphics(2000, 2200);
        verticalGraphicsBuffer = p.createGraphics(1000, 2200);
        dotGraphicsBuffer = p.createGraphics(2000, 2200);

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
                getLinks(genomes[0], genomes[1], linkGroups1, connections, 9, 7);
                findGroups(linkGroups1);
                getLinks(genomes[0], genomes[2], linkGroups2, connections, 11, 12);
                findGroups(linkGroups2);
                progressBar.animate(0.75);
                generateCanvasPlots();
            })
        })).catch(loadFileErrorCallback);

    };
};

function loadFileErrorCallback(error) {
    console.log(error);
    console.log("There was an error loading the required files , please try again");
}

function generateCanvasPlots() {
    window.setTimeout(function () {
        //Generating canvas plots for each type  

        //Horizontal Buffer 
        graphicsBuffer.clear();
        drawLinks(linkGroups1, 100, 300, "Lc", "Mt", scaleLC, scaleMT, false);
        drawLinks(linkGroups2, 700, 900, "Lc", "Ca", scaleLC, scaleCA, false);
        drawLinks(linkGroups1, 400, 600, "Lc", "Mt", scaleLC, scaleMT, true);
        drawLinks(linkGroups2, 1000, 1200, "Lc", "Ca", scaleLC, scaleCA, true);
        drawChromosomeMarkers();

        //Vertical Buffer
        verticalGraphicsBuffer.clear();
        drawVerticalLinks(linkGroups1, 255, 460, "Lc", "Mt", scaleLC, scaleMT, false);
        drawVerticalChromosomeMarkers();

        // Dot Plot Graphics Buffer
        generateDotPlot(linkGroups1, 100, "Lc", "Mt", scaleLC, scaleMT);
        generateDotPlot(linkGroups2, 700, "Lc", "Ca", scaleLC, scaleCA);

        progressBar.animate(1);
        window.setTimeout(function () {
            document.getElementById('progressBarContainer').style.display = 'none';
            document.getElementById('chartLabel').style.display = 'block';
            document.getElementById('buttonContainer').style.display = 'block';
            document.getElementById('button-horizontal').addEventListener("click", horizontalPlot);
            document.getElementById('button-vertical').addEventListener("click", verticalPlot);
            document.getElementById('button-dot').addEventListener("click", dotPlot);
        }, 1500);
    }, 1500);

}


function horizontalPlot() {
    pContext.clear();
    pContext.image(graphicsBuffer, 300, 0);
}

function verticalPlot() {
    pContext.clear();
    alert("This part is still under construction , in future a user should be able to select a specific set of chromosomes");
    pContext.image(verticalGraphicsBuffer, 300, 0);
}

function dotPlot() {
    pContext.clear();
    pContext.image(dotGraphicsBuffer, 300, 0);
}


function generateDotPlot(linkGroups, yOffeset, labelX, labelY, scale1, scale2) {

    var linkGroup,
        link,
        sourceX,
        targetX,
        sourceC,
        targetC;

    dotGraphicsBuffer.strokeWeight(2);
    scale1 = scale1 * 2;
    scale2 = scale2 * 2;

    for (var lgIndex = 0; lgIndex < linkGroups.length; lgIndex++) {
        linkGroup = linkGroups[lgIndex];
        for (var linkIndex = 0; linkIndex < linkGroup.links.length; linkIndex++) {
            link = linkGroup.links[linkIndex];
            sourceC = link.g1.chromosomes.get(link.source.chromosome);
            targetC = link.g2.chromosomes.get(link.target.chromosome);
            sourceX = (sourceC.genomeStart + link.source.start) / scale1;
            targetX = (targetC.genomeStart + link.target.start) / scale2;
            dotGraphicsBuffer.stroke(darkColors[link.source.chromosome - 1]);
            dotGraphicsBuffer.point(250 + sourceX, yOffeset + targetX);
        }
    }
    dotGraphicsBuffer.stroke(0);
    dotGraphicsBuffer.strokeWeight(3);
    dotGraphicsBuffer.line(250, yOffeset - 5, 730, yOffeset - 5); // X axis
    dotGraphicsBuffer.line(250, yOffeset + 480, 250, yOffeset - 5); // y axis

    dotGraphicsBuffer.textSize(25);
    dotGraphicsBuffer.fill(0);
    dotGraphicsBuffer.strokeWeight(1);
    dotGraphicsBuffer.text(labelX, 475, yOffeset - 20);
    dotGraphicsBuffer.text(labelY, 200, yOffeset + 250);

}


// Last flag is a boolean indicating if we have to draw only contiguous groups      
function drawLinks(linkGroups, top, bottom, labelTop, labelBottom, scale1, scale2, ifContiguousGroup) {
    var linkGroup,
        link,
        sourceX,
        targetX,
        sourceC,
        targetC,
        colorArray = ifContiguousGroup ? darkColors : lightColors;

    for (var lgIndex = 0; lgIndex < linkGroups.length; lgIndex++) {
        linkGroup = linkGroups[lgIndex];
        if (linkGroup.contiguous || !ifContiguousGroup) {
            for (var linkIndex = 0; linkIndex < linkGroup.links.length; linkIndex++) {
                link = linkGroup.links[linkIndex];
                sourceC = link.g1.chromosomes.get(link.source.chromosome);
                targetC = link.g2.chromosomes.get(link.target.chromosome);
                sourceX = (sourceC.genomeStart + link.source.start) / scale1;
                targetX = (targetC.genomeStart + link.target.start) / scale2;
                graphicsBuffer.stroke(colorArray[link.source.chromosome - 1]);
                graphicsBuffer.line(50 + sourceX, top, 50 + targetX, bottom);
            }
        }
    }

    graphicsBuffer.textSize(25);
    graphicsBuffer.fill(0);
    graphicsBuffer.textAlign(graphicsBuffer.LEFT, graphicsBuffer.CENTER);
    graphicsBuffer.text(labelTop, 5, top - 5);
    graphicsBuffer.text(labelBottom, 5, bottom - 5);
    graphicsBuffer.stroke(0);

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
        graphicsBuffer.stroke(darkColors[c.id - 1]);
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
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 80);
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 380);
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 680);
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 980);

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
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 321);
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 621);
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
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 921);
        graphicsBuffer.text('Chr ' + c.id, 15 + ((endX + startX) / 2), 1221);
    };
}

function drawVerticalLinks(linkGroups, left, right, labelLeft, labelRight, scale1, scale2, ) {
    var linkGroup,
        link,
        sourceY,
        targetY,
        sourceC,
        targetC,
        sourceGap,
        targetGap;

    var sourceList = [1, 7],
        targetList = [1, 2, 3, 4, 5, 6, 7, 8];

    verticalGraphicsBuffer.strokeWeight(1);

    for (var lgIndex = 0; lgIndex < linkGroups.length; lgIndex++) {
        linkGroup = linkGroups[lgIndex];
        for (var linkIndex = 0; linkIndex < linkGroup.links.length; linkIndex++) {
            link = linkGroup.links[linkIndex];
            if (sourceList.indexOf(link.source.chromosome) > -1 && targetList.indexOf(link.target.chromosome) > -1) {
                sourceGap = 20 * (link.source.chromosome - 1);
                targetGap = 20 * (link.target.chromosome - 1);
                sourceC = link.g1.chromosomes.get(link.source.chromosome);
                targetC = link.g2.chromosomes.get(link.target.chromosome);
                sourceY = (sourceC.genomeStart + link.source.start) / scale1;
                targetY = (targetC.genomeStart + link.target.start) / scale2;
                verticalGraphicsBuffer.stroke(lightColors[link.source.chromosome - 1]);
                verticalGraphicsBuffer.line(left, 100 + sourceY + sourceGap, right, 100 + targetY + targetGap);
            }
        }
    }

    verticalGraphicsBuffer.textSize(25);
    verticalGraphicsBuffer.stroke(0);
    verticalGraphicsBuffer.fill(0);
    verticalGraphicsBuffer.textAlign(verticalGraphicsBuffer.LEFT, verticalGraphicsBuffer.CENTER);
    verticalGraphicsBuffer.text(labelLeft + " (only 1 & 7)", left - 5, 50);
    verticalGraphicsBuffer.text(labelRight, right - 5, 50);

}

function drawVerticalChromosomeMarkers() {
    var startY, endY, c, gap;
    // hack, Lc is genome 0, Mt is genome 1, Ca is genome 2
    var lc = genomes[0];
    var mt = genomes[1];
    var ca = genomes[2];

    // Repeating line strokes twice to darken the color of the bands -- Need to work on an alternate for this !!

    for (var c of lc.chromosomes.values()) {
        startY = c.genomeStart / scaleLC;
        endY = c.genomeEnd / scaleLC;
        gap = 20 * (c.id - 1);
        verticalGraphicsBuffer.stroke(darkColors[c.id - 1]);
        verticalGraphicsBuffer.strokeWeight(10);
        verticalGraphicsBuffer.strokeCap(verticalGraphicsBuffer.ROUND);
        verticalGraphicsBuffer.line(250, 100 + startY + gap, 250, 100 + endY + gap);
        // making chromosome number markers 
        verticalGraphicsBuffer.strokeWeight(1);
        verticalGraphicsBuffer.textSize(20);
        verticalGraphicsBuffer.stroke(0);
        verticalGraphicsBuffer.text('Chr ' + c.id, 185, 100 + ((startY + endY) / 2) + gap);
    }

    for (var c of mt.chromosomes.values()) {
        startY = c.genomeStart / scaleMT;
        endY = c.genomeEnd / scaleMT;
        gap = 20 * (c.id - 1);
        verticalGraphicsBuffer.stroke(flipColors[c.id - 1]);
        verticalGraphicsBuffer.strokeWeight(10);
        verticalGraphicsBuffer.strokeCap(verticalGraphicsBuffer.ROUND);
        verticalGraphicsBuffer.line(461, 100 + startY + gap, 461, 100 + endY + gap);

        // making chromosome number markers 
        verticalGraphicsBuffer.strokeWeight(1);
        verticalGraphicsBuffer.textSize(20);
        verticalGraphicsBuffer.stroke(0);
        verticalGraphicsBuffer.text('Chr ' + c.id, 475, 100 + ((startY + endY) / 2) + gap);

    }
}



new p5(sketch.bind(this), document.getElementById("root"));