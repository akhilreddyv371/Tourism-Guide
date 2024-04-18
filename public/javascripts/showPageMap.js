mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/light-v10', // style URL
    center: places.geometry.coordinates, // starting position [lng, lat]
    zoom: 8 // starting zoom
});

map.addControl(new mapboxgl.FullscreenControl());

const marker = new mapboxgl.Marker()
    .setLngLat(places.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({offset:25})
            .setHTML(`<h5>${places.title},${places.city}</h5>`)
    )
    .addTo(map)