class Genome {
  String nickname;
  HashMap<String, Region> regions;
  //HashMap<Integer, Integer> chromStarts;
  HashMap<Integer, Chromosome> chromosomes;
  int totalLength;

  public Genome(HashMap<String, Region> newRegions, String nick) {
    regions = newRegions;
    //chromStarts = newStarts;
    nickname = nick;
    chromosomes = new HashMap<Integer, Chromosome>();
  }

  void summary() {
    if (chromosomes.size() == 0) {
      calculateChromosomeStarts();
    }
    println("Genome: " + nickname);
    println("Number of regions: " + regions.size());
    println("Chromosome starts:");
    for (int i : chromosomes.keySet()) {
      println(i + ": " + chromosomes.get(i).genomeStart);
    }
    //int i = 0; i < chromStarts.size(); i++) {
    //  println(i + ": " + chromStarts.get(i));
    //}
  }

  void calculateChromosomeStarts() {
    int chrom;
    int start, end;
    Chromosome c, prevC;

    // find local max end for each chrom
    for (Region r : regions.values()) {
      chrom = r.chromosome;
      start = r.start;
      end = r.end;
      if (!chromosomes.containsKey(chrom)) {
        // add
        chromosomes.put(chrom, new Chromosome(chrom));
      }
      c = chromosomes.get(chrom);
      // process endpoint
      if (c.localEnd < end) {
        c.localEnd = end;
      }
    }

    // add from start
    c = chromosomes.get(1);
    c.genomeStart = 0;
    c.genomeEnd = c.localEnd;

    for (int i = 2; i <= chromosomes.size(); i++) {
      c = chromosomes.get(i);
      prevC = chromosomes.get(i-1);
      c.genomeStart = prevC.genomeEnd + 1;
      c.genomeEnd = prevC.genomeEnd + c.localEnd;
    }
    
    // set length of entire genome
    totalLength = chromosomes.get(chromosomes.size()).genomeEnd;
  }
}