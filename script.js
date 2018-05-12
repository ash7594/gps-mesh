var map;
var markers = [];
var points = [];

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
    points.push(latLng2Point(event.latLng, map));
    drawConnectors();
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

function drawConnectors() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (var i=1; i<points.length; i+=1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke(); 
  
  for (i in points) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 2, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}

var angle = 90;
var separation_distance = 10;

function compareFunc(a, b) {
  if (a[0] < b[0])
    return -1;
  if (a[0] > b[0])
    return 1;
  return 0;
}

function generate() {
  var x = points[0].x;
  var y = points[0].y;
  var intersection_points = getUniqueIntersectionsWithPolygon(x, y);
  if (isValidIntersection(intersection_points))
    generateLine(intersection_points);

  var x1 = x;
  var y1 = y;
  while (true) {
    x1 -= separation_distance*Math.sin(angle*Math.PI/180);
    y1 += separation_distance*Math.cos(angle*Math.PI/180);
    intersection_points = getUniqueIntersectionsWithPolygon(x1, y1);
    if (isValidIntersection(intersection_points))
      generateLine(intersection_points);
    else
      break;
  }

  var x2 = x;
  var y2 = y;
  while (true) {
    x2 += separation_distance*Math.sin(angle*Math.PI/180);
    y2 -= separation_distance*Math.cos(angle*Math.PI/180);
    intersection_points = getUniqueIntersectionsWithPolygon(x2, y2);
    if (isValidIntersection(intersection_points))
      generateLine(intersection_points);
    else
      break;
  }

  console.log("Done...");
}

function isValidIntersection(intersection_points) {
  if (intersection_points.length >= 2)
    return true;
  return false;
}

function getUniqueIntersectionsWithPolygon(x1, y1) {
  var [x2, y2] = getPointOnLine(x1, y1, angle);

  console.log(x1 + ", " + y1 + ", " + x2 + ", " + y2);
  var duplicated_intersection_points = getIntersectionPointsWithPolygon(x1, y1, x2, y2);

  duplicated_intersection_points.sort(compareFunc);
  console.log(duplicated_intersection_points);

  var intersection_points = [];
  for (var i = 0; i < duplicated_intersection_points.length;) {
    var [_x, _y] = duplicated_intersection_points[i];
    intersection_points.push(duplicated_intersection_points[i]);
    for (i++; i < duplicated_intersection_points.length; i++) {
      var [_x2, _y2] = duplicated_intersection_points[i];
      if (_x == _x2 && _y == _y2)
        continue;
      break;
    }
  }
  console.log(intersection_points);
  return intersection_points;
}

function generateLine(intersection_points) {
  for (var i = 0; i < intersection_points.length-1; i++) {
    var [_x1, _y1] = intersection_points[i];
    var [_x2, _y2] = intersection_points[(i+1)];
    var inside = isPointWithinPolygon((_x1+_x2)/2, (_y1+_y2)/2);
    if (!inside)
      continue;
    ctx.beginPath();
    ctx.moveTo(_x1, _y1);
    ctx.lineTo(_x2, _y2);
    ctx.stroke();
  }
}

function isPointWithinPolygon(x0, y0) {
  for (var i = 0; i < points.length; i++) {
    var x = points[i].x;
    var y = points[i].y;
    if (x0 == x && y0 == y)
      return true;
  }
  
  var vectors = [];
  for (var i = 0; i < points.length; i++) {
    var x = points[i].x;
    var y = points[i].y;
    vectors.push([y-y0, x-x0]);
  }

  var anglesBetweenLines = [];
  var l = vectors.length;
  var sum = 0;
  for (var i = 0; i < l; i++) {
    var [_x1, _y1] = vectors[(i+1)%l];
    var [_x2, _y2] = vectors[i];
    var angle = Math.atan2(_x1*_y2-_y1*_x2, _x1*_x2+_y1*_y2) * 180 / Math.PI;
    anglesBetweenLines.push(angle);
    sum += angle;
  }
  console.log(anglesBetweenLines);
  console.log("sum: " + sum);

  sum = Math.abs(sum);
  if (Math.abs(360-sum) < sum)
    return true;
  return false;
}

function getPointOnLine(x, y, angle) {
  var x2 = x + Math.cos(angle * Math.PI / 180);
  var y2 = y + Math.sin(angle * Math.PI / 180);
  return [x2, y2];
}

function getIntersectionPointsWithPolygon(x1, y1, x2, y2) {
  var intersection_points = [];
  var l = points.length;
  for (var i = 0; i < l; i++) {
    var point = getIntersectionPointIfExists(x1, y1, x2, y2,
        points[i].x, points[i].y, points[(i+1)%l].x, points[(i+1)%l].y);
    if (point.length != 0) {
      intersection_points.push(point);
    }
  }
  return intersection_points;
}

function getIntersectionPointIfExists(x11, y11, x12, y12, x21, y21, x22, y22) {
  var A1 = y12 - y11;
  var A2 = y22 - y21;

  var B1 = x11 - x12;
  var B2 = x21 - x22;

  var C1 = A1*x11 + B1*y11;
  var C2 = A2*x21 + B2*y21;

  var det = A1*B2 - A2*B1;
  if (det == 0) {
    return [];
  } else {
    var x = (B2*C1 - B1*C2)/det;
    var y = (A1*C2 - A2*C1)/det;
    if ((x-x21)*(x-x22) <= 0)
      return [x, y];
    return [];
  }
}
