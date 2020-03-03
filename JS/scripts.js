mapboxgl.accessToken = 'pk.eyJ1IjoiaGFveXUtZnNmIiwiYSI6ImNrNnNyYmN5NjBrNGIzZnBidTJkd201cWQifQ.OHz_Lulnto908cgqxQtqtQ'; // API Key
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/haoyu-fsf/ck6sr15xd0gdj1jpcwgrl2w34', // style URL
  center: [-74.0060, 40.7128],
  zoom: 11.5
});

// First Incident
var origin = [-73.88399148,40.81591716];
var along_route = [];
$.getJSON('./route.geojson', function(results){
                window.ani_rou = results
            })
            .done(function(){
                // console.log("success!");
                for (var y = 0 ; y < ani_rou.features.length; y++){
                    along_route.push(ani_rou.features[y].geometry.coordinates);
                };

                // return along_route;
                var route = {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': Object.values(along_route)
                            }
                        }
                    ]
                };
                console.log(route);
                // A single point that animates along the route.
                // Coordinates are initially set to origin.
                var point = {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'Point',
                                'coordinates': origin
                            }
                        }
                    ]
                };
                var lineDistance = turf.lineDistance(route.features[0], 'kilometers');
                console.log(lineDistance);

                var arc = [];

                // Number of steps to use in the arc and animation, more steps means
                // a smoother arc and animation, but too many steps will result in a
                // low frame rate
                var steps = 1500;

                // Draw an arc between the `origin` & `destination`
                for (var i = 0; i < lineDistance; i += lineDistance / steps) {
                    var segment = turf.along(route.features[0], i, 'kilometers');
                    arc.push(segment.geometry.coordinates);
                }

                // Update the route with calculated arc coordinates
                route.features[0].geometry.coordinates = arc;
                // Used to increment the value of the point measurement against the route.
                var counter = 0;

                map.on('load', function() {
                    map.addSource('PP_Area', {
                            'type': 'geojson',
                            'data': './police_precint.geojson'
                            });

                        map.addLayer({
                            'id': 'PP_Area',
                            'type': 'fill',
                            'source': 'PP_Area',
                            'layout': {},
                            'filter':['>=', 'Join_Count',0],
                            'paint': {

                            'fill-color': ['interpolate',
                                ['linear'],
                                ['get', 'Join_Count'],
                                0,
                                '#1a9641',
                                1,
                                '#a6d96a',
                                2,
                                '#ffffbf',
                                3,
                                '#fdae61',
                                4,
                                '#d7191c'
                                ],
                            'fill-opacity':  0.25
                            }
                            },
                            );
                        var zoomlevel_change = 12;

                        map.addLayer({
                            'id': 'Incident_count',
                            'type': 'symbol',
                            'source': 'PP_Area',
                            'minzoom':zoomlevel_change,
                            'layout': {
                            // 'visibility':'none',
                            'text-field': ['get', 'Join_Count'],
                            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                            'text-radial-offset': 0.5,
                            'text-justify': 'auto',

                            },
                            'paint': {
                                'text-color': '#CC3300',
                                'text-halo-color':'#eee7e5'
                            }
                            });


                        map.addLayer({
                            'id': 'PP_outline',
                            'type': 'line',
                            'source': 'PP_Area',
                            'layout': {

                            },
                            'paint': {
                                'line-color': '#404040',
                                'line-width': 1
                            }
                            });


                        map.addLayer({
                            id: 'Police_station',
                            type: 'symbol',
                            source: {
                            type: 'geojson',
                            data: pdstation
                            },
                            layout: {
                            'icon-image': 'police-11',
                            'icon-allow-overlap': true
                            },
                            paint: { }
                        });

                        map.addSource('nearest-pdstation', {
                            type: 'geojson',
                            data: {
                            type: 'FeatureCollection',
                            features: []
                            }
                        });


                        map.addSource('actual_incidents', {
                                'type': 'geojson',
                                'data': './actual_incidents.geojson'
                                });

                        map.addLayer({
                              id: 'Complains',
                              type: 'symbol',
                              source: {
                              type: 'geojson',
                              data: 'actual_incidents.geojson'
                              },
                              layout: {
                              'icon-image': 'vienna-u-bahn',
                              'icon-allow-overlap': false
                              },
                              paint: { }
                          });
                        // animate_p();

                        try{
                            animate_p()
                        }
                        catch(e){};


                    // Add a source and layer displaying a point which will be animated in a circle.


                    function animate() {
                        // Update point geometry to a new position based on counter denoting
                        // the index to access the arc.
                        point.features[0].geometry.coordinates =
                            route.features[0].geometry.coordinates[counter];


                        // point.features[0].properties.bearing = turf.bearing(
                        //     turf.point(
                        //         route.features[0].geometry.coordinates[
                        //             counter >= steps ? counter - 1 : counter
                        //         ]
                        //     ),
                        //     turf.point(
                        //         route.features[0].geometry.coordinates[
                        //             counter >= steps ? counter : counter + 1
                        //         ]
                        //     )
                        // );

                        // Update the source with this new data.
                        map.getSource('point').setData(point);

                        // Request the next frame of animation so long the end has not been reached.
                        if (counter < steps) {
                            requestAnimationFrame(animate);
                        }

                        counter = counter + 1;
                    }





                    document.getElementById('replay').addEventListener('click', function() {
                        map.addSource('route', {
                            'type': 'geojson',
                            'data': route
                        });

                        map.addSource('point', {
                            'type': 'geojson',
                            'data': point
                        });

                        map.addLayer({
                            'id': 'route',
                            'source': 'route',
                            'type': 'line',
                            'paint': {
                                'line-width': 2,
                                'line-color': '#a17676'
                            }
                        });

                        map.addLayer({
                            'id': 'point',
                            'source': 'point',
                            'type': 'symbol',
                            'layout': {
                                'icon-image': 'heliport-15',
                                'icon-rotate': ['get', 'bearing'],
                                'icon-rotation-alignment': 'map',
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true
                            }
                        });
                        // Set the coordinates of the original point back to origin
                        point.features[0].geometry.coordinates = origin;

                        // Update the source layer
                        map.getSource('point').setData(point);

                        // Reset the counter
                        counter = 0;

                        // Restart the animation.
                        animate(counter);


                        });

                    // Start the animation.
                    // animate(counter);

                    //add code here. 
                    var lables_to_show = ['0', '1', '2', '3', '4&+'];
                    var colors = ['#1a9641', '#a6d96a', '#ffffbf', '#fdae61', '#d7191c'];
                    for (i = 0; i < lables_to_show.length; i++) {
                        var layer = lables_to_show[i];
                        var color = colors[i];
                        var item = document.createElement('div');
                        var key = document.createElement('span');
                        key.className = 'legend-key';
                        console.log(key);

                        key.style.backgroundColor = color;
                        var value = document.createElement('span');
                        value.innerHTML = layer;
                        console.log(value);
                        item.appendChild(key);
                        item.appendChild(value);
                        legend.appendChild(item);

                       
                        // if (color.startsWith("#")){
                        //     // key.style.backgroundColor = color;
                        //     key.style.backgroundColor = color;
                      
                        //     var value = document.createElement('span');
                        //     value.innerHTML = layer;
                        //     item.appendChild(key);
                        //     item.appendChild(value);
                        //     legend.appendChild(item);

                        // }else{
                        //     key.style.display="inline"
                        //     // key = key + '<image src='+ color + '>';
                        //     console.log(key);
                            
                        //     // key.style.backgroundColor = color;
                        //     var value = document.createElement('span');
                        //     var down = document.getElementsByClassName('legend-key'); 
                        //     var img = document.createElement('img'); 

                        //     img.src = '../icon/incident.png'; 
                        //     document.getElementsByClassName('legend-key').appendChild(img); 
                        //     down.innerHTML = "Image Element Added.";  



                        //     value.innerHTML = layer;
                        //     item.appendChild(img);
                        //     item.appendChild(value);
                        //     legend.appendChild(item);

                        // }
                        
                      }
                      




                    //end of map.onload function

                });






                });



