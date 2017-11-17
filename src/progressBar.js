import ProgressBar from 'progressbar.js';

var bar = new ProgressBar.Circle(document.getElementById('progressBarContainer'), {
  color: '#2268a7',
  strokeWidth: 4,
  trailWidth: 4,
  trailColor: '#afafaf',
  easing: 'easeInOut',
  duration: 1500,
  text: {
    autoStyleContainer: false
  },
  from: {
    color: '#4e89bd',
    width: 4
  },
  to: {
    color: '#2268a7',
    width: 4
  },
  // Set default step function for all animate calls
  step: function (state, circle) {
    circle.path.setAttribute('stroke', state.color);
    circle.path.setAttribute('stroke-width', state.width);

    var value = Math.round(circle.value() * 100);

    if (value == 0) {
      circle.setText('Fetching Data...');
    } else if (value == 25) {
      circle.setText('Processing Genes...');
    } else if (value == 50) {
      circle.setText('Forming Links...');
    } else if (value == 75) {
      circle.setText('Generating canvas...');
    } else if (value == 100){
      circle.setText('Plot Ready...');
    }

  }
});

bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
bar.text.style.fontSize = '1.65rem';

export default bar;