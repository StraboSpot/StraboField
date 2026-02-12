import {useState} from 'react';
import {PixelRatio, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {MAP_MODES} from './maps.constants';
import useMap from './useMap';
import useMapFeatures from './useMapFeatures';
import useMapFeaturesCalculated from './useMapFeaturesCalculated';
import useMapMeasure from './useMapMeasure';
import {isEmpty} from '../../shared/Helpers';
import {useSpots} from '../spots';
import {setSelectedSpot} from '../spots/spots.slice';

const useMapPressEvents = ({
                             clearSelectedSpots,
                             editSpot,
                             getSpotToEdit,
                             mapMode,
                             mapRef,
                             measureFeatures,
                             setDistance,
                             setDrawFeaturesNew,
                             setIsShowMacrostratOverlay,
                             setMapModeToEdit,
                             setMeasureFeatures,
                             switchToEditing,
                           }) => {
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const dispatch = useDispatch();
  const stratSection = useSelector(state => state.map.stratSection);

  const {isDrawMode} = useMap();
  const {getAllMappedSpots} = useMapFeatures();
  const {getMeasureFeatures} = useMapMeasure(mapRef);
  const {getSpotAtPress} = useMapFeaturesCalculated(mapRef);
  const {getSpotWithThisStratSection} = useSpots();

  const [location, setLocation] = useState({coords: [0, 0], zoom: 16});

  // Handle a long press on the map by making the point or vertex at the point "selected"
  const handleMapLongPress = async (e) => {
    console.log('Map long press detected:', e);
    const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
      : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
        : [e.properties.screenPointX, e.properties.screenPointY];
    const spotToEdit = await getSpotAtPress(screenPointX, screenPointY);
    const mappedSpots = getAllMappedSpots();
    if (mapMode === MAP_MODES.VIEW && !isEmpty(mappedSpots) && !isEmpty(spotToEdit)) {
      await switchToEditing(screenPointX, screenPointY, spotToEdit, setMapModeToEdit);
    }
    else if (mapMode === MAP_MODES.EDIT) await getSpotToEdit(e, screenPointX, screenPointY, spotToEdit);
    else console.log('No Spots to edit. No action taken.');
  };

  // Mapbox: Handle map press
  const handleMapPress = async (e) => {
    console.log('Map press detected:', e);
    console.log('Map mode:', mapMode);
    if (mapMode === MAP_MODES.DRAW.MEASURE) {
      const updatedMeasureFeatures = await getMeasureFeatures(e, [...measureFeatures], setDistance);
      setMeasureFeatures(updatedMeasureFeatures);
    }
    else if (mapMode !== MAP_MODES.DRAW.FREEHANDPOLYGON && mapMode !== MAP_MODES.DRAW.FREEHANDLINE) {
      // Select/Unselect a feature
      if (mapMode === MAP_MODES.VIEW) {
        console.log('Selecting or unselect a feature ...');
        const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
          : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
            : [e.properties.screenPointX, e.properties.screenPointY];
        const spotFound = await getSpotAtPress(screenPointX, screenPointY);
        if (currentBasemap?.source === 'macrostrat' && !stratSection && !currentImageBasemap) {
          setIsShowMacrostratOverlay(true);
          const currentZoom = await mapRef.current.getZoom();
          setLocation({coords: (Platform.OS !== 'web' ? e.geometry?.coordinates : Object.values(e.lngLat)), zoom: currentZoom});
        }
        if (!isEmpty(spotFound)) dispatch(setSelectedSpot(spotFound));
        else if (stratSection) {
          dispatch(setSelectedSpot(getSpotWithThisStratSection(stratSection.strat_section_id)));
        }
        else clearSelectedSpots();
      }
      // Draw a feature
      else if (isDrawMode(mapMode)) setDrawFeaturesNew(e);
      // Edit a Spot
      else if (mapMode === MAP_MODES.EDIT) await editSpot(e);
      else {
        console.log('Error. Unknown map mode:', mapMode);
      }
    }
  };

  return {
    handleMapLongPress,
    handleMapPress,
    location,
  };
};

export default useMapPressEvents;
