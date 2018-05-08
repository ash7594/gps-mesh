var map;
var markers = [];

var canvas = document.getElementById("my_canvas");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth/2;
canvas.height = window.innerHeight;
canvas.style.left = canvas.width + "px";

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: -34.397, lng: 150.644},
		zoom: 8
	});

	google.maps.event.addListener(map, 'click', function(event) {
		addMarker(event.latLng, map);
    draw(latLng2Point(event.latLng, map));
	});
}

function addMarker(location, map) {
	console.log(location.lat());
	markers.push(new google.maps.Marker({
		position: location,
		map: map
	}));
}

function latLng2Point(latLng, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
  return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
}

function point2LatLng(point, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
  return map.getProjection().fromPointToLatLng(worldPoint);
}

function draw(point) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 2, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fill();
}

setInterval(function() {
  console.log(latLng2Point(markers[0].position, map));
}, 10000);

