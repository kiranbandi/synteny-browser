class LinkGroup {
  ArrayList<Link> links;
  HashMap<Integer,Integer> skips;
  boolean contiguous;

  public LinkGroup() {
    links = new ArrayList<Link>();
    contiguous = false;
  }
}