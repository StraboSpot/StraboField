import React, {useEffect} from 'react';
import {FlatList, Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {SwitchWrapper} from '../../shared/ui';
import {AvatarWrapper} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setShortcutSwitchPositions} from '../home/home.slice';
import {SHORTCUT_MODALS} from '../page/page.constants';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ShortcutsList = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);
  const toast = useToast();

  /* Derived Variables */

  const isTargetDatasetMissing = isEmpty(targetDatasetId);

  /* Side Effects */

  useEffect(() => {
    if (!isTargetDatasetMissing) return;
    if (Object.values(shortcutSwitchPositions).some(Boolean)) {
      dispatch(setShortcutSwitchPositions({switchName: 'all', value: false}));
    }
  }, [dispatch, isTargetDatasetMissing, shortcutSwitchPositions]);

  /* Logic Helpers */

  const toggleSwitch = (switchName) => {
    if (isReadOnlyProject) return;
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
            disabled={isReadOnlyProject}
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
        <SwitchWrapper disabled={isReadOnlyProject} onValueChange={() => toggleSwitch('all')}
                       value={shortcutSwitchPositions.all}/>
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
