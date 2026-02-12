import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {setLoadingStatus} from './home.slice';
import {isEqual} from '../../shared/Helpers';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import {setSelectedAttributes} from '../spots/spots.slice';

const useHomeContainer = ({mapComponentRef, openNotebookPanel}) => {

  const {handleSpotSelected} = useSpots();

  const dispatch = useDispatch();
  const toast = useToast();

  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);

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
