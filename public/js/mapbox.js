/* eslint-disable */

console.log('This is the javascript folder');

const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3dlamFsMDgiLCJhIjoiY2tyZnVyZ2thMjVpNDJvcXVvaDVrdWNucyJ9.Q8wOiAaLSr-DIqNdGDpJEw';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/swejal08/ckrfvexud0cs218qjqmdtd5dh',
  //   center: [-118.113491, 34.111745],
  //   zoom: 4,
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds(); //this is the area that will be displayed on the map
//in mongodb always first longitude then latitude
locations.forEach((loc) => {
  // Create marker marker
  const el = document.createElement('div');
  el.className = 'marker';
  // Add Marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p> Day ${loc.day}: ${loc.description}`)
    .addTo(map);

  //extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
}); //so that map actually fits the bounds
