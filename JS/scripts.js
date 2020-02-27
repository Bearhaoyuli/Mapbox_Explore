mapboxgl.accessToken = 'pk.eyJ1IjoiaGFveXUtZnNmIiwiYSI6ImNrNnNyYmN5NjBrNGIzZnBidTJkd201cWQifQ.OHz_Lulnto908cgqxQtqtQ'; // replace this with your access token
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/haoyu-fsf/ck6sr15xd0gdj1jpcwgrl2w34', // replace this with your style URL
  center: [-74.0060, 40.7128],
  zoom: 12
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
                var steps = 800;

                // Draw an arc between the `origin` & `destination` of the two points
                for (var i = 0; i < lineDistance; i += lineDistance / steps) {
                    var segment = turf.along(route.features[0], i, 'kilometers');
                    arc.push(segment.geometry.coordinates);
                }

                // Update the route with calculated arc coordinates
                route.features[0].geometry.coordinates = arc;
                // Used to increment the value of the point measurement against the route.
                var counter = 0;

                map.on('load', function() {
                    map.addSource('pp', {
                            'type': 'geojson',
                            'data': './police_precint.geojson'
                            });

                        map.addLayer({
                            'id': 'pp',
                            'type': 'fill',
                            'source': 'pp',
                            'layout': {},
                            'filter':['>=', 'Join_Count',0],
                            'paint': {

                            'fill-color': ['interpolate',
                                ['linear'],
                                ['get', 'Join_Count'],
                                0,
                                '#F2F12D',
                                1,
                                '#EED322',
                                2,
                                '#B86B25',
                                3,
                                '#8B4225',
                                4,
                                '#723122'
                                ],
                            'fill-opacity':  0.3
                            }
                            },
                            );

                        map.addLayer({
                            'id': 'pp2',
                            'type': 'symbol',
                            'source': 'pp',
                            'layout': {
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
                            'id': 'pp_line',
                            'type': 'line',
                            'source': 'pp',
                            'layout': {

                            },
                            'paint': {
                                'line-color': '#627BC1',
                                'line-width': 2
                            }
                            });


                        map.addLayer({
                            id: 'pdstation',
                            type: 'symbol',
                            source: {
                            type: 'geojson',
                            data: pdstation
                            },
                            layout: {
                            'icon-image': 'information-15',
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

                        // Calculate the bearing to ensure the icon is rotated to match the route arc
                        // The bearing is calculate between the current point and the next point, except
                        // at the end of the arc use the previous point and the current point
                        point.features[0].properties.bearing = turf.bearing(
                            turf.point(
                                route.features[0].geometry.coordinates[
                                    counter >= steps ? counter - 1 : counter
                                ]
                            ),
                            turf.point(
                                route.features[0].geometry.coordinates[
                                    counter >= steps ? counter : counter + 1
                                ]
                            )
                        );

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
                                'line-color': '#007cbf'
                            }
                        });

                        map.addLayer({
                            'id': 'point',
                            'source': 'point',
                            'type': 'symbol',
                            'layout': {
                                'icon-image': 'airport-15',
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
        map.removeLayer('collisions');
        map.removeSource('collisions');
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
        map.removeLayer('collisions');
        map.removeSource('collisions');
    }
    catch(e){};

    map.addLayer({
        id: 'collisions',
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
            0, 4,
            5, 24
        ],
        'circle-color': [
            'interpolate',
            ['linear'],
            ['number', ['get', 'harz_l']],

            1, '#3BB3C3',
            2, '#669EC4',
            3, '#8B88B6',
            4, '#A2719B',
            5, '#AA5E79'
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
        map.setFilter('collisions', ['==', ['number', ['get', 'Created_hr']], hour]);

        // converting 0-23 hour to AMPM format
        var ampm = hour >= 12 ? 'PM' : 'AM';
        var hour12 = hour % 12 ? hour % 12 : 12;

        // update text in the UI
        document.getElementById('active-hour').innerText = hour12 + ampm;
        });



        //new add on sat
        // document.getElementById('filters').addEventListener('change', function(e) {
        // // var day = e.target.value;
        // var day = 'weekday';
        // console.log(day);
        // // update the map filter
        // //['number', ['get', 'Created_hr']], hour]
        // if (day === 'weekday') {
        //     filterDay = ['>=', ['get', 'Created_hr'], 12];
        // } else if (day === 'weekend') {
        //     filterDay = ['<', ['get', 'Created_hr'], 12];
        // } else {
        //     alert('error');
        // }
        // console.log(filterDay);
        // map.setFilter('collisions', ['all', filterDay]);
        // });
        //new add on sat



    };


// var iicc=[];

function loadjson(){
    // window.iicc;
    window.aa = $.getJSON('./time_display_incident.geojson', function(results){
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
        }, (index+1) * 10)
    // $( ".marker" ).remove();
// create a HTML element for each feature
// markerss.remove()
});


}



map.on('mousemove', function(e) {

var features = map.queryRenderedFeatures(e.point, {
    layers: ['incident-geocoded'] // replace this with the name of the layer
});

if (!features.length) {
    popup.remove();
    return
    // alert("test");
}

var feature = features[0];

popup.setLngLat(feature.geometry.coordinates)
.setHTML('<h3>' + feature.properties.Cross_Street_1+ '</h3><p>' + feature.properties.Cross_Street_2 + '</p>' )
.addTo(map);
map.getCanvas().style.cursor = features.length ? 'pointer' : '';

});


map.on('mousemove', function(e) {
var features2 = map.queryRenderedFeatures(e.point, {
    layers: ['pdstation'] // replace this with the name of the layer
});

if (!features2.length) {
    popup2.remove();
    return
    // alert("test");
}

var feature2 = features2[0];

popup2.setLngLat(feature2.geometry.coordinates)
.setHTML('<h3>' + feature2.properties.Name+ '<h3><p>' + feature2.properties.Address + '</p>' )
.addTo(map);
map.getCanvas().style.cursor = features2.length ? 'pointer' : '';

});

map.on('click', function(e) {
var Inci_Features = map.queryRenderedFeatures(e.point, { layers: ['incident-geocoded'] });
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
        'circle-color': '#486DE0'
    }
    }, 'pdstation');
}
});





var toggleableLayerIds = ['incident-geocoded', 'pdstation','pp'];
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
