mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.0/mapbox-gl-rtl-text.js');
let map;
let gsip = "79.176.207.105";
let gsport = "8080"
let gsurl = `http://${gsip}:${gsport}/geoserver`;
$.getJSON('./empty_style.json',function(data){
    baseStyle = data;
    
   map = new mapboxgl.Map({
        container: 'map', // container id
        style: baseStyle,
        center: [34.799722, 31.258889], 
        zoom: 6,
        minZoom: 0,
        maxZoom: 16,
        attributionControl: false,
        customAttribution: `just playing around, data from osm, or someplace else`
    });


    map.on('load', function() {
    
        var layersWorkspace = "bntl";
        var layerName = "neighborhoods";
        var outputFormat = "application/flatgeobuf";
        var tempUrl = `http://${gsip}:${gsport}/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typenames=${layersWorkspace}:${layerName}&outputFormat=${outputFormat}`;
        console.log(tempUrl)

        map.addSource('nb',{
            'type': 'geojson',
            'data' : {
                "type": "FeatureCollection",
                "features": []
              }
            })

        map.addLayer({
            "id": "nb-extruded",
            "type": "fill-extrusion",
            "source": "nb",
            "paint": {
              "fill-extrusion-color": "rgba(117, 31, 31, 0.47)",
              "fill-extrusion-translate": [0, 0],
              "fill-extrusion-height": 50,
              "fill-extrusion-opacity": 0.5
            },
            "minzoom": 11
          },'roads-trunk')

        map.addLayer({
            "id": "nb-labels",
            "type": "symbol",
            "source": "nb",
            "minzoom": 11,
            "layout": {
              "text-field": [
                "to-string",
                ["get", "areaid"]
              ],
              "text-size": 13
            },
            "paint": {
              "text-halo-color": "rgba(115, 109, 109, 1)",
              "text-halo-width": 0.2
            }
          })
        fetch(tempUrl)
            .then(handleResponse)

        
    
    })
})
let baseObject = {
    "type": "FeatureCollection",
    "features": []
  }
// handle ReadableStream response
function handleResponse(response) {
    // use flatgeobuf JavaScript API to iterate stream into results (features as geojson)
    // NOTE: would be more efficient with a special purpose Leaflet deserializer
    let it = flatgeobuf.deserializeStream(response.body)
    // handle result
    function handleResult(result) {
        
        if (!result.done) {
            baseObject.features.push(result.value)
            //layer.addData(result.value)
            //L.geoJSON(result.value).addTo(map)
            it.next().then(handleResult)
        }else{
            map.getSource('nb').setData(baseObject);
        }
    }
    it.next().then(handleResult)
    
}