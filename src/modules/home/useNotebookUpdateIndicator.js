import {useEffect, useRef, useState} from 'react';
import {Animated} from 'react-native';

import {useSelector} from 'react-redux';

import * as themes from '../../shared/styles.constants';
import {MAP_MODES} from '../maps/maps.constants';

// Flags and flashes the control that opens the Notebook when a different Spot is selected, so a closed Notebook
// visibly has something new to show. (Separate from the halo marking the selected Spot on the map.) The caller hides
// the flag while the Notebook is on screen and clears it when the Notebook opens or closes.
const useNotebookUpdateIndicator = (mapMode) => {
  /* Data Hooks */

  const selectedSpotId = useSelector(state => state.spot.selectedSpot?.properties?.id);

  /* Local State */

  const [hasUnseenSpot, setHasUnseenSpot] = useState(false);

  const highlight = useRef(new Animated.Value(0)).current;
  const previousSelectedSpotIdRef = useRef(selectedSpotId);

  /* Derived Variables */

  const notebookUpdateHighlightColor = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', themes.PRIMARY_ACCENT_COLOR_FADED_40],
  });

  /* Side Effects */

  // Skips the selection restored on launch, and anything outside View mode: editing and dragging intervals select
  // Spots along the way, and drawing opens the Notebook itself.
  useEffect(() => {
    const isNewSelection = !!selectedSpotId && selectedSpotId !== previousSelectedSpotIdRef.current;
    previousSelectedSpotIdRef.current = selectedSpotId;
    if (!selectedSpotId) setHasUnseenSpot(false);
    if (!isNewSelection || mapMode !== MAP_MODES.VIEW) return;
    setHasUnseenSpot(true);
    highlight.setValue(1);
    Animated.timing(highlight, {duration: 1200, toValue: 0, useNativeDriver: false}).start();
  }, [selectedSpotId]);

  /* Exported Functions */

  const clearUnseenSpot = () => setHasUnseenSpot(false);

  return {
    clearUnseenSpot,
    hasUnseenSpot,
    notebookUpdateHighlightColor,
  };
};

export default useNotebookUpdateIndicator;
