/*
A multipurpose scatterplot inset. This will be a first step towards developing separate `twoplotaxis' inset, and a redering inset that will actually draw.



This one should define all the user interactions it needs. So it needs to know the variables.

Children (scaterplot, line) should have lasso selection. In the case of the line the data comes from the loaded files, and not from hte metadata. So the plot containing them should update them.
*/



/*
Bug: if both axes show the same variable, and one of them is changed to the log space, the one that was not changed will draw at the right location, because it's domain had not been changed accordingly. An autorun could be used to enforce that both are the same, but it would interfere with the dragging.
*/


import {html2element} from "../../support/helpers.js";
import ordinalAxis from "./ordinalAxis.js";


// Zooming is required.
import * as d3 from "d3";




/*
background: elements for background functionality (e.g. zoom rectangle)
data      : primary data representations
markup    : non-primary data graphic markups, (e.g. compressor map chics) 
x/y-axis  : x/y axis elements
exponent  : power exponent (big number labels may overlap otherwise)
*/


let template = `
<div style="position: relative;">
	<svg class="plot-area" width="400" height="400">
		
		<g class="background">
			
			<rect class="zoom-area" fill="rgb(255, 255, 255)" width="400" height="400"></rect>
			
			<g class="tooltip-anchor">
				<circle class="anchor-point" r="1" opacity="0"></circle>
			</g>
		</g>
		
		
		<g class="datum"></g>
		<g class="data"></g>
		<g class="markup"></g>
		<g class="axes"></g>
		
		
	</svg>
	
	<div class="variable-select-menus"></div>
	
</div>
`;


// The axis scale needs to have access to the data and to the svg dimensions. Actually not access to the data, but access to the data extent. This has been solved by adding calculated extents to the variable objects.


// It's best to just pass all the variables to the axis, and let it handle everything connected to it. 


// This class is a template for two interactive axes svg based plotting.


// Handle the variable changing here!!!

export default class twoInteractiveAxesInset{
	
	
	// Add some padding to the plot??
	
	
	// The width and height are added in the template to the svg and zoom area rect. clip path has not been implemented yet. In the end it's good to define actions to change the width and height if needed.
	width = 400
	height = 400
	
	
	
	constructor(){
		let obj = this;
		
		obj.node = html2element(template);
		
		
		
		
		// Make the axis objects, and connect them to the menu selection.
		// `obj.plotbox' specifies the area of the SVG that the chart should be drawn to.
		// Variables must be set later.
		obj.y = new ordinalAxis("y", obj.plotbox);
		obj.x = new ordinalAxis("x", obj.plotbox);
		
		let axisContainer = obj.node.querySelector("g.axes");
		axisContainer.appendChild(obj.y.node);
		axisContainer.appendChild(obj.x.node);
		
		let menuContainer = obj.node.querySelector("div.variable-select-menus");
		menuContainer.appendChild(obj.y.menu.node);
		menuContainer.appendChild(obj.x.menu.node);
		
		obj.y.onupdate = function(){
			obj.onupdate();
		}
		
		obj.x.onupdate = function(){
			obj.onupdate();
		}
		
		// The zooming depends on the obj.y/x scales.
		obj.addZooming();
		
	} // constructor
	
	

	
	
	
	// What should the inset do if the variables change?
	// Just do a set, and let everything update itself.
	update(variables){
		let obj = this;
		
		obj.x.update( variables );
		obj.y.update( variables );
	} // coordinateMenusWithAxes
	
	
	onupdate(){
		// dummy functon
	}; // onupdate
	
	
	get plotbox(){
		// Specify the area of the svg dedicated to the plot. In this case it'll be all of it. The margin determines the amount of whitespace around the plot. This whitespace will NOT include the axis labels etc.
		let obj = this;
		let margin = {top: 0, right: 0, bottom: 0, left: 0};
		
		// If the inset was not yet attached the getBoundingClientRect will return an empty rectangle. Instead, have this inset completely control the width and height of hte svg.
		// let svgrect = obj.node.getBoundingClientRect();
		let plot = {
			x: [margin.left, obj.width - margin.left - margin.right], 
			y: [margin.top , obj.height- margin.top  - margin.bottom]
		}
		return plot
		
	} // plotbox
	
	
	get isConfigured(){
		let obj = this;
		
		// At the beginning the plot starts empty.
		return (
			(obj.x.variable.name != undefined) &&
			(obj.y.variable.name != undefined)
		);
	} // isConfigured
	

	
	
	
	
	
	// Maybe this can be an external module? But it depends directly on how the axis are specified - minimum reusability.
	addZooming(){
		let obj = this;
		
		// The current layout will keep adding on zoom. Rethink this for more responsiveness of the website.
		let zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
	
		// Zoom operates on a selection. In this case a rect has been added to the markup to perform this task.
		d3.select( obj.node )
		  .select("g.background")
		  .select("rect.zoom-area")
		  .call(zoom);
		
		
		// As of now (23/03/2020) the default zoom behaviour (https://d3js.org/d3.v5.min.js) does not support independantly scalable y and x axis. If these are implemented then on first zoom action (panning or scaling) will have a movement as the internal transform vector (d3.event.transform) won't corespond to the image. 
		
		// The transformation vector is based on the domain of the image, therefore any manual scaling of the domain should also change it. The easiest way to overcome this is to apply the transformation as a delta to the existing state.
		
		// obj.viewtransform is where the current state is stored. If it is set to -1, then the given zoom action is not performed to allow any difference between d3.event.transform and obj.viewtransform due to manual rescaling of the domain to be resolved.
		obj.viewtransform = d3.zoomIdentity
		
		function zoomed(event){
			
			// Get the current scales, and reshape them back to the origin.
			var t = event.transform
			var t0= obj.viewtransform
			
			// Check if there was a manual change of the domain
			if(t0 == -1){
				t0 = t
			} // if
			
			// Hack to get the delta transformation.
			var dt = d3.zoomIdentity
			dt.k = t.k / t0.k 
			dt.x = t.x - t0.x 
			dt.y = t.y - t0.y
			
			obj.viewtransform = t
			
			var xScaleDefined = obj.x.scale != undefined
			var yScaleDefined = obj.y.scale != undefined
			if(xScaleDefined && yScaleDefined){
				
				// dt is the transformation of the domain that should take place. So first we get the current range, we apply the view transformation, and then we convert that back to the domain.
				let xdomain = obj.x.scale.range()
				  .map(dt.invertX, dt)
				  .map(obj.x.scale.invert, obj.x.scale)
				obj.x.setdomain( xdomain )
				
				let ydomain = obj.y.scale.range()
				  .map(dt.invertY, dt)
				  .map(obj.y.scale.invert, obj.y.scale)
				obj.y.setdomain( ydomain )
				
				obj.update();
			} // if
		} // zoomed
		  
	} // addZooming
	
	
	
} // twoInteractiveAxesInset