import Link from './Link';
import Genome from './Genome';
import LinkGroup from './LinkGroup';

export default function (p5) {
    this.p5 = p5;
     p5.setup = function () {
        p5.createCanvas(640, 480);
        p5.ellipse(50, 50, 80, 80);
        debugger;
    }.bind(this);
};