import React from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {SwitchWrapper} from '../../../shared/ui';
import {AvatarWrapper} from '../../../shared/ui/avatars';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {setShortcutSwitchPositions} from '../../home/home.slice';
import {MODAL_KEYS, SHORTCUT_MODALS} from '../../page/page.constants';

const ShortcutMenu = () => {
  const dispatch = useDispatch();
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);

  const toggleSwitch = (switchName) => {
    dispatch(setShortcutSwitchPositions({switchName: switchName}));
  };

  const renderShortcutListItem = (toggleButton) => {
    if (Platform.OS !== 'web' || (Platform.OS === 'web'
      && toggleButton.key !== MODAL_KEYS.SHORTCUTS.PHOTO && toggleButton.key !== MODAL_KEYS.SHORTCUTS.SKETCH)) {
      return (
        <ListItem containerStyle={commonStyles.listItem}>
          <AvatarWrapper
            size={40}
            source={toggleButton.icon_src}
          />
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>{toggleButton.label}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper
            onValueChange={() => toggleSwitch(toggleButton.key)}
            value={shortcutSwitchPositions[toggleButton.key]}
          />
        </ListItem>
      );
    }
  };

  return (
    <View style={{flex: 1, flexDirection: 'column'}}>
      <SectionDivider dividerText={'Shortcuts'}/>
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>All</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={() => toggleSwitch('all')} value={shortcutSwitchPositions.all}/>
      </ListItem>
      <View>
        <FlatList
          keyExtractor={item => item.key}
          data={SHORTCUT_MODALS}
          renderItem={({item}) => renderShortcutListItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
        />
      </View>
      <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
        <Text style={commonStyles.standardDescriptionText}>*Shortcuts will create a NEW spot</Text>
      </View>
    </View>
  );
};

export default ShortcutMenu;
