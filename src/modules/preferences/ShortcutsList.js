import React from 'react';
import {FlatList, Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import AvatarWrapper from '../../shared/ui/avatars/AvatarWrapper';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import SwitchWrapper from '../../shared/ui/SwitchWrapper';
import {setShortcutSwitchPositions} from '../home/home.slice';
import useShortcutSwitches from '../home/useShortcutSwitches';
import {SHORTCUT_MODALS} from '../page/page.constants';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ShortcutsList = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {isTargetDatasetMissing, shortcutSwitchPositions} = useShortcutSwitches();
  const toast = useToast();

  /* Logic Helpers */

  const toggleSwitch = (switchName) => {
    if (isTargetDatasetMissing && !shortcutSwitchPositions[switchName]) {
      toast.show('No Target Dataset. A target dataset needs\nto be set before turning on Shortcuts.',
        {placement: 'top', type: 'warning'});
      return;
    }
    dispatch(setShortcutSwitchPositions({switchName: switchName}));
  };

  /* Render Functions */

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

  /* View */

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
