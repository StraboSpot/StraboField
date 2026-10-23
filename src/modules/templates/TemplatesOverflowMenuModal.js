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

  /* Derived Variables */

  // A read only project can only have its templates backed up
  const menuItems = [
    ...(isReadOnlyProject ? [] : [
      {onPress: onAddPress, title: 'Create New Template'},
      {onPress: onLoadPress, title: Platform.OS === 'ios' ? 'Load Templates' : 'Import Templates'},
    ]),
    {onPress: onBackupPress, title: Platform.OS === 'ios' ? 'Backup Templates' : 'Export Templates'},
  ];

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
      {menuItems.map(({onPress, title}, i) => (
        <ListItem
          bottomDivider={i < menuItems.length - 1}
          containerStyle={commonStyles.listItem}
          key={title}
          onPress={() => {
            onPress();
            closeMenu();
          }}
        >
          <ListItem.Title style={commonStyles.listItemTitle}>{title}</ListItem.Title>
        </ListItem>
      ))}
    </ModalWrapper>
  );
};

export default TemplatesOverflowMenuModal;
