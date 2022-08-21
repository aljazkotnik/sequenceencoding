import dragDropHandler from "./support/dragDropHandler.js";
import dataStorage from "./support/dataStorage.js";

import scatterplot from "./plots/scatterplot.js";



// The app will always look the same - three side-by-side plots.
// SCATTERPLOT, quasi-CONTOURPLOT (really a lineplot), LINEPLOT
let container = document.getElementById("plotcontainer");


const plots = [];

// Instantiate the data.
var data = new dataStorage();
data.globalupdate = function update(){
	plots.forEach(p=>{
		p.repaint()
	}); // forEach
} // update




let sp = new scatterplot(data);
container.appendChild(sp.node);
sp.update();
plots.push(sp)














// ADD DRAG AND DROP FOR DATA

let dataLoader = new dragDropHandler();
dataLoader.ondragdropped = function(loadeddata){
	// This replaces the 'ondragdropped' function of the data loader, which executes whn the new data becomes available.
	data.settasks(loadeddata);
	
	
	// Load the data in and assign the series.
	sp.updatedata()

	
	data.globalupdate();
} // ondragdropped

// DRAGGING AND DROPPING THE DATA IS A DEVELOPMENT FEATURE.
let dragDropArea = document.getElementsByTagName("body")[0];
dragDropArea.ondrop = (ev)=>{dataLoader.ondrop(ev)};
dragDropArea.ondragover = (ev)=>{dataLoader.ondragover(ev)};

// Dev test dataset.
// dataLoader.loadfiles(["./assets/data/M95A60SC80TC4_psi040A95_t_c_Axt.json"]);