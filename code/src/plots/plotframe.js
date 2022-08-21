import {html2element} from "../support/helpers.js";


// Maybe move the width and height from the CSS into here?
import {css} from "./components/css.js";



// Even if the actual drawing is on a canvas the axes will still be drawn on an svg. Maybe just place the svg in the background? How should the interaction to change the space look like? The variables on hte axis also need to be changeable.
let template = `
	<div style="${ css.card }">
		<div class="card-header" style="${css.cardHeader}">
			<input class="card-title" spellcheck="false"  style="${css.plotTitle}" value="New Plot">
		</div>
		
		<div class="card-body">
		
		</div>
	</div>
`; // template



export default class plotframe {
	constructor(){
		let obj = this;
		
		obj.node = html2element(template);
		
	} // constructor	
}; // plotframe







