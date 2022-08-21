export function html2element(html){
  let template = document.createElement('template'); 
  template.innerHTML = html.trim(); // Never return a text node of whitespace as the result
  return template.content.firstChild;
} // html2element

export function svg2element(svg){
  let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.innerHTML = svg.trim();
  return g.firstChild;
} // svg2element



export function calculateExponent(val){
	// calculate the exponent for the scientific notation.
	var exp = 0
	while( Math.floor( Math.abs( val ) / 10**(exp+1) ) > 0 ){ exp+=1 }
	
	// Convert the exponent to multiple of three
	return Math.floor( exp / 3 )*3

} // calculateExponent
