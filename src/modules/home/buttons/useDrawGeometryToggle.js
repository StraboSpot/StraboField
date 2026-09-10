import {useEffect} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {MAP_MODES} from '../../maps/maps.constants';
import {setDrawGeometries} from '../../maps/maps.slice';

const useDrawGeometryToggle = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const drawGeometries = useSelector(state => state.map.drawGeometries);
  const stratSection = useSelector(state => state.map.stratSection);

  /* Side Effects */

  useEffect(() => {
    if ((currentImageBasemap || stratSection) && drawGeometries.point === MAP_MODES.DRAW.POINTLOCATION) {
      dispatch(setDrawGeometries({point: MAP_MODES.DRAW.POINT}));
    }
  }, [currentImageBasemap, stratSection]);

  /* Exported Functions */

  const handleLineLongPressed = () => {
    console.log('long press');
    dispatch(setDrawGeometries({
      line: drawGeometries.line === MAP_MODES.DRAW.LINE ? MAP_MODES.DRAW.FREEHANDLINE
        : MAP_MODES.DRAW.LINE,
    }));
  };

  const handlePointLongPressed = () => {
    if (!currentImageBasemap && !stratSection) {
      dispatch(setDrawGeometries({
        point: drawGeometries.point === MAP_MODES.DRAW.POINT ? MAP_MODES.DRAW.POINTLOCATION
          : MAP_MODES.DRAW.POINT,
      }));
    }
  };

  const handlePolygonLongPressed = () => {
    dispatch(setDrawGeometries({
      polygon: drawGeometries.polygon === MAP_MODES.DRAW.POLYGON ? MAP_MODES.DRAW.FREEHANDPOLYGON
        : MAP_MODES.DRAW.POLYGON,
    }));
  };

  return {
    handleLineLongPressed,
    handlePointLongPressed,
    handlePolygonLongPressed,
  };
};

export default useDrawGeometryToggle;
