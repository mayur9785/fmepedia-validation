//Do this as soon as the DOM is ready
$(document).ready(function() {

  $.getJSON("http://demos.fmeserver.com.s3.amazonaws.com/server-demo-config.json", function(config) {
    initializeMap();
    initialize(config);
  });
	
});

var initialize = function (config) {
	FMEServer.init(config.initObject);
  
  BuildForm.token = config.initObject.token;
  BuildForm.host = config.initObject.server;
	
	//Call server and get the session ID and path
	FMEServer.getSession(BuildForm.repository, BuildForm.workspaceName, function(json){
		BuildForm.session = json.serviceResponse.session;
		BuildForm.path = json.serviceResponse.files.folder[0].path;
		
		//Call server to get list of parameters and potential values
		FMEServer.getWorkspaceParameters(BuildForm.repository, BuildForm.workspaceName, BuildForm.buildParams);

		//Build up the form
		BuildForm.init();

	});
  
  
  /*** FME Server WebSocket initialization ***/
  conn = FMEServer.getWebSocketConnection("cadqa");

  /*** Reacting to incoming messages on WebSocket ***/
  conn.onmessage = function(event) {

    var jsonFeature = JSON.parse(event.data);
    features++;
    document.getElementById('numFeat').textContent = features;
    
    // Parse geometry and add to map
    switch(jsonFeature.type) {
      case 'i':

        var polyCoords = [];
        var coords = jsonFeature.features[0].coordinates;

        for(var j = 0; j < coords.length; j++) {

          var lng = coords[j][0];
          var lat = coords[j][1];

          polyCoords.push(new google.maps.LatLng(lat, lng));
        }

        var poly = new google.maps.Polyline({
          path : polyCoords,
          strokeColor : "#FF0000",
          strokeOpacity : 0.8,
          strokeWeight : 2,
          fillColor : "#FF0000",
          fillOpacity : 0.35
        });

        poly.setMap(map);
        polygonArray.push(poly);
        break;
      case 'u':
      
        //remove item from map
        if(polygonArray) {
          for(i in polygonArray) {
            if(parseInt(polyId) === parseInt(polygonArray[i].id)) {
              polygonArray[i].setMap(null);
              polygonArray.splice(i, 1);
            }

          }
        }
        
        var polyCoords = [];
        var coords = jsonFeature.features[0].coordinates[0];

        for(var j = 0; j < coords.length; j++) {

          var lng = coords[j][0];
          var lat = coords[j][1];

          polyCoords.push(new google.maps.LatLng(lat, lng));
        }

        var poly = new google.maps.Polygon({
          paths : polyCoords,
          id : jsonFeature.id,
          strokeColor : "#FF0000",
          strokeOpacity : 0.8,
          strokeWeight : 2,
          fillColor : "#FF0000",
          fillOpacity : 0.35
        });

        poly.setMap(map);
        polygonArray.push(poly);
        break;
      case 'd':
        //remove item from map
        if(polygonArray) {
          for(i in polygonArray) {
            if(parseInt(polyId) === parseInt(polygonArray[i].id)) {
              polygonArray[i].setMap(null);
              polygonArray.splice(i, 1);
            }

          }
        }
        break;
      default:
    }
  }
};


