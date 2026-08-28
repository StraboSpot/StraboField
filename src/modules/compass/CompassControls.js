import React from 'react';
import {Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {setIsClassicCompass, setIsCompassEnlarged} from './compass.slice';
import compassStyles from './compass.styles';

// Minimalist control group for the compass modals: each item is a two-option segmented toggle. Defaults
// (selected on open) are Auto (unless the userConventions manual default is on, which the modal passes in
// via isManual), Normal size, and Classic display. The size and display rows only show in compass mode,
// since they do nothing for manual entry. Display state lives in Redux.
const CompassControls = ({isManual, onToggleManual, showManualToggle = true}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isClassicCompass = useSelector(state => state.compass.isClassicCompass);
  const isEnlarged = useSelector(state => state.compass.isCompassEnlarged);

  /* Render Functions */

  const renderSegmentRow = (rowLabel, buttons, selectedIndex, onPress) => (
    <View style={compassStyles.controlRow}>
      <Text style={compassStyles.controlRowLabel}>{rowLabel}</Text>
      <ButtonGroup
        buttonStyle={compassStyles.segmentButton}
        buttons={buttons}
        containerStyle={compassStyles.segmentContainer}
        innerBorderStyle={{width: 0}}
        onPress={onPress}
        selectedButtonStyle={compassStyles.segmentSelected}
        selectedIndex={selectedIndex}
        selectedTextStyle={compassStyles.segmentTextSelected}
        textStyle={compassStyles.segmentText}
      />
    </View>
  );

  /* View */

  // Nothing to show when the manual toggle is hidden and manual entry is active (no compass on screen).
  if (!showManualToggle && isManual) return null;

  return (
    <View style={compassStyles.controlsGroup}>
      {showManualToggle
        && renderSegmentRow('Input', ['Auto', 'Manual'], isManual ? 1 : 0, index => onToggleManual(index === 1))}
      {!isManual && (
        <>
          {renderSegmentRow('Size', ['Normal', 'Enlarged'], isEnlarged ? 1 : 0,
            index => dispatch(setIsCompassEnlarged(index === 1)))}
          {renderSegmentRow('North', ['Fixed', 'Rotating'], isClassicCompass ? 0 : 1,
            index => dispatch(setIsClassicCompass(index === 0)))}
        </>
      )}
    </View>
  );
};

export default CompassControls;
