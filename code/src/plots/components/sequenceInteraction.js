import { svg2element, html2element } from "../../support/helpers.js";
import { spearman } from "../../support/statistics.js";


let template = `<g>
  <path d="" stroke="magenta" stroke-width="40" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity="0.5"></path>
  <rect width="400" height="400" fill="white" opacity="0.01"></rect>
</g>`;





export default class sequenceInteraction{
  
  points = []
  circles = []
  
  constructor(){
	let obj = this;
	
	obj.node = svg2element(template);
	obj.nodescores = html2element( `<table style="margin: 10px 10px 10px 10px;"></table>` );
	
	obj.rect = obj.node.querySelector("rect");
	obj.path = obj.node.querySelector("path");
	
	let drawing = false;
	obj.rect.onmousedown = function(){
		obj.points = [];
		drawing = true;
		obj.update();
	} // onmousedown
	
	obj.rect.onmousemove = function(e){
		if(drawing){
			
			let r = obj.node.getBoundingClientRect();
						
			obj.points.push([
			  e.clientX - r.x,
			  e.clientY - r.y
			])
			
			obj.update();
			
		} // if
	} // onmousemove
	
	

	function enddraw(){
		if(drawing){
			drawing = false;
			obj.updateScores();
		} // if
	} // enddraw

	obj.rect.onmouseup = enddraw;
	obj.rect.onmouseout = enddraw;
	
	
  } // constructor

  update(){
	let obj = this;
	 
	let d = ``;
	if(obj.points.length>0){
		d += `M${obj.points[0][0]},${obj.points[0][1]}`;
		for(let i=1; i<obj.points.length; i++){
			d += ` L${obj.points[i][0]},${obj.points[i][1]}`;
		} //for
	} // if
	
	
	obj.path.setAttribute("d", d)
	  
  } // update





  updateScores(){
	let obj = this;
	
	
	// First remove all children.
	while(obj.nodescores.firstChild){
		obj.nodescores.removeChild(obj.nodescores.firstChild);
	} // while
	
	
	// calculate the scores;
	let scores = obj.calculateCorrelations();
	
	
	// Now create the entries:
	for(let i=0; i<scores.length; i++){
		obj.nodescores.appendChild( html2element(`<tr>
		    <td>${scores[i].name}</td>
			<td>${scores[i].score.toLocaleString()}</td>
		</tr>`) );
	} // for
	//  style="padding-left: 8px;"
	
  } // updateScores



  calculateSequence(){
	// This just draws the path, but it has no idea of hte underlying data. So where and how do I join these?
	// This doesn't even have access to the original data. So myabe these should be passed in? Or this should be handled outside? Or the points need to be passed in...
	let obj = this;
	
	
	
	// First find all hte circles of interest. For now just highlight them into a new color.
	let selected = [];
	for(let ic=0; ic<obj.circles.length; ic++){
	
	    // Get the circle coordinates.
		let c = [ 
		    obj.circles[ic].getAttribute("cx"), 
			obj.circles[ic].getAttribute("cy")
		]; // cp
		
		
		// Find the closest point.
		let min_d = 400;
		let min_i = -1;
		for(let ip=0; ip<obj.points.length; ip++){
			let p = obj.points[ip];
			
			let d = (p[0]-c[0])**2 + (p[1]-c[1])**2;
			if(d < min_d){
				min_i = ip;
				min_d = d;
			}; // if			
		} // for
		
		// If a correct index was found, then push the circle.
		if(min_i > -1){
			selected.push({
				node: obj.circles[ic],
				i_sequence: min_i
			}) // push
		} // if		
		
	} // for
	
	
	return selected
	
  } // calculateSequence
  
  
  calculateCorrelations(){
	let obj = this;
	  
	// Selected is a series of node-value combinations. Node has the data object available under __data__. So now we need to calculate the ordinal and categorical correlations.
	let selected = obj.calculateSequence();
	  
	  
	let ordinals = [
		"alpha_rel_rotor_in",
		"alpha_rel_rotor_out",
		"alpha_rel_stator_in",
		"alpha_rel_stator_out",
		"alpha_rotor_in",
		"alpha_rotor_out",
		"alpha_stator_in",
		"alpha_stator_out",
		"eff_isen",
		"eff_isen_lost_rotor_in",
		"eff_isen_lost_rotor_out",
		"eff_isen_lost_stator_in",
		"eff_isen_lost_stator_out",
		"eff_poly",
		"flow_coefficient",
		"stage_loading"
	]
	  
	  
	let scores = ordinals.map(ordinalname=>{
		let ordinal = selected.map(circle=>circle.node.__data__[ordinalname]);
		let sequence = selected.map(circle=>circle.i_sequence);
		
		return {
			name: ordinalname,
			score: spearman( sequence, ordinal )
		} // return
	}) // map
	  
	  
	return scores.sort(function(a, b){return Math.abs(b.score)-Math.abs(a.score)})
	
	  
  } // calculateCorrelations
  
  
  
  


} // sequenceInteraction