var pdstation = {
type: 'FeatureCollection',
features: [
    { type: 'Feature', properties: { Name: '1st Precinct', Address: '16 Ericsson Place' }, geometry: { type: 'Point', coordinates: [-74.006954, 40.720384] } },
    { type: 'Feature', properties: { Name: '19th Precinct', Address: '153 East 67th Street' }, geometry: { type: 'Point', coordinates: [ -73.963821, 40.767070] } },
    { type: 'Feature', properties: { Name: 'Midtown South Precinct', Address: '357 West 35th Street' }, geometry: { type: 'Point', coordinates: [ -73.994920, 40.753865] } },
    { type: 'Feature', properties: { Name: '9th Precinct', Address: '3080 Fieldstone Way' }, geometry: { type: 'Point', coordinates: [ -73.987832, 40.726550,] } },
    { type: 'Feature', properties: { Name: '90th Precinct', Address: '211 Union Avenue' }, geometry: { type: 'Point', coordinates: [ -73.950775,40.706267] } },
    { type: 'Feature', properties: { Name: '72nd Precinct', Address: '830 4th Avenue' }, geometry: { type: 'Point', coordinates: [ -74.000861,40.658326] } }
]
};

var filter_content;
function changethefilter() {
    // alert("jiba")
    x = document.getElementById("all").checked;//False
    if (x == false){
        filter_content = ['>=', ['number', ['get', 'Created_hr']], 0]

    }else{
        filter_content = ['==', ['number', ['get', 'Created_hr']], 12]
    };
    return filter_content
    };


