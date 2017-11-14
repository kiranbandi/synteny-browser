import p5 from 'p5';
import Link from './Link';
import Genome from './Genome';
import LinkGroup from './LinkGroup';

var sketch = function (p) {
    p.setup = function () {
        p.createCanvas(640, 480);
        p.ellipse(50, 50, 80, 80);
    };
};

new p5(sketch, document.getElementById("root"));