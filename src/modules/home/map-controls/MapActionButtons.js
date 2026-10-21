import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import useMapFeatures from '../../maps/features/useMapFeatures';
import homeStyles from '../home.styles';
import MapActionsMenu from './MapActionsMenu';
import MapLayersMenu from './MapLayersMenu';
import MapSymbolsMenu from './MapSymbolsMenu';

const MapActionButtons = ({handleHomeActionFromMapMenu, mapMenus, toggleMapMenu, zoomToCustomMap}) => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const stratSection = useSelector(state => state.map.stratSection);

  const {updateFeatureTypes} = useMapFeatures();

  /* Logic Helpers */

  const toggleMapSymbolsMenu = () => {
    if (!mapMenus.mapSymbolsMenuVisible) updateFeatureTypes();
    toggleMapMenu('mapSymbolsMenuVisible');
  };

  /* View */

  return (
    <>
      <IconButton
        onPress={() => toggleMapMenu('mapActionsMenuVisible')}
        source={SMALL_SCREEN ? require('../../../assets/icons/MapActions.png')
          : require('../../../assets/icons/MapActionsButton.png')}
        style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
      />
      {isEmpty(featureTypesOff) && isEmpty(geometryTypesOff) ? (
        <IconButton
          onPress={toggleMapSymbolsMenu}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols.png')
            : require('../../../assets/icons/SymbolsButton.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      ) : (
        <IconButton
          onPress={toggleMapSymbolsMenu}
          source={SMALL_SCREEN ? require('../../../assets/icons/Symbols_pressed.png')
            : require('../../../assets/icons/SymbolsButton_pressed.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      )}
      {!currentImageBasemap && !stratSection && (
        <IconButton
          onPress={() => toggleMapMenu('mapLayersMenuVisible')}
          source={SMALL_SCREEN ? require('../../../assets/icons/Layers.png')
            : require('../../../assets/icons/LayersButton.png')}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      )}

      {/* Menus */}
      <MapActionsMenu
        onPress={name => handleHomeActionFromMapMenu('mapActionsMenuVisible', name)}
        onTouchOutside={() => toggleMapMenu('mapActionsMenuVisible')}
        visible={mapMenus.mapActionsMenuVisible}
      />
      <MapSymbolsMenu
        onTouchOutside={() => toggleMapMenu('mapSymbolsMenuVisible')}
        visible={mapMenus.mapSymbolsMenuVisible}
      />
      <MapLayersMenu
        onTouchOutside={() => toggleMapMenu('mapLayersMenuVisible')}
        visible={mapMenus.mapLayersMenuVisible}
        zoomToCustomMap={zoomToCustomMap}
      />
    </>
  );
};

export default MapActionButtons;
