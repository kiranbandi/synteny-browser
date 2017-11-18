import Link from './Link';
import LinkGroup from './LinkGroup';

export default function (g1, g2, linkGroups, connections, refColumn, scoreColumn) {
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
            // dont push empty linkgroups
            if (group.links.length > 0) {
                linkGroups.push(group);
            }
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
};