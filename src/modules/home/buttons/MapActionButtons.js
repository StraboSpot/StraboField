import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/IconButton';
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
        source={SMALL_SCREEN ? require('../../../assets/icons/MapActions.png')
          : require('../../../assets/icons/MapActionsButton.png')}
        onPress={() => toggleDialog('mapActionsMenuVisible')}
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
      />
      {isEmpty(featureTypesOff) && isEmpty(geometryTypesOff) ? (
        <IconButton
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols.png')
            : require('../../../assets/icons/SymbolsButton.png')}
          onPress={toggleMapSymbolsOverlay}
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
        />
      ) : (
        <IconButton
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols_pressed.png')
            : require('../../../assets/icons/SymbolsButton_pressed.png')}
          onPress={toggleMapSymbolsOverlay}
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
        />
      )}
      {!currentImageBasemap && !stratSection && (
        <IconButton
          source={SMALL_SCREEN ? require('../../../assets/icons/Layers.png')
            : require('../../../assets/icons/LayersButton.png')}
          onPress={() => toggleDialog('baseMapMenuVisible')}
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
        />
      )}
      <MapActionsOverlay
        visible={dialogs.mapActionsMenuVisible}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        onPress={name => dialogClickHandler('mapActionsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapActionsMenuVisible')}
      />
      <MapSymbolsOverlay
        visible={dialogs.mapSymbolsMenuVisible}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        onPress={name => dialogClickHandler('mapSymbolsMenuVisible', name)}
        onTouchOutside={() => toggleDialog('mapSymbolsMenuVisible')}
      />
      <MapLayersOverlay
        visible={dialogs.baseMapMenuVisible}
        overlayStyle={[overlayStyles.overlayMapMenuPosition, {maxHeight: (height - 40) * 0.80}]}
        mapComponentRef={mapComponentRef}
        onPress={(name) => {
          setBasemap(name);
          toggleDialog('baseMapMenuVisible');
        }}
        onTouchOutside={() => toggleDialog('baseMapMenuVisible')}
      />
    </>
  );
};

export default MapActionButtons;
