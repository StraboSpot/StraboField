import React from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import drawGeometryTogglesStyles from './drawGeometryToggles.styles';
import commonStyles from '../../shared/common.styles';
import {toTitleCase} from '../../shared/Helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DRAW_ACTION_IMAGES} from '../home/buttons/drawActionButtons.constants';
import useDrawGeometryToggle from '../home/buttons/useDrawGeometryToggle';
import {MAP_MODES} from '../maps/maps.constants';

const DrawGeometryToggles = () => {
  const drawGeometries = useSelector(state => state.map.drawGeometries);

  const {handleLineLongPressed, handlePointLongPressed, handlePolygonLongPressed} = useDrawGeometryToggle();

  const defaultGeometries = [MAP_MODES.DRAW.POINT, MAP_MODES.DRAW.LINE, MAP_MODES.DRAW.POLYGON];

  const handleTogglePressed = (item, i) => {
    if (item === MAP_MODES.DRAW.POINT) handlePointLongPressed();
    else if (item === MAP_MODES.DRAW.LINE) handleLineLongPressed();
    else handlePolygonLongPressed();
  };

  const renderDrawGeometryToggleButtons = ({item}) => {
    const buttonsText = ['Sharp Vertices', 'Curved Vertices'];
    const pointButtonsText = ['Place on Map', 'Add to Current Location'];
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
              buttons={item === MAP_MODES.DRAW.POINT ? pointButtonsText : buttonsText}
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

  return (
    <>
      <SectionDivider dividerText={'Feature Geometry'} subtitle={'Toggle here or long press icons on map'}/>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={defaultGeometries}
        keyExtractor={item => item}
        renderItem={renderDrawGeometryToggleButtons}
      />
    </>
  );
};

export default DrawGeometryToggles;
