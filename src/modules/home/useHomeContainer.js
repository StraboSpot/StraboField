import {useDispatch} from 'react-redux';

import {setLoadingStatus} from './home.slice';
import {isEmpty} from '../../shared/helpers';
import useMapLocation from '../maps/view/useMapLocation';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';

const useHomeContainer = ({mapComponentRef, openNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {showLocationError} = useMapLocation();
  const {handleSpotSelected} = useSpots();

  /* Exported Functions */

  // Selecting the Spot and opening the page both drop whatever was selected before (see spots.slice), so the
  // features to open come last, the same way openFeatureInNotebook orders them. They are written every time
  // rather than only when they differ from what is selected: what is selected has just been cleared twice, so
  // comparing against it would skip the write that reopens the feature.
  const openSpotInNotebook = (spot, notebookPage, attributes) => {
    handleSpotSelected(spot);
    if (notebookPage) openNotebookPanel(notebookPage);
    else openNotebookPanel(PAGE_KEYS.OVERVIEW);
    if (!isEmpty(attributes)) dispatch(setSelectedAttributes(attributes));
  };

  const zoomToCurrentLocation = async () => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    try {
      await mapComponentRef.current?.zoomToCurrentLocation();
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      // console.error('Geolocation Error:', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      showLocationError(err);
    }
  };

  return {
    openSpotInNotebook,
    zoomToCurrentLocation,
  };
};

export default useHomeContainer;
