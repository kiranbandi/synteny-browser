import java.util.Map;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.lang.Comparable;

ArrayList<Link> links;
ArrayList<LinkGroup> linkGroups1, linkGroups2;
float LCscale, MTscale;
int[] LCcStarts = {0, 0, 0, 0, 0, 0, 0, 0, 0};
int[] MTcStarts = {0, 0, 0, 0, 0, 0, 0, 0, 0};
color[] lightColors = {color(255, 0, 0, 20), color(200, 110, 0, 20), color(255, 255, 0, 20), color(0, 255, 0, 20), 
  color(0, 200, 255, 20), color(0, 0, 255, 20), color(200, 0, 200, 20), color(0)};
color[] darkColors = {color(255, 0, 0, 150), color(200, 110, 0, 150), color(255, 255, 0, 150), color(0, 255, 0, 150), 
  color(0, 200, 255, 150), color(0, 0, 255, 150), color(200, 0, 200, 150), color(0)};
color[] flipColors = {color(100),color(150),color(100),color(150),color(100),color(150),color(100),color(150),color(100),color(150)};
boolean newFilter = false;
float confidenceThreshold = 0.0;
PImage test;
String[] controls;

ArrayList<Genome> genomes;

ArrayList<PGraphics> frames;

float scaleLC = 950000.0;
float scaleMT = 200000.0;
float scaleCA = 190000.0;

void setup() {
  size(2000, 1600);
  int i;
  String[] parts;
  String compareFile;
  String genomeFile;
  String genomeNick;
  String[] connections = {};
  String[] gff = {};
  links = new ArrayList<Link>();
  linkGroups1 = new ArrayList<LinkGroup>();
  linkGroups2 = new ArrayList<LinkGroup>();
  frames = new ArrayList<PGraphics>();

  genomes = new ArrayList<Genome>();
  
  String updatedDrive = "K:/Fall 2017/Human Computer Interaction/Synteny_Browser/pulse-browser/";

  controls = loadStrings(updatedDrive+"control.txt");
  println(controls);
  // get comparison file from first line
  parts = split(controls[0], '\t');
  if (parts[0].equals("comparison")) {
    compareFile = parts[1];
    connections = loadStrings(updatedDrive+compareFile);
    println("Size of comparison file: " + connections.length);
  } else {
    println("No keyword 'comparison' on first line of control.txt");
    println("Could not load comparison file");
    exit();
  }

  // get and process genome files from next set of lines
  i = 2;
  parts = split(controls[i], '\t');
  genomeNick = parts[0];
  while (!genomeNick.equals("*")) {
    // process current line
    genomeFile = parts[1];
    println(genomeNick, genomeFile);
    gff = loadStrings(updatedDrive+genomeFile);
    genomes.add(getGenomeRegions(gff, genomeNick));
    // look for next line
    i++;
    parts = split(controls[i], '\t');
    genomeNick = parts[0];
  }

  // set chromosome bounds 
  //for (Genome g : genomes) {
  //   setChromosomeBounds(g); 
  //}

  // process genome-genome comparisons
  getLinks(genomes.get(0), genomes.get(1), linkGroups1, connections, 9, 7);
  findGroups2(linkGroups1);

  getLinks(genomes.get(0), genomes.get(2), linkGroups2, connections, 11, 12);
  findGroups2(linkGroups2);

  drawLinks(linkGroups1, 100,300, "Lc", "Mt", scaleLC, scaleMT);
  drawGroups(linkGroups1, 400,600, "Lc", "Mt", scaleLC, scaleMT);
  drawLinks(linkGroups2, 700,900, "Lc", "Ca", scaleLC, scaleCA);
  drawGroups(linkGroups2, 1000,1200, "Lc", "Ca", scaleLC, scaleCA);
  drawChromosomeMarkers();
}

Genome getGenomeRegions(String[] gff, String nick) {
  Genome newGenome;
  HashMap<String, Region> regions;
  HashMap<Integer, Chromosome> starts;
  String[] info;
  String id;
  String chromString;
  int chrom, prevChrom;
  int regionStart, regionEnd;
  int i;
  String[] parts;
  String[] subParts;
  String[] matchCheck;
  Chromosome newChrom;
  int nextOrdinal = 0;

  regions = new HashMap<String, Region>();
  //starts = new HashMap<Integer,Chromosome>();
  regionStart = 0;
  regionEnd = 0;

  prevChrom = 0;
  //starts.add(0);

  for (i = 1; i < gff.length; i++) {
    //for (i = 1; i < 100; i++) {
    //println(gff[i]);

    parts = split(gff[i], '\t');
    if (parts.length >= 9) {  
      chromString = parts[0];
      matchCheck = match(chromString, "scaffold|Contig");
      if (matchCheck != null) {
        continue;
      }

      info = split(parts[8], ";");
      subParts = splitTokens(info[0], "=:;");
      id = subParts[subParts.length-1];
      //println("id: " + id);

      chromString = chromString.replaceAll("[^0-9]", "");
      chrom = Integer.parseInt(chromString);
      if (chrom > 15) {
        continue;
      }
      //println("chromosome: " + chrom);
      if (chrom != prevChrom) {
        newChrom = new Chromosome(chrom);
        //starts.add(starts.get(chrom-1) + regionEnd);
        prevChrom = chrom;
      }
      regionStart = Integer.parseInt(parts[3]);
      regionEnd = Integer.parseInt(parts[4]);
      regions.put(id, new Region(chrom, regionStart, regionEnd, id, nextOrdinal++));
    }
  }

  newGenome = new Genome(regions, nick);
  newGenome.summary();
  return newGenome;
}

