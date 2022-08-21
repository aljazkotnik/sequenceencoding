
import * as d3 from "d3";
import {html2element, calculateExponent} from "../../support/helpers.js";
import divSelectMenu from "./divSelectMenu.js";

/* I want to support:
 - linear		: scaleLinear
 - logarithmic	: scaleLog - must not cross 0!!
 
 And variable types:
 - number       : can be used as is.
 - datetime		: scaleTime() 
		.domain([new Date(2000, 0, 1), new Date(2000, 0, 2)])
		.range([0, 960]);
scales
*/

let textattributes = `fill="black" font-size="10px" font-weight="bold"`;


let exponenttemplate = `
<text class="linear" ${textattributes}>
	<tspan>
	  x10
	  <tspan class="exp" dy="-5"></tspan>
	</tspan>
</text>
`;

let logtemplate = `
<text class="log" ${textattributes} display="none">
	<tspan>
	  log
	  <tspan class="base" dy="5">10</tspan>
	  <tspan class="eval" dy="-5">(x)</tspan>
	</tspan>
</text>
`;

// text -> x="-8" / y="-0.32em"
let template = `
	<g class="graphic"></g>
	
	<g class="model-controls" style="cursor: pointer;">
		${ exponenttemplate }
		${ logtemplate }
	</g>
	<g class="domain-controls" style="cursor: pointer;">
		<text class="plus hover-highlight" ${textattributes}>+</text>
		<text class="minus hover-highlight" ${textattributes}>-</text>
	</g>
	<g class="variable-controls" style="cursor: pointer;">
		<text class="label hover-highlight" ${textattributes} text-anchor="end">Variable name</text>
	</g>
`;


// The exponent should be replaced with the logarithmic controls if the axis switches from linear to log.


// Now I need to add in a label saying linear/log
// DONE!! Maybe a plus/minus next to the axes to increase the axis limits - instead of dragging the labels.



// The changing between the variables is done in the parent, and not in the axis. This is simply because this class only controls it's own node, and there isn't space to show all the options. Therefore the parent must allocate the space for the change of variables.


// How to change between the scale interpretations? What should I click? Maybe the exponent text? But then it should always be visible. Let's try that yes. But how to differentiate between clicking on hte text, and editing the text??

export default class ordinalAxis{
	
	_type = "linear";
	_variable = {
		name: undefined,
		extent: [1, 1]
	}
	domain = [1,1]
	supportedtypes = ["linear", "log"];
	
	
	// These margins are required to completely fit the scales along with their labels, ticks and domain lines onto the plot.
	margin = {top: 30, right: 30, bottom: 40, left: 40}
	
	constructor(axis, plotbox){
		/* `axis' is a flag that signals whether it should be a vertical or horizontal axis, `svgbbox' allows the axis to be appropriately positioned, and therefore define the plotting area, and `ordinalvariable' is a dbslice ordinal variable which is paired with this axis. */
		let obj = this;
		
		// make the axis group.
		obj.d3node = d3.create("svg:g")
		  .attr("class", `${axis}-axis`)
		  .html(template);
		obj.node = obj.d3node.node();
		
		// Get rid of axis by abstracting?
		obj.axis = axis;
		obj.setplotbox(plotbox);		
		
		
		// Add the functionality to the domain change.
		let controls = obj.d3node.select("g.domain-controls");
		controls.select("text.plus").on("click", ()=>{
			obj.plusdomain();
			obj.update();
		})
		controls.select("text.minus").on("click", ()=>{
			obj.minusdomain();
			obj.update();
		})
		
		// Add teh functionality to toggle the axis type.
		let exponent = obj.d3node.select("g.model-controls");
		exponent.on("click", ()=>{
			obj.incrementtype();
			obj.update();
		})
		
		
		
		
		// Add the menu that will be associated with this axis.
		obj.menu = new divSelectMenu();
		if(axis == "y"){
			obj.menu.node.style.left = "5px";
			obj.menu.node.style.top = "10px";
		} else {
			obj.menu.node.style.right = "10px";
			obj.menu.node.style.bottom = "10px";
		}; // if
		
		let menuToggle = obj.node
		  .querySelector("g.variable-controls")
		  .querySelector("text.label");
		
		menuToggle.addEventListener("click", (event)=>{
		  event.stopPropagation();
		  obj.menu.show();
		})
		
		obj.menu.onselection = function(){
			obj.variable = obj.menu.current;
			obj.update();
		} // onselection
		
	} // constructor
	
	
	
