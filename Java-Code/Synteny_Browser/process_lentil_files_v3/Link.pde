class Link {
  
  Region source, target;
  Genome g1, g2;
  float score;
  int group;

  public Link(Genome newG1, Region newSource, Genome newG2, Region newTarget, float newScore, int newGroup) {
    g1 = newG1;
    g2 = newG2;
    source = newSource;
    target = newTarget;
    score = newScore;
    group = newGroup;
  }
  
}