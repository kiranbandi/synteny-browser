class Region implements Comparable {
  int chromosome;
  int start;
  int end;
  String id;
  int ordinal;

  public Region(int newChrom, int newStart, int newEnd, String newID, int newOrd) {
    chromosome = newChrom;
    start = newStart;
    end = newEnd;
    id = newID;
    ordinal = newOrd;
  }

  public int compareTo(Object o) {
    Region r = (Region)o;
    if (this.start == r.start) {
      return 0;
    } else if (this.start < r.start) {
      return -1;
    } else {
      return 1;
    }
  }
}