import {html2element} from "../../support/helpers.js";

// A custom select menu to facilitate the variable selection in menus.

let variablemenustyle = `
  background-color: white;
  border: 2px solid black;
  border-radius: 5px;
  display: none; 
  position: absolute;
  max-height: 120px;
  overflow-y: auto;
`;

let ulstyle = `
  list-style-type: none;
  font-size: 10px;
  font-weight: bold;
  padding-left: 4px;
  padding-right: 4px;
`;


let template = `
<div class="variable-select-menu" style="${variablemenustyle}">
  <ul style="${ulstyle}">
  </ul>
</div>
`;


// Differentite between an x and a y one.

export default class divSelectMenu{
	variables = []
	current = {
		name: undefined,
		extent: [1, 1]
	}
	
	constructor(axis){
		let obj = this;
		
		obj.node = html2element(template);
		obj.node.onclick = event=>event.stopPropagation();
	} // constructor
	
	
	
	
	update(){
		let obj = this;
		
		// First remove all li.
		let ul = obj.node.querySelector("ul");
		while (ul.lastChild) {
			ul.removeChild(ul.lastChild);
		} // while
		
		
		// Now add in the needed li objects.
		obj.variables.forEach(variable=>{
			let t = `<li class="hover-highlight">${variable.name}</li>`;
			let li = html2element(t);
			ul.appendChild(li);
			
			li.addEventListener("click", event=>{
				// If event propagation is stopped here then additional functionality can't be attached to the menu.
				obj.current = variable;
				obj.hide();
				obj.onselection();
			})
		})
	} // update
	
	
	show(){
		let obj = this;
		obj.node.style.display = "inline-block";
	} // show
	
	hide(){
		let obj = this;
		obj.node.style.display = "none";
	} // hide
	
	onselection(){
		// dummy placeholder
	}
	
} // divSelectMenu