	update(variables){
		let obj = this;

		if(variables){
			obj.menu.variables = variables;
			obj.menu.update();
			obj.variable = obj.menu.current;
		} // if
		
		obj.position();
		obj.draw();
		
		obj.onupdate();
		
	} // update
	
	
	onupdate(){
		// dummy function.
	}

	
	
	
	// I want to be able to set the variable from outside, and have the axis refresh itself accordingly. `variable' was made a computed because mobx then treats the setter as an acion, and the getter as a computed.
	set variable(variable){
		// Set a new variable for the axis.
		let obj = this;
		
		// Change the domain. Before setting the initial domain extend it by 10% on either side to make sure the data fits neatly inside.
		let domaindiff = 0*( variable.extent[1] - variable.extent[0] );
		obj.setdomain([
			variable.extent[0] - 0.1*domaindiff, 
			variable.extent[1] + 0.1*domaindiff
		]);
		
		
		// Change the axis type to the variables.
		obj.type = variable.axistype;
		
		
		// Need to store it under an anonymous name so it doesn't recursively call this function.
		obj._variable = variable;
	} // variable
	
	get variable(){
		// The the get variable can be a computed, and the variable will be observable anyway.
		// Why doesn't this one compute correctly??
		// console.log(`compute variable for ${this.axis} axis`)
		return this._variable
	} // variable
	
	
	// Drawing of the svg axes.
	position(){
		// If the range changes, then the location of the axes must change also. And with them the exponents should change location.
		let obj = this;
		
		// Position the axis. This will impact all of the following groups that are within the axes group.
		let ax = obj.axis == "y" ? obj.margin.left : 0;
		let ay = obj.axis == "y" ? 0 : obj.plotbox.y[1] - obj.margin.bottom
		obj.d3node.attr("transform", `translate(${ax}, ${ay})` );
		
		// Reposition hte exponent.
		let model = obj.d3node.select("g.model-controls");
		model.attr("text-anchor", obj.axis == "y" ? "start" : "end")
		let mx = obj.axis == "y" ? 0 + 6              : obj.range[1];
		let my = obj.axis == "y" ? obj.margin.top + 3 : 0 - 6;
		model.attr("transform", `translate(${mx}, ${my})`);
		
		// Reposition the +/- controls.
		let controls = obj.d3node.select("g.domain-controls");
		let cx = obj.axis == "y" ? 0 - 5               : obj.range[1] + 10;
		let cy = obj.axis == "y" ? obj.margin.top - 10 : 0 + 5;
		controls.attr("transform", `translate(${cx}, ${cy})`);
		
		// Reposition hte actual plus/minus.
		let dyPlus = obj.axis == "y" ?  0 : -5;
		let dxPlus = obj.axis == "y" ? -5 :  0;
		
		let dyMinus = obj.axis == "y" ? 0 : 5;
		let dxMinus = obj.axis == "y" ? 5 : 1.5;
			
		controls.select("text.plus").attr("dy", dyPlus)
		controls.select("text.plus").attr("dx", dxPlus)
		
		controls.select("text.minus").attr("dy", dyMinus)
		controls.select("text.minus").attr("dx", dxMinus)
		
		
		// Position the variable label.
		let labelgroup = obj.d3node.select("g.variable-controls");
		let label = labelgroup.select("text.label");
		
		// The text should be flush with the axis. To allow easier positioning use the `text-anchor' property.
		label.attr("writing-mode", obj.axis == "y" ? "tb" : "lr")
		label.text( obj.variable.name ? obj.variable.name : "Variable name" )
		
		let lx = obj.axis == "y" ? 30 : obj.range[1];
		let ly = obj.axis == "y" ? -obj.margin.top :  30;
		let la = obj.axis == "y" ? 180 : 0
		labelgroup.attr("transform", `rotate(${la}) translate(${lx}, ${ly})`)
		
		
	} // position
	
	draw(){
		let obj = this;
		
		obj.d3node
			.selectAll("g.model-controls")
			.select("text")
			  .attr("fill", obj.exponent > 0 ? "black" : "black")
			.select("tspan.exp")
			  .html(obj.exponent)
			  
		// A different scale is created for drawing to allow specific labels to be created (e.g. for scientific notation with the exponent above the axis.)	
		let d3axis = obj.axis == "y" ? d3.axisLeft : d3.axisBottom;
		obj.d3node.select("g.graphic")
		  .call( d3axis( obj.scale ) )
		  
		// Control the ticks. Mak
		  
		obj.d3node
		  .select("g.graphic")
		  .selectAll("text")
		  .html(d=>{return obj.tickformat(d)})
		  
		  
		// Switch between the model controls.
		let modelcontrols = obj.d3node.select("g.model-controls");
		modelcontrols.selectAll("text").attr("display", "none");
		modelcontrols.select("text." + obj.type).attr("display", "");
		
	} // draw
	
	
	// MOVE ALL THESE SWITCHES SOMEWHERE ELSE. MAYBE JUST CREATE A SUPPORTED OBJECT OUTSIDE SO ALL THE SMALL CHANGES CAN BE HANDLED THERE.
	
