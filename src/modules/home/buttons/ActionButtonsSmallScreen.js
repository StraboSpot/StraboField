import React from 'react';
import {View} from 'react-native';

import {DrawActionButtons, MapActionButtons, UserLocationButton} from './index';
import * as themes from '../../../shared/styles.constants';
import {useWindowSize} from '../../../shared/ui/useWindowSize';
import homeStyles from '../home.style';
import DrawInfo from '../pop-ups/DrawInfo';

const ActionButtonsSmallScreen = ({
                                    clickHandler,
                                    dialogClickHandler,
                                    dialogs,
                                    distance,
                                    onCancel,
                                    endMeasurement,
                                    mapMode,
                                    onEndDrawPressed,
                                    selectingMode,
                                    toggleDialog,
                                  }) => {

  const {height, width} = useWindowSize();

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        {width < height ? <UserLocationButton clickHandler={clickHandler}/>
          : <View/> //Added so 'space-between' would work correctly for DrawInfo when no UserLocationButton
        }

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
      <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: 5}}>
        {height < width && <UserLocationButton clickHandler={clickHandler}/>}

        <View
          style={{
            alignItems: 'center',
            backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
            borderColor: themes.MEDIUMGREY,
            borderRadius: 10,
            borderWidth: 0.5,
            elevation: 2,
            flexDirection: 'row',
            padding: 0,
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <View style={homeStyles.smallScreenMapActionButtons}>
            <MapActionButtons
              dialogClickHandler={dialogClickHandler}
              dialogs={dialogs}
              toggleDialog={toggleDialog}
            />
          </View>
          <View style={{paddingLeft: 10}}>
            <DrawActionButtons
              clickHandler={clickHandler}
              mapMode={mapMode}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ActionButtonsSmallScreen;