function remove(){


    try{
        map.removeLayer('Complain_p');
        map.removeSource('Complain_p');
    }
    catch(e){};
    try{
        map.removeLayer('point');
        map.removeSource('point');
    }
    catch(e){};
    try{
        map.removeLayer('route');
        map.removeSource('route');
    }
    catch(e){};
    $('.marker').remove();
    var ele = document.getElementsByName("toggle");
    for(var i=0;i<ele.length;i++)
       ele[i].checked = false;
    // var time_ani_incide={};
    // if (markerss!==null) {
    //     for (var i = markerss.length - 1; i >= 0; i--) {
    //         markerss[i].remove();
    //     }
    // }


};




var popup = new mapboxgl.Popup({ offset: [0, -15] });
var popup2 = new mapboxgl.Popup({ offset: [0, -15] });
// var markerss = []

function addlayertime() {

    changethefilter();
    // console.log(filter_content);
    try{
        map.removeLayer('Complain_p');
        map.removeSource('Complain_p');
    }
    catch(e){};

    map.addLayer({
        id: 'Complain_p',
        type: 'circle',
        source: {
        type: 'geojson',
        data: './time_display_incident.geojson' // local geojson
        },
        paint: {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['number', ['get', 'harz_l']],
            1, 5,
            2, 7,
            3, 10,
            4, 12,
            5, 15,
            6, 20
        ],
        // 'circle-radius':5,
        'circle-color': [
            'interpolate',
            ['linear'],
            ['number', ['get', 'harz_l']],

            1, '#1a9850',
            2, '#91cf60',
            3, '#d9ef8b',
            4, '#fee08b',
            5, '#fc8d59',
            6, '#d73027'
        ],
        'circle-opacity': 0.8
        },
        //replace following line if checked
        filter: filter_content
        // filter : null
        });


        document.getElementById('slider').addEventListener('input', function(e) {
        var hour = parseInt(e.target.value);
        // update the map
        map.setFilter('Complain_p', ['==', ['number', ['get', 'Created_hr']], hour]);

        // converting 0-23 hour to AMPM format
        var ampm = hour >= 12 ? 'PM' : 'AM';
        var hour12 = hour % 12 ? hour % 12 : 12;

        // update text in the UI
        document.getElementById('active-hour').innerText = hour12 + ampm;
        });




    };


