import React from 'react';
import {View} from 'react-native';

import {DrawActionButtons, MapActionButtons, UserLocationButton} from './index';
import MapControlsContainer from '../../maps/controls/MapControlsContainer';
import homeStyles from '../home.style';
import DrawInfo from '../pop-ups/DrawInfo';

const ActionButtonsSmallScreen = ({
                                    clickHandler,
                                    dialogClickHandler,
                                    dialogs,
                                    distance,
                                    onCancel,
                                    endMeasurement,
                                    hasDrawTools,
                                    mapMode,
                                    onEndDrawPressed,
                                    selectingMode,
                                    toggleDialog,
                                  }) => {
  /* View */

  // Everything above the Mapbox attribution in one column: the map actions along the bottom, the scale bar
  // and zoom above them on the left, the geolocate button above those, and DrawInfo opposite on the right.
  // The order holds whatever the target dataset is and whichever tools are showing.
  return (
    <View style={homeStyles.actionButtonsSmallScreenStack}>
      <View style={homeStyles.mapReadoutsRow}>
        <View style={homeStyles.mapReadoutsSmallScreen}>
          <UserLocationButton clickHandler={clickHandler}/>
          <MapControlsContainer/>
        </View>

        <View style={homeStyles.drawInfoSmallScreen}>
          <DrawInfo
            clickHandler={clickHandler}
            distance={distance}
            endMeasurement={endMeasurement}
            mapMode={mapMode}
            onCancel={onCancel}
            onEndDrawPressed={onEndDrawPressed}
            selectingMode={selectingMode}
          />
        </View>
      </View>

      <View style={homeStyles.mapActionsPillRow}>
        <View style={homeStyles.mapActionsPill}>
          <View style={homeStyles.smallScreenMapActionButtons}>
            <MapActionButtons
              dialogClickHandler={dialogClickHandler}
              dialogs={dialogs}
              toggleDialog={toggleDialog}
            />
          </View>
          {hasDrawTools && <DrawActionButtons clickHandler={clickHandler} mapMode={mapMode}/>}
        </View>
      </View>
    </View>
  );
};

export default ActionButtonsSmallScreen;