void setChromosomeBounds(Genome g) {
  // dead?
}

void getLinks(Genome g1, Genome g2, ArrayList<LinkGroup> linkGroups, String[] connections, int refColumn, int scoreColumn) {
  // assume g1 is the main genome in the connections file, with
  // refColumn the reference to the matching region of g2, and
  // scoreColumn the association strength score out of 100.

  int i;
  String connection;
  String[] parts;
  int sourceStart;
  int sourceEnd;
  String targetID;
  float score;
  Region targetRegion, sourceRegion;
  String[] subParts;
  String sourceID;
  LinkGroup group;
  int groupIndex;

  group = new LinkGroup();
  groupIndex = 0;

  for (i = 1; i < connections.length-1; i++) {
    //for (i = 1; i < 15000; i++) {
    connection = connections[i];
    parts = split(connection, '\t');

    sourceStart = Integer.parseInt(parts[2]);
    sourceEnd = Integer.parseInt(parts[3]);
    targetID = parts[refColumn];
    if (targetID.equals("NA")) {
      // end this link group and start a new one
      linkGroups.add(group);
      group = new LinkGroup();
      continue;
    }
    score = Float.parseFloat(parts[scoreColumn]);

    // get target ID and region
    if (g2.regions.containsKey(targetID)) {
      targetRegion = g2.regions.get(targetID);
    } else {
    //  println("In genome " + g2.nickname + ", target ID " + targetID + " does not exist");
      continue;
    }

    // get source ID and region
    subParts = split(parts[0], ".");
    sourceID = subParts[0];

    if (g1.regions.containsKey(sourceID)) {
      sourceRegion = g1.regions.get(sourceID);
    } else {
   //   println("In genome " + g1.nickname + ", source ID " + sourceID + " does not exist");
      continue;
    }

    // both regions exist, so create the link
    Link newLink = new Link(g1, sourceRegion, g2, targetRegion, score, groupIndex);
    links.add(newLink);
    group.links.add(newLink);
  }
}

void findGroups2(ArrayList<LinkGroup> linkGroups) {
  int startOrd, endOrd, currOrd;
  HashMap<Integer, Integer> skips;
  LinkGroup lg;
  int maxSkip = 10;

  println("\n\nIn findGroups2 with linkGroups of size " + linkGroups.size());
  for (int i = 0; i < linkGroups.size(); i++) {
    lg = linkGroups.get(i);
    skips = new HashMap<Integer, Integer>();
    if (lg.links.size() >= 5) {
      startOrd = lg.links.get(0).target.ordinal;    
      endOrd = lg.links.get(lg.links.size()-1).target.ordinal;    
      if (abs((endOrd-startOrd) - lg.links.size()-1) <= 3) {
        boolean contiguous = true;
        int totalSkips = 0;
        int skipSize;
        for (int j = 0; j < lg.links.size(); j++) {
          currOrd = lg.links.get(j).target.ordinal;
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
            if (skips.containsKey(skipSize)) {
              skips.put(skipSize, skips.get(skipSize)+1);
            } else {
              skips.put(skipSize, 1);
            }
          } else if (currOrd < (startOrd + j)) {
            // a negative skip has occurred
            // convert above to abs() and have just one case for both + and - skips?
            // except that -ve skips have to go back beyond the start of the group...
            skipSize = currOrd - (startOrd + j);
            if (abs(skipSize) > maxSkip) {
              contiguous = false;
            }
            totalSkips += abs(skipSize);
            // add this skip to the map
            if (skips.containsKey(skipSize)) {
              skips.put(skipSize, skips.get(skipSize)+1);
            } else {
              skips.put(skipSize, 1);
            }
          }
        }
        if (contiguous) {
          lg.skips = skips;
          lg.contiguous = true;
          println("-----------------------------");
          println("Link Group " + i);
          for (Link li : lg.links) {
           // println(li.source.id + "  ->  " + li.target.id + "     " + li.source.ordinal + ":" + li.target.ordinal);
          }
          for (Integer k : skips.keySet()) {
            println("\tskips of " + k + ": " + skips.get(k));
          }
        }
      }
    }
  }
}