var BuildForm = {
	repository : 'validation',
	workspaceName : 'validate-subworkspace.fmw',
	session : null,
	path : null,

	init : function() {

		//hide navigation buttons
		$('#back').hide();

		$('#dropText').hide();

		$('#back').click(function(){
			if (! $('#submissionPage').hasClass('active')){
				$('#back').hide();
				//clear the results page
				$('#resultStatus').remove();
				$('#loadingImage').show();
			}
		})

		//--------------------------------------------------------------
		//Initialize the drag and drop file upload area
		//--------------------------------------------------------------
		//control behaviour of the fileuploader
		$('#fileupload').fileupload({
			url : BuildForm.host + '/fmedataupload/' + BuildForm.repository + '/' +  BuildForm.workspaceName + ';jsessionid=' + BuildForm.session,
			dropzone : $('#dropzone'),
			autoUpload : true,

			//when a new file is added either through drag and drop or 
			//file selection dialog
			add : function(e, data){
				//displays filename and progress bar for any uploading files
				$('#fileTable').show();
				data.context = $('#fileTable');
				$.each(data.files, function(index, file) {
					if (!index) {
						var elemName = file.name;
						elemName = elemName.replace(/[.\(\)]/g,'');
						elemName = elemName.split(' ').join('');

						var row = $("<div id='row"+ elemName + "' class='fileRow'/>");

						var name = $("<div class='fileName'>" + file.name + '</div>');
						var progressBar = $("<div id='progress" + elemName + "' class='progress progress-success progress-striped' />");
						progressBar.append("<div class='bar' />");
						var progress = $("<div class='progressBar' id='" + elemName +"'/>").append(progressBar);
					}

					name.appendTo(row);
					progress.appendTo(row);
				 	row.appendTo(data.context);
				})

				data.submit();
			},

			done : function(e, data){
				//update list of uploaded files with button to select 
				//them as source datasets for translation
				var elemName = data.files[0].name;
				elemName = elemName.replace(/[.\(\)]/g, '');
				elemName = elemName.split(' ').join('');

				var test = 'stop';

				var button = $("<div class='fileBtn'/>");
				button.append("<button class='btn' onClick='BuildForm.toggleSelection(this)'>Select this File</button>");
				button.insertAfter('#' + elemName);
			}, 

			fail : function(e, data) {
				$.each(data.result.files, function(index, file) {
					var error = $('<span/>').text(file.error);
					$(data.context.children()[index])
						.append('<br>')
						.append(error);
				});
			},

	        dragover : function(e, data){
	      		//going to use this to change look of 'dropzone'
	      		//when someone drags a file onto the page
				var dropZone = $('#dropzone');
				var timeout = window.dropZoneTimeout;

				if (!timeout){
					dropZone.addClass('in');
				}
				else{
					clearTimeout(timeout);
				}

				var found = false;
				var node = e.target;
				do {
					if (node == dropZone[0]){
						found = true;
						break;
					}
					node = node.parentNode;
				}
				while (node != null);
				if (found){
					$('#dropText').show();
					dropZone.addClass('hover');
				}
				else {
					$('#dropText').hide();
					dropZone.removeClass('hover');
				}
				window.dropZoneTimeout = setTimeout(function(){
					window.dropZoneTimeout = null;
					$('#dropText').hide();
					dropZone.removeClass('in hover');
				}, 100);
			},

			//give updates on upload progress of each file
			progress : function(e, data){
				var progress = parseInt(data.loaded / data.total * 100, 10);

				var name = data.files[0].name
				name = name.replace(/[.\(\)]/g, '');
				name = name.split(' ').join('');

				var progressId = '#progress' + name + ' .bar';
				$(progressId).css('width', progress + '%');

			}
		});
	},

	submit : function() {
		var files = '"'; 
		var fileList = $('.fileRow');

		//check a file has been uploaded and at least one is selected
		if (fileList.length == 0){
			//put out an alert and don't continue with submission
			$('#dropzone').prepend('<div class="alert alert-error"> Please upload a file. <button type="button" class="close" data-dismiss="alert">&times;</button></div>');
		}

		else{
			var fileSelected = false;
			for(var y=0; y<fileList.length;y++){
				if (fileList[y].lastChild.textContent == 'Selected'){
					fileSelected = true;
					break;
				}
			}
			if(fileSelected == false){
				//put out alert and don't continue with submission
				$('#dropzone').prepend('<div class="alert alert-error"> Please select a file for transformation.<button type="button" class="close" data-dismiss="alert">&times;</button></div>');
			}
			else{
				//advance to submission screen
				$('#myCarousel').carousel('next');

				for (var i = 0; i < fileList.length; i++){
					if (fileList[i].lastChild.textContent == 'Selected'){
						files = files + '"' + BuildForm.path + '/' + fileList[i].firstChild.textContent + '" ';
					}
				}

				files = files + '"';

				//build url
				var submitUrl = BuildForm.host + '/fmedatadownload/' + BuildForm.repository + '/' +  BuildForm.workspaceName + '?SourceDataset_ACAD=' + files;
        submitUrl += '&token='+BuildForm.token;
        submitUrl += '&opt_responseformat=json';

				//submit
				$.getJSON(submitUrl)
					.done(function(result){					
						 BuildForm.displayResults(result, true);
					})
					.fail(function(textStatus){
						//deal with different types of errors
						//always make sure to hide the loading image and display the back button.
						//maybe build up error message and then put that into resultStatus in displayResults
						//error code: textStatus.status
						//error text: textStatus.statusText
						//FME Error: textStatus.responseJSON.serviceResponse.fmeTransformationResult.fmeEngineResponse.statusMessage
						var error = textStatus;
            
            //BuildForm.displayResults(error, false);
					});
			}
		}
	},

	displayResults : function(result, isSuccess){
		//hide loading image
		$('#loadingImage').hide();
    
    //hide upload area
    $('#dropzone').fadeOut();
    $('#submitToServer').hide();

		//show back button
		$('#back').show();

		//get the JSON response from the Server and displays information on the page
		var resultStatus = $('<div id="resultStatus" />');

		if (isSuccess){
			var resultLink = $('<div id="resultLink" />');

			var link = '<a href="' + result.serviceResponse.url + '">' +"Validation report" + '</a>';
			resultLink.append(link);

			resultStatus.append(resultLink);
		}
		else{
			var FMEError = result.responseJSON.serviceResponse.fmeTransformationResult.fmeEngineResponse.statusMessage;
			resultStatus.append("<h3>There was an error submitting your request</h3>");
			resultStatus.append('<br/>');
			resultStatus.append('<p class="errorMsg">Error ' + result.status + ': ' + result.statusText + '</p>');
			if (FMEError == "Translation Successful"){
				resultStatus.append('<p class="errorMsg">No features were read from the source dataset</p>');
			}
			else{
				resultStatus.append('<p class="errorMsg" >' + FMEError + '</p>');
			}
			resultStatus.append('<br/>');
			resultStatus.append('<p class="errorNote">Use the back arrow to return to the start page.</p>');
		}

		$('#results').append(resultStatus);
	},

	buildParams : function(json){
		//parse JSON response
		//add in drop down menu options from workspace
		var paramArray = json;
		var elements = [ 'SourceFormat', 'DestinationFormat' ];
		for (var i = 0; i < paramArray.length; i++){
			//populate drop-down options for choice-type parameters
			if (elements.indexOf(paramArray[i].name) != -1){
				//populate drop-down options on page
				if(paramArray[i].listOptions){
					var optionArray = paramArray[i].listOptions;
					for (var x = 0; x < optionArray.length; x++){
						if (optionArray[x].value != 'SDF3' && optionArray[x].value != 'SQLITE3FDO'){
							var option = $('<option />', {value: optionArray[x].value, text: optionArray[x].caption});
							$('#' + paramArray[i].name).append(option);
						}
					}
				}
			}
		}
	},

	toggleSelection : function(e){
		var test = e;
		var blah = '';

		if (e.textContent == 'Select this File'){
			e.textContent = 'Selected';
			e.className = 'btn btn-success';
		}
		else {
			e.textContent = 'Select this File';
			e.className = 'btn';
		}
	}

}


var polygonArray = [];
var map, conn;
var features = 0;

function initializeMap() {
  /*** Initialize the map ***/
  var myOptions = {
    center : new google.maps.LatLng(30.302793482150715, -97.65678371362306),
    zoom : 15,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
};

// Wait for load

  


// This function calls the workspace to reset the database
function deleteDb() {
  document.getElementById('dbstatus').setAttribute("class","label label-warning");
  document.getElementById('dbstatus').textContent = "Waiting for answer...";
  
  // Object required for submitSyncJob method
  // For this case we are using server default values, but we still need to
  // pass an empty object to the method.
  var params = {};

  FMEServer.submitSyncJob("validation", "reset-postgis-table.fmw", params, function(json){
    document.getElementById('dbstatus').setAttribute("class","label label-success");
    document.getElementById('dbstatus').textContent = "Database ready";
  });
}