// var iicc=[];

function loadjson(){
    // window.iicc;
    window.aa = $.getJSON('./route.geojson', function(results){
        window.iicc = results
        return iicc
    })
    .done(function(){});

};

function animate_p(){

    loadjson();
    // console.log(iicc);
    // var iicc;

    iicc.features.forEach(function(marker,index,collection) {

        setTimeout(function(){
            var el = document.createElement('div');
            el.className = 'marker';

            // make a marker for each feature and add to the map
            window.markerss = new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .addTo(map)
        // markerss.remove()
      }, (index+1) * 250)
    // $( ".marker" ).remove();
// create a HTML element for each feature
// markerss.remove()
});


}



map.on('mousemove', function(e) {

var features = map.queryRenderedFeatures(e.point, {
    layers: ['Complains'] // replace this with the name of the layer
});

if (!features.length) {
    popup.remove();
    return
    // alert("test");
}

var feature = features[0];

popup.setLngLat(feature.geometry.coordinates)
.setHTML('<h4>' + feature.properties.Descriptor+ '</h4><p>' + 'Created Time: '+feature.properties.Created_Date + '</p>' )
.addTo(map);
map.getCanvas().style.cursor = features.length ? 'pointer' : '';

});


map.on('mousemove', function(e) {
var features2 = map.queryRenderedFeatures(e.point, {
    layers: ['Police_station'] // replace this with the name of the layer
});

if (!features2.length) {
    popup2.remove();
    return
    // alert("test");
}

var feature2 = features2[0];

popup2.setLngLat(feature2.geometry.coordinates)
.setHTML('<h4>' + feature2.properties.Name+ '</h4><p>' + feature2.properties.Address + '</p>' )
.addTo(map);
map.getCanvas().style.cursor = features2.length ? 'pointer' : '';

});

map.on('click', function(e) {
// try{
//     popup3.remove()
// }catch(e){}
// popup3.remove();


// console.log(popup3);
var Inci_Features = map.queryRenderedFeatures(e.point, { layers: ['Complains'] });
if (!Inci_Features.length) {
    map.removeLayer('nearest-pdstation');
    return;
}

var IN_Feature = Inci_Features[0];

var nearestPD = turf.nearest(IN_Feature ,pdstation);


if (nearestPD !== null) {

    map.getSource('nearest-pdstation').setData({
    type: 'FeatureCollection',
    features: [nearestPD]
    });

    map.addLayer({
    id: 'nearest-pdstation',
    type: 'circle',
    source: 'nearest-pdstation',
    paint: {
        'circle-radius': 12,
        'circle-color': '#BF683F'
    }
    }, 'Police_station');
}



});

var popup3 = new mapboxgl.Popup({ offset: [0, -15] });
map.on('click', 'PP_Area', function(e) {

    var checkit = map.getLayer('nearest-pdstation');
    if(typeof checkit == 'undefined'){
        popup3.setLngLat(e.lngLat)
        .setHTML('<h5>'+ 'Incident in this Police Precinct is:'+'</h5><p>'+e.features[0].properties.Join_Count+ '</p>' )
        .addTo(map);
    }
    });





var toggleableLayerIds = ['Complains', 'Police_station','PP_Area', 'Incident_count','PP_outline'];
for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
};

$(document).ready(function(){
    $('input[type="radio"]').click(function(){
        var inputValue = $(this).attr("class");
        console.log(inputValue);
        if(inputValue == 'show'){
          console.log("haha");
          var targetBox = $("." + inputValue);
          $(".session2").not(targetBox).show();
          $(targetBox).show();

        }else{
          var targetBox = $("." + inputValue);
          $(".session2").not(targetBox).hide();
          $(targetBox).show();

        }

    });
});

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
    content.style.display = "none";
    } else {
    content.style.display = "block";
    }
});
}
// $("div.toshow").show();