void drawLinks(ArrayList<LinkGroup> linkGroups, float top, float bottom, String labelTop, String labelBottom, float scale1, float scale2) {
  float sourceX, targetX;
  int i = 0;
  Chromosome sourceC, targetC;
  for (LinkGroup lg : linkGroups) {
    for (Link lk : lg.links) { 
      sourceC = lk.g1.chromosomes.get(lk.source.chromosome);
      targetC = lk.g2.chromosomes.get(lk.target.chromosome);
      sourceX = (sourceC.genomeStart + lk.source.start) / scale1;
      targetX = (targetC.genomeStart + lk.target.start) / scale2;
      //println(lk.source.id + "  ->  " + lk.target.id + "     " + lk.source.ordinal + ":" + lk.target.ordinal + "\t(" + 
      //lk.source.chromosome + ")" + "\t" + sourceX + "->" + targetX);
      stroke(lightColors[lk.source.chromosome-1]);
      line(50+sourceX, top, 50+targetX, bottom);
    }
  }
  textSize(32);
  fill(0);
  textAlign(LEFT, CENTER);
  text(labelTop, 5, top-5);
  text(labelBottom, 5, bottom-5);
  stroke(0);
  line(50, top, 2000, top);
  line(50, bottom, 2000, bottom);
}

void drawGroups(ArrayList<LinkGroup> linkGroups, float top, float bottom, String labelTop, String labelBottom, float scale1, float scale2) {
  float sourceX, targetX;
  int i = 0;
  Chromosome sourceC, targetC;
  for (LinkGroup lg : linkGroups) {
    if (lg.contiguous) {
      //println("Link Group " + i + " (" + lg.contiguous + ")");
      for (Link lk : lg.links) { 
        sourceC = lk.g1.chromosomes.get(lk.source.chromosome);
        targetC = lk.g2.chromosomes.get(lk.target.chromosome);
        sourceX = (sourceC.genomeStart + lk.source.start) / scale1;
        targetX = (targetC.genomeStart + lk.target.start) / scale2;
        //println(lk.source.id + "  ->  " + lk.target.id + "     " + lk.source.ordinal + ":" + lk.target.ordinal + "\t(" + 
          //lk.source.chromosome + ")" + "\t" + sourceX + "->" + targetX);
        stroke(darkColors[lk.source.chromosome-1]);
        line(50+sourceX, top, 50+targetX, bottom);
      }
    }
    i++;
  }
  textSize(32);
  fill(0);
  textAlign(LEFT, CENTER);
  text(labelTop, 5, top-5);
  text(labelBottom, 5, bottom-5);
  stroke(0);
  line(50, top, 2000, top);
  line(50, bottom, 2000, bottom);
}

void drawChromosomeMarkers() {
  float startX, endX;

  // hack, Lc is genome 0, Mt is genome 1, Ca is genome 2
  Genome lc = genomes.get(0);
  Genome mt = genomes.get(1);
  Genome ca = genomes.get(2);

  strokeWeight(10);
  strokeCap(SQUARE);
  for (Chromosome c : lc.chromosomes.values()) {
    startX = c.genomeStart / scaleLC;  
    endX = c.genomeEnd / scaleLC;
    stroke(darkColors[c.id-1]);
    line(50+startX, 94, 50+endX, 94);
    line(50+startX, 94, 50+endX, 94);
    line(50+startX, 394, 50+endX, 394);
    line(50+startX, 394, 50+endX, 394);
    line(50+startX, 694, 50+endX, 694);
    line(50+startX, 694, 50+endX, 694);
    line(50+startX, 994, 50+endX, 994);
    line(50+startX, 994, 50+endX, 994);
  }
  for (Chromosome c : mt.chromosomes.values()) {
    startX = c.genomeStart / scaleMT;  
    endX = c.genomeEnd / scaleMT;
    stroke(flipColors[c.id-1]);
    line(50+startX, 306, 50+endX, 306);
    line(50+startX, 306, 50+endX, 306);
    line(50+startX, 606, 50+endX, 606);
    line(50+startX, 606, 50+endX, 606);
  }
  for (Chromosome c : lc.chromosomes.values()) {
    startX = c.genomeStart / scaleLC;  
    endX = c.genomeEnd / scaleLC;
    stroke(flipColors[c.id-1]);
    line(50+startX, 906, 50+endX, 906);
    line(50+startX, 906, 50+endX, 906);
    line(50+startX, 1206, 50+endX, 1206);
    line(50+startX, 1206, 50+endX, 1206);
  }
  strokeWeight(1);
}