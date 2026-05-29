import React from 'react';
import {Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import tagStyles from '../tags/tags.styles';

const TemplatesOverflowMenuModal = ({
                                      closeMenu,
                                      isVisible,
                                      onAddPress,
                                      onBackupPress,
                                      onLoadPress,
                                    }) => {

  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);

  /* View */

  return (
    <ModalWrapper
      closeModal={closeMenu}
      headerTitle={'Template Options'}
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
          <ListItem.Title style={commonStyles.listItemTitle}>{'Create New Template'}</ListItem.Title>
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
            style={commonStyles.listItemTitle}>{Platform.OS === 'ios' ? 'Load Templates' : 'Import Templates'}</ListItem.Title>
        </ListItem>
      )}
      <ListItem
        containerStyle={commonStyles.listItem}
        onPress={() => {
          onBackupPress();
          closeMenu();
        }}
      >
        <ListItem.Title
          style={commonStyles.listItemTitle}>{Platform.OS === 'ios' ? 'Backup Templates' : 'Export Templates'}</ListItem.Title>
      </ListItem>
    </ModalWrapper>
  );
};

export default TemplatesOverflowMenuModal;