	tickformat(d){
		// By default the tick values are assigned to all tick marks. Just control what appears in hte labels.
		let obj = this;
		
		let label
		switch(obj.type){
			case "log":
			  // Only orders of magnitude. Keep an eye out for number precision when dividing logarithms!
			  let res = Math.round( Math.log(d) / Math.log(obj.scale.base()) *1e6 ) / 1e6;
			  
			  // Counting ticks doesn't work, because the ticks don't necessarily begin with the order of magnitude tick.
			  
			  label  = Number.isInteger(res) ? d : "";
			  break;
			case "linear":
			  // All of them, but adjusted by the common exponent. 
			  label = d/(10**obj.exponent);
			  break;
		} // switch
		
		
		return label
		
		
	} // tickformat
	
	
	getdrawvalue(t){
		// Given a task return its coordinate.
		
		// This is just implemented for more strict control of wht this axis can do. It's not strictly needed because the scale underneath is not being changed.
		
		// Needs the current object as it evaluates the incoming value using the current scale.
		let obj = this;
		
		let v = obj.variable.getvalue(t);
		
		
		// Return only the value of the current axis selection. Also, if the data doesn't have the appropriate attribute, then position hte point off screen instead of returning undefined. Will this break if viewPort is adjusted?
		let dv = obj.scale( v );
		return dv ? dv : -10
		
	} // getdrawvalue
	
	
	
	// Getting values required to setup the scales.
	get scale(){
		// Computed value based on hte selected scale type.
		let obj = this;
		
		let scale
		switch(obj.type){
			case "log":
				scale = d3.scaleLog();
				break;
			case "linear":
			default:
				scale = d3.scaleLinear();
				break;
			
		} // switch
		
		
		// If the domain is below zero always Math.abs it to work with positive values.
		
		// The domain of this one  goes below zero... It's because the domain was extended there!! Ah, will this break the zooming and panning below zero?? Probably no? Logs aren't defined for negtive values anyway? So what do I do in those cases? Do I just add a translation in the data? For now just
		
		// Deal with the exponent. Will this require accessor functions?? This means that there should be another
		
		// I will want the axis configuration to be stored and communicated further to pass into a python module. How will I do that? For that I'll need to evaluate teh data passed into the module. So I should use an evaluator anyway. Where should this evaluator be present? It should be present in the plot. The axis should return the parameters required for the evaluation. But it also needs to return the scale to be used for drawing. Actually, it just needs to present the draw value given some input. So just have that exposed? And a general evaluator that can handle any combination of inputs?
		
		
		scale.range(obj.range).domain(obj.domain)
		
		return scale
		
	} // get scale
	
	get range(){
		// When initialising a new range - e.g. on plot rescaling, the scales need to change
		let obj = this;
		
		// When the axis is made the first tick is translated by the minimum of the range. Therefore the margin is only added when adjusting the `_range`. 
		
		if(obj.axis == "y"){
			// The browsers coordinate system runs from top of page to bottom. This is opposite from what we're used to in engineering charts. Reverse the range for hte desired change.
			let r = [obj.plotbox.y[0] + obj.margin.top, 
					 obj.plotbox.y[1] - obj.margin.bottom];
			return [r[1], r[0]]; 
		} else {
			return [obj.plotbox.x[0] + obj.margin.left,
					obj.plotbox.x[1] - obj.margin.right];
		} // if
		
	} // get range
	
	setplotbox(plotbox){
		
		// The vertical position of the axis doesn't actually depend on the range. The y-position for the x axis should be communicated from outside. The axis should always get the x and y dimesnion of the svg we're placing it on.
		
		this.plotbox = plotbox;
	} // plotbox
	
	
	// Domain changes
	setdomain(domain){
		this.domain = domain;
	} // domain
	
	plusdomain(){
		// Extend the domain by one difference between the existing ticks. It's always extended by hte distance between the last two ticks.
		let obj = this;
		
		let currentdomain = obj.domain;
		let ticks = obj.scale.ticks();
		
		// Calculate the tick difference. If that fails just set the difference to 10% of the domain range.
		let tickdiff = ticks[ticks.length-1] - ticks[ticks.length-2];
		tickdiff = tickdiff ? tickdiff : 0.1(currentdomain[1] - currentdomain[0]);
		
		// Set the new domain.
		this.domain = [currentdomain[0], currentdomain[1] + tickdiff];
	} // plusdomain
	
