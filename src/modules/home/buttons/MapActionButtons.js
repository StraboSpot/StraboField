import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import useMapFeatures from '../../maps/features/useMapFeatures';
import homeStyles from '../home.styles';
import MapActionsOverlay from '../overlays/MapActionsOverlay';
import MapLayersOverlay from '../overlays/MapLayersOverlay';
import MapSymbolsOverlay from '../overlays/MapSymbolsOverlay';

const MapActionButtons = ({dialogClickHandler, dialogs, toggleDialog}) => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const stratSection = useSelector(state => state.map.stratSection);

  const {updateFeatureTypes} = useMapFeatures();

  /* Logic Helpers */

  const toggleMapSymbolsOverlay = () => {
    if (!dialogs.mapSymbolsMenuVisible) updateFeatureTypes();
    toggleDialog('mapSymbolsMenuVisible');
  };

  /* View */

  return (
    <>
      <IconButton
        onPress={() => toggleDialog('mapActionsMenuVisible')}
        source={SMALL_SCREEN ? require('../../../assets/icons/MapActions.png')
          : require('../../../assets/icons/MapActionsButton.png')}
        style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
      />
      {isEmpty(featureTypesOff) && isEmpty(geometryTypesOff) ? (
        <IconButton
          onPress={toggleMapSymbolsOverlay}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols.png')
            : require('../../../assets/icons/SymbolsButton.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      ) : (
        <IconButton
          onPress={toggleMapSymbolsOverlay}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols_pressed.png')
            : require('../../../assets/icons/SymbolsButton_pressed.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      )}
      {!currentImageBasemap && !stratSection && (
        <IconButton
          onPress={() => toggleDialog('baseMapMenuVisible')}
          source={SMALL_SCREEN ? require('../../../assets/icons/Layers.png')
            : require('../../../assets/icons/LayersButton.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      )}

      {/* Modals */}
      <MapActionsOverlay
        onPress={name => dialogClickHandler('mapActionsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapActionsMenuVisible')}
        visible={dialogs.mapActionsMenuVisible}
      />
      <MapSymbolsOverlay
        onPress={name => dialogClickHandler('mapSymbolsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapSymbolsMenuVisible')}
        visible={dialogs.mapSymbolsMenuVisible}
      />
      <MapLayersOverlay
        onTouchOutside={() => toggleDialog('baseMapMenuVisible')}
        visible={dialogs.baseMapMenuVisible}
      />
    </>
  );
};

export default MapActionButtons;
