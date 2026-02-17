// Move Spot up or down by a given number of pixels (a positive number for pixels to move up or negative for down)
export const moveSpotByPixels = (spot, pixels) => {
  const spotCopyGeom = JSON.parse(JSON.stringify(spot.geometry));
  if (spot.geometry.type === 'Point') spotCopyGeom.coordinates[1] = spot.geometry.coordinates[1] + pixels;
  else if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiPoint') {
    spot.geometry.coordinates.forEach((pointCoords, i) => {
      spotCopyGeom.coordinates[i][1] = pointCoords[1] + pixels;
    });
  }
  else if (spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiLineString') {
    spot.geometry.coordinates.forEach((lineCoords, l) => {
      lineCoords.forEach((pointCoords, i) => {
        spotCopyGeom.coordinates[l][i][1] = pointCoords[1] + pixels;
      });
    });
  }
  else if (spot.geometry.type === 'MultiPolygon') {
    spot.geometry.coordinates.forEach((polygonCoords, p) => {
      polygonCoords.forEach((lineCoords, l) => {
        lineCoords.forEach((pointCoords, i) => {
          spotCopyGeom.coordinates[p][l][i][1] = pointCoords[1] + pixels;
        });
      });
    });
  }
  // Interbedded (Geometry Collections)
  else if (spot.geometry.type === 'GeometryCollection') {
    spot.geometry.geometries.forEach((geometry, g) => {
      geometry.coordinates.forEach((lineCoords, l) => {
        lineCoords.forEach((pointCoords, i) => {
          spotCopyGeom.geometries[g].coordinates[l][i][1] = pointCoords[1] + pixels;
        });
      });
    });
  }
  return {...spot, geometry: spotCopyGeom};
};
