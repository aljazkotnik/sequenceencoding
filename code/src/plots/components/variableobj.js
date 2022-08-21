// The plot and axes insets should work with the regular, non-observable variable objects. Therefore ordinalAxis has an internal observable attribute `types' that can be used if the variable object is not observible. If the variable object has a `changetransformtype' function it tries to use it to update the variable type. 

// Furthermore, each plot-model object should keep it's own set of configuration settings. This is a wrapper shell object that can hold those configurations.

		


// Since the axes manage all the interactivity with variables the plot must use them to access the data to plot.

// Move to separate file? No, this one shouldn't be used outside of a particular plot-model.
export default class variableobj{
	
	active = false
	transformtype = "linear"
	
	constructor(variable){
		/*
		variable = {
			name: ...
			extent: ...
		}
		*/
		let obj = this;
		obj.variable = variable;
	} // constructor
	
	// Some functionality to allow the subsequent modules to use this object as if it were the original variable object.
	get name(){ return this.variable.name } // name
	get extent(){
      // Extent values will change if a transformation is selected.
	  let obj = this;
	  return obj.variable.extent.map(v=>{
		  return obj.transformValue(v)
	  }) // map
	  // return this.variable.extent 
	} // extent
	
	
	// What the label should be like.
	get label(){
		// Note that the label is always used to create a new element, and is passed through html2element. Therefore it can include html.
		let obj = this;
		
		switch(obj.transformtype){
			case "log":
			  return `log<sub>10</sub>(${obj.name})`;
			default:
			  return obj.name;
		} // switch
	} // label
	
	changetransformtype(newtype){
		this.transformtype = newtype;
	} // changetransformtype
	
	
	// Is the variable currently actively selected or not, and methods to change that.
	toggleactive(value){
		// If there is a value, then set it to the value. Otherwise toggle.
		let obj = this;
		if(value == true || value == false){
			obj.active = value;
		} else {
			obj.active = obj.active ? false : true;
		} // if
		
	} // select
	
	
	
	// How to evaluate the data before passing it to the ML/AI model. Use the getvalue to get the number needed!
	getvalue(task){
		let obj = this;
		
		
		
		// If variable = model, then model.variable should be accessed, therefore the call is variable.variable
		let value = task[obj.name]
		
		
		// Perform the transformation if needed
		return obj.transformValue( value );
		
	} // getvalue
	
	transformValue(value){
		let obj = this;
		
		// Perform the transformation if needed
		switch(obj.transformtype){
			case "log":
			  return Math.log10(value);
			default:
			  return value;
		} // switch
		
	} // transformValue
	
	
} // variableobj


// Where should the input variable and the axis type be coordinated. I guess at the scatterplot level - that's where it's needed.... 