	minusdomain(){
		// Reduce the domain by one difference between the existing ticks. It's always extended by hte distance between the last two ticks.
		let obj = this;
		
		let currentdomain = obj.domain;
		let ticks = obj.scale.ticks();
		
		// Calculate the tick difference. If that fails just set the difference to 10% of the domain range.
		let tickdiff = ticks[ticks.length-1] - ticks[ticks.length-2];
		tickdiff = tickdiff ? tickdiff : 0.1(currentdomain[1] - currentdomain[0]);
		
		// Set the new domain.
		this.domain = [currentdomain[0], currentdomain[1] - tickdiff];
	} // minusdomain
	
	
	// Creating model variables.
	
	
	// This exponent should be reworked to just return the transformation configuration.
	
	// Difference between the tick labels, and the data for evaluation. For the evaluation whatever is displayed on hte axes should be passed to the model. But the exponent is just a cosmetic change.
	
	// Can also use the exponent to guess what space we should be viewing the data in? Maybe not. For example erroneous values.
	
	// Difference between a log scale transformation and a log scale axis. The log axis still shows the exact same values, whereas the transform will create new values. Do I want to differentiate between the two, or just apply a log transformation if the data is visualised with a log scale? Even if the data is in hte log scale the user may still want to use it as such?
	
	// Still connect both - what you see is what you get. But on hte log plot maybe still keep the original labels?? Let's see how it goes.
	
	// So if I have an exponent do I change the domain? But the exponent depends on the domain...Create a labelaxis just to draw the labels??
	
	
	
	
	get exponent(){
		let obj = this;
		
		if(obj.domain.length > 0){
			let maxExp = calculateExponent(obj.domain[1]);
			let minExp = calculateExponent(obj.domain[0]);
			
			// Which exponent to return? It has to be a multiple of three - guaranteed by calculateExponent.
			// -10.000 - 10.000 -> 3
			// 0 - 10.000 -> 3
			// 0 - 1.000.000 -> 3 - to minimize string length?
			// 
			// If the order of magnitude is a factor of 3 then return the maximum one. e.g. range of 100 - 100.000 go for 3 to reduce teh string length
			return (maxExp - minExp) >= 3 ? maxExp : minExp
		} else {
			return 0
		} // if
	} // exponent
	
	
	// Changing the scale type. Click on the exponent to change the 
	nexttype(type){
		// Sequence of axis types.
		let obj = this;
		
		let imax = obj.supportedtypes.length - 1;
		let inext = obj.supportedtypes.indexOf(type) + 1
		
		let i = inext > imax ? inext-imax-1 : inext;
		
		return obj.supportedtypes[i];
	} // nexttype
	
	// Shouldn't really migrate the type of axes from the ordinalAxes to the variable. What if teh variable isn't observable for instance? In that case use an observable attribute of this class.
	incrementtype(){
		let obj = this;
		let newtype = obj.nexttype(obj.type);
		
		// If the switch is to `log' the domain needs to be changed to be positive. So: don't allow the change to log. If the user wants to use a log transformation on the data they need to first et it in the right range.
		if(newtype == "log"){
			let extent = obj.variable.extent;
			let invalidExtent = extent[0]*extent[1] <= 0;
			if(invalidExtent){
				// Move to next type.
				newtype = obj.nexttype(newtype);
			} // if
		} // if
		
		
		
		// Set the new type.
		obj.type = newtype;
		
		// Try to increment it for the variable obj too.
		if(typeof( obj.variable.changetransformtype ) == "function"){
			obj.variable.changetransformtype(newtype)
		} // if
		
		// Always switch back to the original domain.
		if(obj.variable){
			obj.setdomain(obj.variable.extent);
		} // if
		
	} // incrementtype
	
	set type(newtype){
		let obj = this;
		
		// The type can be set to a specific value.
		if(obj.supportedtypes.includes(newtype)){
			obj._type = newtype;
		} // if
	} // type

	get type(){
		// Maybe adjust this one so that it gets the type from the variable, if it's available.
		let obj = this;
		
		// Default value.
		let _type = obj._type
		
		// But if the variable is defined, and it has a correctly defined type, then use that one instead. If it's observable this will also update automatically.
		if(obj.variable){
			let customtype = obj.variable.transformtype;
			if(obj.supportedtypes.includes(customtype)){
				_type = customtype;
			} // if
		} 
		
		return _type;

	} // type

} // axis