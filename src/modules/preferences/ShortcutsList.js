import React from 'react';
import {FlatList, Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {SwitchWrapper} from '../../shared/ui';
import {AvatarWrapper} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setShortcutSwitchPositions} from '../home/home.slice';
import {MODAL_KEYS, SHORTCUT_MODALS} from '../page/page.constants';

const ShortcutsList = () => {
  const dispatch = useDispatch();
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);

  const toggleSwitch = (switchName) => {
    dispatch(setShortcutSwitchPositions({switchName: switchName}));
  };

  const renderShortcutListItem = (toggleButton) => {
    if (Platform.OS !== 'web' || (Platform.OS === 'web' && toggleButton.key !== MODAL_KEYS.SHORTCUTS.PHOTO
      && toggleButton.key !== MODAL_KEYS.SHORTCUTS.SKETCH)) {
      return (
        <ListItem containerStyle={[commonStyles.listItem, {marginHorizontal: -5}]}>
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
    <>
      <SectionDivider dividerText={'Shortcuts'} subtitle={'Shortucts will create a NEW spot at current location'}/>
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>All</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={() => toggleSwitch('all')} value={shortcutSwitchPositions.all}/>
      </ListItem>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={SHORTCUT_MODALS}
        keyExtractor={item => item.key}
        renderItem={({item}) => renderShortcutListItem(item)}
      />
    </>
  );
};

export default ShortcutsList;
