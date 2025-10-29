import {useSelector} from 'react-redux';

import {DRAW_ACTION_IMAGES} from './drawActionButtons.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import {MAP_MODES} from '../../maps/maps.constants';

const useDrawActionButtons = ({clickHandler, mapMode}) => {
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const drawGeometries = useSelector(state => state.map.drawGeometries);
  const stratSection = useSelector(state => state.map.stratSection);

  const getImageSource = (type) => {
    if (type === MAP_MODES.EDIT) {
      return mapMode === MAP_MODES.EDIT
        ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.EDIT.ICON_PRESSED : DRAW_ACTION_IMAGES.EDIT.BUTTON_PRESSED
        : SMALL_SCREEN ? DRAW_ACTION_IMAGES.EDIT.ICON : DRAW_ACTION_IMAGES.EDIT.BUTTON;
    }
    switch (drawGeometries[type]) {
      case MAP_MODES.DRAW.POINT:
        return mapMode === MAP_MODES.DRAW.POINT
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.POINT.ICON_PRESSED : DRAW_ACTION_IMAGES.POINT.BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.POINT.ICON : DRAW_ACTION_IMAGES.POINT.BUTTON;
      case MAP_MODES.DRAW.POINTLOCATION:
        return mapMode === MAP_MODES.DRAW.POINTLOCATION
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.POINT.LOCATION_ICON_PRESSED : DRAW_ACTION_IMAGES.POINT.LOCATION_BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.POINT.LOCATION_ICON : DRAW_ACTION_IMAGES.POINT.LOCATION_BUTTON;
      case MAP_MODES.DRAW.LINE:
        return mapMode === MAP_MODES.DRAW.LINE
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.LINE.ICON_PRESSED : DRAW_ACTION_IMAGES.LINE.BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.LINE.ICON : DRAW_ACTION_IMAGES.LINE.BUTTON;
      case MAP_MODES.DRAW.FREEHANDLINE:
        return mapMode === MAP_MODES.DRAW.FREEHANDLINE
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.LINE.FREEHAND_ICON_PRESSED : DRAW_ACTION_IMAGES.LINE.FREEHAND_BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.LINE.FREEHAND_ICON : DRAW_ACTION_IMAGES.LINE.FREEHAND_BUTTON;
      case MAP_MODES.DRAW.POLYGON:
        return mapMode === MAP_MODES.DRAW.POLYGON
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.POLYGON.ICON_PRESSED : DRAW_ACTION_IMAGES.POLYGON.BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.POLYGON.ICON : DRAW_ACTION_IMAGES.POLYGON.BUTTON;
      case MAP_MODES.DRAW.FREEHANDPOLYGON:
        return mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON
          ? SMALL_SCREEN ? DRAW_ACTION_IMAGES.POLYGON.FREEHAND_ICON_PRESSED : DRAW_ACTION_IMAGES.POLYGON.FREEHAND_BUTTON_PRESSED
          : SMALL_SCREEN ? DRAW_ACTION_IMAGES.POLYGON.FREEHAND_ICON : DRAW_ACTION_IMAGES.POLYGON.FREEHAND_BUTTON;
    }
  };

  const handleEditShapePressed = () => {
    if (mapMode === MAP_MODES.EDIT) clickHandler('cancelEdits');
    else clickHandler('startEditing');
  };

  const handleLinePressed = () => {
    if (drawGeometries.line === MAP_MODES.DRAW.LINE) clickHandler(MAP_MODES.DRAW.LINE);
    else clickHandler(MAP_MODES.DRAW.FREEHANDLINE);
  };

  const handlePointPressed = () => {
    if (currentImageBasemap || stratSection || drawGeometries.point === MAP_MODES.DRAW.POINT) {
      clickHandler(MAP_MODES.DRAW.POINT);
    }
    else clickHandler(MAP_MODES.DRAW.POINTLOCATION);
  };

  const handlePointSamplePressed = () => clickHandler(MAP_MODES.DRAW.SAMPLE);

  const handlePolygonPressed = () => {
    if (drawGeometries.polygon === MAP_MODES.DRAW.POLYGON) clickHandler(MAP_MODES.DRAW.POLYGON);
    else clickHandler(MAP_MODES.DRAW.FREEHANDPOLYGON);
  };

  return {
    getImageSource: getImageSource,
    handleEditShapePressed: handleEditShapePressed,
    handleLinePressed: handleLinePressed,
    handlePointPressed: handlePointPressed,
    handlePointSamplePressed: handlePointSamplePressed,
    handlePolygonPressed: handlePolygonPressed,
  };
};

export default useDrawActionButtons;
