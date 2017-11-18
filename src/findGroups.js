export default function (linkGroups) {
    var startOrd,
        endOrd,
        currOrd,
        skips,
        lg,
        maxSkip = 10,
        contiguous,
        totalSkips,
        skipSize;

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
};