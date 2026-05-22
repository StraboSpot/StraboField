import React from 'react';
import {Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import tagStyles from './tags.styles';
import commonStyles from '../../shared/common.styles';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const TagsOverflowMenuModal = ({
                                 closeMenu,
                                 isVisible,
                                 label,
                                 onAddPress,
                                 onBackupPress,
                                 onContinuousTaggingSwitched,
                                 onLoadPress,
                                 useContinuousTagging,
                               }) => {

  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);

  /* Derived Variables */

  const singularLabel = label.slice(0, -1);

  /* View */

  return (
    <ModalWrapper
      closeModal={closeMenu}
      headerTitle={`${singularLabel} Options`}
      isVisible={isVisible}
      onBackdropPress={closeMenu}
      overlayStyleOverride={tagStyles.overflowMenuModal}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      {!isReadOnlyProject && (
        <ListItem
          bottomDivider
          containerStyle={commonStyles.listItem}
          onPress={() => {
            onAddPress();
            closeMenu();
          }}
        >
          <ListItem.Title style={commonStyles.listItemTitle}>{`Create New ${singularLabel}`}</ListItem.Title>
        </ListItem>
      )}
      {!isReadOnlyProject && (
        <ListItem
          bottomDivider
          containerStyle={commonStyles.listItem}
          onPress={() => {
            onLoadPress();
            closeMenu();
          }}
        >
          <ListItem.Title
            style={commonStyles.listItemTitle}>{Platform.OS === 'ios' ? `Load ${label}` : `Import ${label}`}</ListItem.Title>
        </ListItem>
      )}
      <ListItem
        bottomDivider
        containerStyle={commonStyles.listItem}
        onPress={() => {
          onBackupPress();
          closeMenu();
        }}
      >
        <ListItem.Title
          style={commonStyles.listItemTitle}>{Platform.OS === 'ios' ? `Backup ${label}` : `Export ${label}`}</ListItem.Title>
      </ListItem>
      {!isReadOnlyProject && (
        <ListItem containerStyle={commonStyles.listItem}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>{`Continuous ${label}`}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper onValueChange={onContinuousTaggingSwitched} value={useContinuousTagging}/>
        </ListItem>
      )}
    </ModalWrapper>
  );
};

export default TagsOverflowMenuModal;
