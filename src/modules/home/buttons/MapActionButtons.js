import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {useWindowSize} from '../../../shared/ui/useWindowSize';
import useMap from '../../maps/useMap';
import useMapFeatures from '../../maps/useMapFeatures';
import homeStyles from '../home.style';
import {MapActionsOverlay, MapLayersOverlay, MapSymbolsOverlay, overlayStyles} from '../overlays';

const MapActionButtons = ({dialogClickHandler, dialogs, mapComponentRef, toggleDialog}) => {
  const {height} = useWindowSize();
  const {setBasemap} = useMap();
  const {updateFeatureTypes} = useMapFeatures();

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const stratSection = useSelector(state => state.map.stratSection);

  const toggleMapSymbolsOverlay = () => {
    if (!dialogs.mapSymbolsMenuVisible) updateFeatureTypes();
    toggleDialog('mapSymbolsMenuVisible');
  };

  return (
    <>
      <IconButton
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
        onPress={() => toggleDialog('mapActionsMenuVisible')}
        source={SMALL_SCREEN ? require('../../../assets/icons/MapActions.png')
          : require('../../../assets/icons/MapActionsButton.png')}
      />
      {isEmpty(featureTypesOff) && isEmpty(geometryTypesOff) ? (
        <IconButton
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
          onPress={toggleMapSymbolsOverlay}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols.png')
            : require('../../../assets/icons/SymbolsButton.png')}
        />
      ) : (
        <IconButton
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
          onPress={toggleMapSymbolsOverlay}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols_pressed.png')
            : require('../../../assets/icons/SymbolsButton_pressed.png')}
        />
      )}
      {!currentImageBasemap && !stratSection && (
        <IconButton
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
          onPress={() => toggleDialog('baseMapMenuVisible')}
          source={SMALL_SCREEN ? require('../../../assets/icons/Layers.png')
            : require('../../../assets/icons/LayersButton.png')}
        />
      )}
      <MapActionsOverlay
        onPress={name => dialogClickHandler('mapActionsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapActionsMenuVisible')}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        visible={dialogs.mapActionsMenuVisible}
      />
      <MapSymbolsOverlay
        onPress={name => dialogClickHandler('mapSymbolsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapSymbolsMenuVisible')}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        visible={dialogs.mapSymbolsMenuVisible}
      />
      <MapLayersOverlay
        mapComponentRef={mapComponentRef}
        onPress={(name) => {
          setBasemap(name);
          toggleDialog('baseMapMenuVisible');
        }}
        onTouchOutside={() => toggleDialog('baseMapMenuVisible')}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        visible={dialogs.baseMapMenuVisible}
      />
    </>
  );
};

export default MapActionButtons;
