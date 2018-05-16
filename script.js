var map;
var markerPoints = [];
var markerBlockers = [];
var points = [];
var blockers = [];
// 1 - Perimeter
// 0 - Blocker
var polygon_type = -1;

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
    if (polygon_type == -1)
      return;

    addMarker(event.latLng, map, polygon_type);
    if (polygon_type == 1)
      points[points.length-1].push(latLng2Point(event.latLng, map));
    else if (polygon_type == 0)
      blockers[blockers.length-1].push(latLng2Point(event.latLng, map));
    drawConnectors();
	});
}

function addMarker(location, map, polyType) {
  console.log(location.lat());
  if (polyType == 1) {
    markerPoints.push(new google.maps.Marker({
      position: location,
      map: map
    }));
  } else if (polyType == 0) {
    markerBlockers.push(new google.maps.Marker({
      position: location,
      map: map
    }));
  }
}

function latLng2Point(latLng, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
  return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
}

function point2LatLng(x, y, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = new google.maps.Point(x / scale + bottomLeft.x, y / scale + topRight.y);
  return map.getProjection().fromPointToLatLng(worldPoint);
}

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function drawConnectors() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (var i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.moveTo(points[i][0].x, points[i][0].y);
    for (var j = 1; j < points[i].length; j++) {
      ctx.lineTo(points[i][j].x, points[i][j].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  for (var i = 0; i < points.length; i++) {
    for (var j = 0; j < points[i].length; j++) {
      ctx.beginPath();
      ctx.arc(points[i][j].x, points[i][j].y, 2, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgb(255, 0, 0)";
  ctx.fillStyle = "rgb(255, 0, 0)";
  for (var i = 0; i < blockers.length; i++) {
    ctx.beginPath();
    ctx.moveTo(blockers[i][0].x, blockers[i][0].y);
    for (var j = 1; j < blockers[i].length; j++) {
      ctx.lineTo(blockers[i][j].x, blockers[i][j].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  for (var i = 0; i < blockers.length; i++) {
    for (var j = 0; j < blockers[i].length; j++) {
      ctx.beginPath();
      ctx.arc(blockers[i][j].x, blockers[i][j].y, 2, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  ctx.strokeStyle = "rgb(0, 0, 0)";
  ctx.fillStyle = "rgb(0, 0, 0)";
}

var angle = 0;
var separation_distance = 10;
var point_distance = 1000;

function compareFunc(a, b) {
  if (a[0] < b[0])
    return -1;
  if (a[0] > b[0])
    return 1;
  if (a[0] == b[0]) {
    if (a[1] < b[1])
      return -1;
    if (a[1] > b[1])
      return 1;
  }
  return 0;
}

function perimeter() {
  points.push([]);
  polygon_type = 1;
}

function blocker() {
  blockers.push([]);
  polygon_type = 0;
}

function computeDistanceInPixel(polygon, marker) {
  var distAct = getDistance(marker[0].position, marker[1].position);
  console.log("Map distance: " + distAct);

  var distVirt = Math.sqrt(
    Math.pow(polygon[0].x - polygon[1].x, 2)
    + Math.pow(polygon[0].x - polygon[1].x, 2)
  );
  console.log("Canvas distance: " + distVirt);

  return point_distance / distAct * distVirt;
}

function generate() {
  // Get scale
  var dpp;
  if (points.length > 0 && points[0].length > 1)
    dpp = computeDistanceInPixel(points[0], markerPoints);
  else
    return;

  var x = points[0][0].x;
  var y = points[0][0].y;
  var intersection_points = getUniqueIntersectionsWithAllPolygons(x, y);
  if (isValidIntersection(intersection_points))
    generateLine(intersection_points, dpp);

  var x1 = x;
  var y1 = y;
  while (true) {
    x1 -= separation_distance*Math.sin(angle*Math.PI/180);
    y1 += separation_distance*Math.cos(angle*Math.PI/180);
    intersection_points = getUniqueIntersectionsWithAllPolygons(x1, y1);
    if (isValidIntersection(intersection_points))
      generateLine(intersection_points, dpp);
    else
      break;
  }

  var x2 = x;
  var y2 = y;
  while (true) {
    x2 += separation_distance*Math.sin(angle*Math.PI/180);
    y2 -= separation_distance*Math.cos(angle*Math.PI/180);
    intersection_points = getUniqueIntersectionsWithAllPolygons(x2, y2);
    if (isValidIntersection(intersection_points))
      generateLine(intersection_points, dpp);
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

function getUniqueIntersectionsWithAllPolygons(x1, y1) {
  var duplicated_intersection_points = [];
  for (var i = 0; i < points.length; i++) {
    var intersect = getUniqueIntersectionsWithPolygon(points[i], x1, y1);
    for (var j = 0; j < intersect.length; j++) {
      duplicated_intersection_points.push(intersect[j]);
    }
  }
  for (var i = 0; i < blockers.length; i++) {
    var intersect = getUniqueIntersectionsWithPolygon(blockers[i], x1, y1);
    for (var j = 0; j < intersect.length; j++) {
      duplicated_intersection_points.push(intersect[j]);
    }
  }

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

function getUniqueIntersectionsWithPolygon(polygon, x1, y1) {
  var [x2, y2] = getPointOnLine(x1, y1, angle);

  console.log(x1 + ", " + y1 + ", " + x2 + ", " + y2);
  var duplicated_intersection_points = getIntersectionPointsWithPolygon(polygon, x1, y1, x2, y2);

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

function generateLine(intersection_points, distance_in_pixel) {
  for (var i = 0; i < intersection_points.length-1; i++) {
    var [_x1, _y1] = intersection_points[i];
    var [_x2, _y2] = intersection_points[(i+1)];
    var inside = isPointWithinAnyPolygon(blockers, (_x1+_x2)/2, (_y1+_y2)/2);
    if (inside)
      continue;
    inside = isPointWithinAnyPolygon(points, (_x1+_x2)/2, (_y1+_y2)/2);
    if (!inside)
      continue;

    var lineNorm = Math.sqrt(Math.pow(_x2-_x1, 2) + Math.pow(_y2-_y1, 2));
    var unitX = (_x2-_x1)/lineNorm;
    var unitY = (_y2-_y1)/lineNorm;
    var adderX = distance_in_pixel * unitX;
    var adderY = distance_in_pixel * unitY;

    var num_counts = Math.floor(lineNorm / distance_in_pixel);

    var x = _x1;
    var y = _y1;
    var counter = 0;
    do {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fill();

      var latLng = point2LatLng(x, y, map);
      new google.maps.Marker({
        position: latLng,
        map: map
      });

      x += adderX;
      y += adderY;

      counter++;
    } while (counter <= num_counts);

    var latLng = point2LatLng(_x2, _y2, map);
    new google.maps.Marker({
      position: latLng,
      map: map
    });
    
    ctx.beginPath();
    ctx.moveTo(_x1, _y1);
    ctx.lineTo(_x2, _y2);
    ctx.stroke();
  }
}

function isPointWithinAnyPolygon(polygons, x0, y0) {
  for (var i = 0; i < polygons.length; i++) {
    if (isPointWithinPolygon(polygons[i], x0, y0))
      return true;
  }
  return false;
}

function isPointWithinPolygon(polygon, x0, y0) {
  for (var i = 0; i < polygon.length; i++) {
    var x = polygon[i].x;
    var y = polygon[i].y;
    if (x0 == x && y0 == y)
      return true;
  }
  
  var vectors = [];
  for (var i = 0; i < polygon.length; i++) {
    var x = polygon[i].x;
    var y = polygon[i].y;
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

function getIntersectionPointsWithPolygon(polygon, x1, y1, x2, y2) {
  var intersection_points = [];
  var l = polygon.length;
  for (var i = 0; i < l; i++) {
    var point = getIntersectionPointIfExists(x1, y1, x2, y2,
        polygon[i].x, polygon[i].y, polygon[(i+1)%l].x, polygon[(i+1)%l].y);
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
