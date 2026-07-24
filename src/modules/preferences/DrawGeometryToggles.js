import React from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import drawGeometryTogglesStyles from './drawGeometryToggles.styles';
import FreehandVertexSpacing from './FreehandVertexSpacing';
import {DEFAULT_GEOMETRIES, POINT_BUTTONS_TEXT, TAP_FREEHAND_BUTTONS_TEXT} from './preferences.constants';
import commonStyles from '../../shared/common.styles';
import {toTitleCase} from '../../shared/helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DRAW_ACTION_IMAGES} from '../home/buttons/drawActionButtons.constants';
import useDrawGeometryToggle from '../home/buttons/useDrawGeometryToggle';
import {MAP_MODES} from '../maps/maps.constants';

const DrawGeometryToggles = () => {
  /* Data Hooks */

  const drawGeometries = useSelector(state => state.map.drawGeometries);

  const {handleLineLongPressed, handlePointLongPressed, handlePolygonLongPressed} = useDrawGeometryToggle();

  /* Event Handlers */

  const handleTogglePressed = (item, i) => {
    if (item === MAP_MODES.DRAW.POINT) handlePointLongPressed();
    else if (item === MAP_MODES.DRAW.LINE) handleLineLongPressed();
    else handlePolygonLongPressed();
  };

  /* Render Functions */

  const renderDrawGeometryToggleButtons = ({item}) => {
    const itemEnum = item.toUpperCase();
    return (
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{toTitleCase(item)}</ListItem.Title>
          <View style={drawGeometryTogglesStyles.drawGeometryRow}>
            <AvatarWrapper
              size={40}
              source={DRAW_ACTION_IMAGES[itemEnum].BUTTON}
            />
            <ButtonGroup
              buttons={item === MAP_MODES.DRAW.POINT ? POINT_BUTTONS_TEXT : TAP_FREEHAND_BUTTONS_TEXT}
              containerStyle={drawGeometryTogglesStyles.drawGeometrySwitch}
              onPress={i => handleTogglePressed(item, i)}
              selectedButtonStyle={drawGeometryTogglesStyles.selectedButton}
              selectedIndex={drawGeometries[item] === item ? 0 : 1}
              textStyle={drawGeometryTogglesStyles.buttonGroupText}
            />
            <AvatarWrapper
              size={40}
              source={item === MAP_MODES.DRAW.POINT ? DRAW_ACTION_IMAGES[itemEnum].LOCATION_BUTTON
                : DRAW_ACTION_IMAGES[itemEnum].FREEHAND_BUTTON}
            />
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  /* View */

  return (
    <>
      <SectionDivider dividerText={'Feature Geometry'} subtitle={'Toggle here or long press icons on map'}/>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={DEFAULT_GEOMETRIES}
        keyExtractor={item => item}
        renderItem={renderDrawGeometryToggleButtons}
      />
      <FreehandVertexSpacing/>
    </>
  );
};

export default DrawGeometryToggles;
