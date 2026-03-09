import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {setLoadingStatus} from './home.slice';
import {isEqual} from '../../shared/Helpers';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {useSpots} from '../spots';
import {setSelectedAttributes} from '../spots/spots.slice';

const useHomeContainer = ({mapComponentRef, openNotebookPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);

  const {handleSpotSelected} = useSpots();
  const toast = useToast();

  /* Exported Functions */

  const openSpotInNotebook = (spot, notebookPage, attributes) => {
    handleSpotSelected(spot);
    if (!isEqual(attributes, selectedAttributes)) dispatch(setSelectedAttributes(attributes));
    if (notebookPage) openNotebookPanel(notebookPage);
    else openNotebookPanel(PAGE_KEYS.OVERVIEW);
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
      toast.show(`${err.toString()}`);
    }
  };

  return {
    openSpotInNotebook,
    zoomToCurrentLocation,
  };
};

export default useHomeContainer;
