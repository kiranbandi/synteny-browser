// Replica of existing function in p5.js 
// Had to make replica because the old function was callling p5 to validate the arguments 
// but since this function was being passed in the scope of the web worker ..This would throw an error since p5 is not available the scope of p5

export default function (){
    var d,sqo,sqc,str;
    str = arguments[1];
    if (arguments.length > 1) {
      sqc = /\]/g.exec(str);
      sqo = /\[/g.exec(str);
      if ( sqo && sqc ) {
        str = str.slice(0, sqc.index) + str.slice(sqc.index+1);
        sqo = /\[/g.exec(str);
        str = str.slice(0, sqo.index) + str.slice(sqo.index+1);
        d = new RegExp('[\\['+str+'\\]]','g');
      } else if ( sqc ) {
        str = str.slice(0, sqc.index) + str.slice(sqc.index+1);
        d = new RegExp('[' + str + '\\]]', 'g');
      } else if(sqo) {
        str = str.slice(0, sqo.index) + str.slice(sqo.index+1);
        d = new RegExp('[' + str + '\\[]', 'g');
      } else {
        d = new RegExp('[' + str + ']', 'g');
      }
    } else {
      d = /\s/g;
    }
    return arguments[0].split(d).filter(function(n){return n;});
}