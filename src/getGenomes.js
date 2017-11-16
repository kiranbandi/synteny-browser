import Genome from './Genome';
import Region from './Region';
import Chromosome from './Chromosome';
import splitTokens from './splitTokens';
import Parallel from './parallel';

var getGenomeRegions = function (gffData) {

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
        newGenome = {},
        gff = gffData.data,
        nick = gffData.nickName;

    for (var i = 0; i < gff.length; i++) {
        parts = gff[i].split('\t');
        if (parts.length >= 9) {
            chromString = parts[0];
            matchCheck = chromString.match("scaffold|Contig");
            if (matchCheck != null) {
                continue;
            }
            info = parts[8].split(";");
            subParts = splitTokensImport(info[0], "=:;");
            id = subParts[subParts.length - 1];
            chromString = chromString.replace(/[^0-9]/g, "");
            chrom = parseInt(chromString);
            if (chrom > 15) {
                continue;
            }
            regionStart = parseInt(parts[3]);
            regionEnd = parseInt(parts[4]);
            regions.set(id, new RegionImport(chrom, regionStart, regionEnd, id, nextOrdinal++));
        }
    }

    newGenome = new GenomeImport(regions, nick);
    newGenome.summary();
    // Shallow clone of Genome Object for only some keys
    return ['regions', 'nickname', 'chromosomes'].reduce(function (clone, key) {
        clone[key] = newGenome[key];
        return clone;
    }, {});
}

// This function directly returns the promise object to the main thread.

export default function (gffDataArray) {
    var p = new Parallel(gffDataArray)
        .require({
            fn: splitTokens,
            name: 'splitTokensImport'
        }).require({
            fn: Region,
            name: 'RegionImport'
        }).require({
            fn: Genome,
            name: 'GenomeImport'
        })
        .require({
            fn: Chromosome,
            name: 'ChromosomeImport'
        });
    return p.map(getGenomeRegions);
}