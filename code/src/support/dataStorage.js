export default class dataStorage{
  tasks = undefined
  current = undefined
  datum = undefined
  
  // distributions = undefined
  
  /*
  extent = {
	distribution: undefined,
	contour: undefined
  }
  */
  
  constructor(){
    let obj = this;
  } // constructor
  
  
  
  settasks(tasks){
	let obj = this;
	
	obj.tasks = tasks;
	
	// obj.distributions = processDistributionData(obj.tasks);
	// obj.extent.contour = processContourLines(obj.tasks);
	
  } // settasks
  
} // dataStorage



function processDistributionData(tasks){
	
	
	
	tasks.forEach(function(t){
		
		// Mach distributon
		let mach1 = t.distribution.Mis_1.map((v,i)=>{
			return [t.distribution.s_1[i], t.distribution.Mis_1[i]]
		})
		
		let mach2 = t.distribution.Mis_2.map((v,i)=>{
			return [t.distribution.s_2[i], t.distribution.Mis_2[i]]
		})
		
		let mach = mach1.concat(mach2.reverse());
		
		
		// Camber distributions
		let camber = t.camber.camber.map((v,i)=>{
			return [t.camber.s_cam[i], t.camber.camber[i]]
		}) // map
		
		
		// Theta distributions.
		let theta1 = t.camber.theta_ps.map((v,i)=>{
			return [t.camber.s_ps[i], t.camber.theta_ps[i]]
		}) // map
		
		let theta2 = t.camber.theta_ss.map((v,i)=>{
			return [t.camber.s_ss[i], t.camber.theta_ss[i]]
		}) // map
		
		let theta =  theta1.concat(theta2.reverse());
		
		
		
		
		// Create the series that can be plotted
		t.distribution = {
			mach:   {level: t.metadata.name[0], points: mach, color: "cornflowerblue"},
			camber: {level: t.metadata.name[0], points: camber, color: "cornflowerblue"},
			theta:  {level: t.metadata.name[0], points: theta, color: "cornflowerblue"}
		} // distribution
		
	}) // forEach
	
	
	
	// But these should really come in pars no? One per each pair?
	let plotdata = [
	  {name: "mach", extent: [], accessor: function(d){ return d.distribution["mach"]} },
	  {name: "camber", extent: [], accessor: function(d){ return d.distribution["camber"]} },
	  {name: "theta", extent: [], accessor: function(d){ return d.distribution["theta"]} }
	]
	
	
	// Calculate the extents here
	plotdata.forEach(series=>{

		let ex = extent( tasks, function(t){return t.distribution[series.name]} );
		// axisequal( ex );
		
		series.extent = ex;
			
	}) // forEach
	
	return plotdata
	
} // processDistributionData



function processContourLines(tasks){
	
	
	let x_extent = [Math.POSITIVE_INFINITY, Math.NEGATIVE_INFINITY];
	let y_extent = [Math.POSITIVE_INFINITY, Math.NEGATIVE_INFINITY];
	
	tasks.forEach(function(t){
		let passage0 = matlabContour2drawLines( t.contour.C );
		let passage1 = matlabContour2drawLines( t.contour.C_pitch );
		
		let flow_lines = passage0.concat(passage1);
		
		flow_lines.forEach(line=>{line.color = "cornflowerblue";});
		let custom_lines = [
			{level: "aerofoil", points: t.contour.xrt, color: "black"},
			{level: "aerofoil", points: t.contour.xrt_neg_pitch, color: "black"},
			{level: "aerofoil", points: t.contour.xrt_pos_pitch, color: "black"},
			
			{level: "throat_bl", points: t.contour.xrt_throat_bl, color: "magenta"},
			{level: "stag_line", points: t.contour.xrt_stag_line, color: "gray"},
			{level: "bl", points: t.contour.bl, color: "gray"}
		];

		
		// calculate the extents
		t.contour.lineconfigs = flow_lines.concat(custom_lines);
		
		t.contour.lineconfigs.forEach(line=>{
			line.points.forEach(p=>{
				x_extent[0] = x_extent[0] < p[0] ? x_extent[0] : p[0];
				x_extent[1] = x_extent[1] > p[0] ? x_extent[1] : p[0];
				
				y_extent[0] = y_extent[0] < p[1] ? y_extent[0] : p[1];
				y_extent[1] = y_extent[1] > p[1] ? y_extent[1] : p[1];
			}) // forEach
		}) // forEach
	})
	
	
	
	
	// Control the plot aspect ratio by controlling the extents. Always try to keep hte data in the middle.
	// Try to scale the plot to fit the aspect ratio??
	let y_range = y_extent[1]-y_extent[0];
	let x_range = x_extent[1]-x_extent[0];
	if( x_range > y_range ){
		// Readjust y_extent.
		y_extent = [
		  y_extent[0] + y_range/2 - x_range/2,
		  y_extent[0] + y_range/2 + x_range/2,
		]
	} else {
		x_extent = [
		  x_extent[0] + x_range/2 - y_range/2,
		  x_extent[0] + x_range/2 + y_range/2,
		]
	} // if
	
	
	return {
		x: x_extent,
		y: y_extent
	}
	
	
} // processContourLines





function extent(tasks, accessor){
	
	let x_extent = [Math.POSITIVE_INFINITY, Math.NEGATIVE_INFINITY];
	let y_extent = [Math.POSITIVE_INFINITY, Math.NEGATIVE_INFINITY];

	tasks.forEach(function(t){
		
		accessor(t).points.forEach(p=>{
			x_extent[0] = x_extent[0] < p[0] ? x_extent[0] : p[0];
			x_extent[1] = x_extent[1] > p[0] ? x_extent[1] : p[0];
			
			y_extent[0] = y_extent[0] < p[1] ? y_extent[0] : p[1];
			y_extent[1] = y_extent[1] > p[1] ? y_extent[1] : p[1];
		}) // forEach
	}) // forEach
		
	return {
		x: x_extent,
		y: y_extent
	}
	
} // extent



function axisequal(e){
	
	let y_range = e.y[1]-e.y[0];
	let x_range = e.x[1]-e.x[0];
	
	if( x_range > y_range ){
		// Readjust y_extent.
		e.y = [
		  e.y[0] + y_range/2 - x_range/2,
		  e.y[0] + y_range/2 + x_range/2,
		]
	} else {
		e.x = [
		  e.x[0] + x_range/2 - y_range/2,
		  e.x[0] + x_range/2 + y_range/2,
		]
	} // if
} // axisequal




function matlabContour2drawLines(C){
	
	let lines = [];
	
	// {level: <scalar>, points: [...]}
	
	// Loop over all the columns, and decode accordingly.
	let currentline;
	let current_n = 0;
	for(let i=0; i<C[0].length; i++){
		if(current_n == 0){
			// All hte points for this level have been collected. Start new line.
			currentline = {level: C[0][i], points: []};
			current_n = C[1][i];
			lines.push(currentline);
		} else {
			// Add the current point to the current line
			currentline.points.push( [ C[0][i], C[1][i] ] )
			current_n -= 1;
		} // if
		
	} // for
	
	
	return lines
} // matlabContour2drawLines
