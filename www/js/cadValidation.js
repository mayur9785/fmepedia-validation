//Do this as soon as the DOM is ready
$(document).ready(function() {

  $.getJSON("http://demos.fmeserver.com.s3.amazonaws.com/server-demo-config.json", function(config) {
    initializeMap();
    initialize(config);
  });
	
});

var initialize = function (config) {
    
    /* page setup and function binding */
    $('#actions-carousel').carousel()
        .carousel('pause');
    
    $('.click-next-step').click(function() {
        $('#actions-carousel').carousel('next');
    });
    $('.click-demo-reset').click(function() {
        deleteDb();
        if (polygonArray) {
            for (i in polygonArray) {
                polygonArray[i].setMap(null); 
            }
        }
        features = 0;
        document.getElementById('numFeat').textContent = features;
    });
        
    /*backend calls - prep*/
    
    FMEServer.init(config.initObject);
    deleteDb();

    /*** FME Server WebSocket initialization ***/
    conn = FMEServer.getWebSocketConnection("cadqa");

    /*** Reacting to incoming messages on WebSocket ***/
    conn.onmessage = function (event) {

        var jsonFeature = JSON.parse(event.data);
        features++;
        document.getElementById('numFeat').textContent = features;

        // Parse geometry and add to map
        switch (jsonFeature.type) {
            case 'i':

                var polyCoords = [];
                var coords = jsonFeature.features[0].coordinates;

                for (var j = 0; j < coords.length; j++) {

                    var lng = coords[j][0];
                    var lat = coords[j][1];

                    polyCoords.push(new google.maps.LatLng(lat, lng));
                }

                var poly = new google.maps.Polyline({
                    path: polyCoords,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35
                });

                poly.setMap(map);
                polygonArray.push(poly);
                break;
            case 'u':

                //remove item from map
                if (polygonArray) {
                    for (i in polygonArray) {
                        if (parseInt(polyId) === parseInt(polygonArray[i].id)) {
                            polygonArray[i].setMap(null);
                            polygonArray.splice(i, 1);
                        }

                    }
                }

                var polyCoords = [];
                var coords = jsonFeature.features[0].coordinates[0];

                for (var j = 0; j < coords.length; j++) {

                    var lng = coords[j][0];
                    var lat = coords[j][1];

                    polyCoords.push(new google.maps.LatLng(lat, lng));
                }

                var poly = new google.maps.Polygon({
                    paths: polyCoords,
                    id: jsonFeature.id,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35
                });

                poly.setMap(map);
                polygonArray.push(poly);
                break;
            case 'd':
                //remove item from map
                if (polygonArray) {
                    for (i in polygonArray) {
                        if (parseInt(polyId) === parseInt(polygonArray[i].id)) {
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