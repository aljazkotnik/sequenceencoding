export default class dragDropHandler{
  constructor(){} // constructor

  ondragdropped(loadeddata){
	// Dummy placeholder function.
  } // ondragdropped
  
  
  loadfiles(files){
	// Loadfiles is a separate function so that it can b calld programatically.
	let obj = this;
	
	
	// We don't support dropping in several files - drag-and drop is only temporary.
	let file = files[0];
	
	let url;
	if(file instanceof File){
		url = URL.createObjectURL(file);
	} else {
		url = file;
	} // if

	
	let p = fetch( url )
	  .then(res=>res.json())
	  .then(json=>{
		  // Now we update the data and the app.
		  obj.ondragdropped(json);
	  }); // fetch

    return p;	  
  } // loadfiles
  
	
  ondrop(ev){
    let obj = this;
				
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();

	var files = []
	if (ev.dataTransfer.items) {
		for (var i = 0; i < ev.dataTransfer.items.length; i++) {
		  // Use DataTransferItemList interface to access the file(s)
		  // If dropped items aren't files, reject them
		  if (ev.dataTransfer.items[i].kind === 'file') {
			files.push( ev.dataTransfer.items[i].getAsFile() );
		  } // if
		} // for
	} else {
		// Use DataTransfer interface to access the file(s)
		files = ev.dataTransfer.files
	} // if
	  
	obj.loadfiles(files);

  } // ondrop

  ondragover(ev){	
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
  } // ondragover


} // dragDropHandler