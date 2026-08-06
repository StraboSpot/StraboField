import React from 'react';
import {Platform, Pressable, ScrollView, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import footerStyles from './notebookFooter.styles';
import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import {AvatarWrapper} from '../../../shared/ui/avatars';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../../shared/ui/SectionDivider';
import usePage from '../../page/usePage';
import {addedNotebookPageOn, removedNotebookPageOn, setNotebookPageVisible} from '../notebook.slice';

const MorePagesMenu = ({
                         closeMorePagesMenu,
                         isRichSample,
                         visible,
                       }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const notebookPagesOn = useSelector(state => state.notebook.notebookPagesOn);

  const {getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();

  /* Derived Variables */

  const generalPagesToShow = getRelevantGeneralPages(isRichSample);
  const petPagesToShow = getRelevantPetPages(isRichSample);
  const sedPagesToShow = getRelevantSedPages(isRichSample);

  /* Logic Helpers */

  const switchPage = (key) => {
    dispatch(setNotebookPageVisible(key));
    closeMorePagesMenu();
  };

  const togglePageSwitch = (key) => {
    if (notebookPagesOn.includes(key)) dispatch(removedNotebookPageOn(key));
    else dispatch(addedNotebookPageOn(key));
  };

  /* Render Functions */

  const renderMenuItem = (page, isShowBottomDivider) => {
    return (
      <ListItem
        bottomDivider={isShowBottomDivider}
        containerStyle={footerStyles.morePagesListItem}
        key={page.key}
      >
        <ListItem.Content style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Pressable
            onPress={() => switchPage(page.key)}
            style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
            <AvatarWrapper
              size={20}
              source={page.icon_src}
            />
            <ListItem.Title style={footerStyles.morePagesListItemTitle}>
              {page.label}
            </ListItem.Title>
            {!!page.testing && <Text style={footerStyles.morePagesListItemTesting}>Testing</Text>}
          </Pressable>
          <View style={{paddingLeft: 5, paddingRight: Platform.OS === 'web' ? 10 : 0}}>
            <SwitchWrapper onValueChange={() => togglePageSwitch(page.key)} value={notebookPagesOn.includes(page.key)}/>
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeMorePagesMenu}
      headerTitle={isRichSample ? 'More Sample Pages' : 'More Pages'}
      isVisible={visible}
      onBackdropPress={closeMorePagesMenu}
      overlayStyleOverride={footerStyles.morePagesDialog}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <View style={{flex: 1, paddingBottom: 10, paddingLeft: 10, paddingRight: 10, paddingTop: 10}}>
        <ScrollView>
          {generalPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
          {!isEmpty(petPagesToShow) && (
            <>
              <SectionDivider dividerText={'Rocks & Minerals'}/>
              {petPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
            </>
          )}
          {!isEmpty(sedPagesToShow) && (
            <>
              <SectionDivider dividerText={'Sedimentology'}/>
              {sedPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
            </>
          )}
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default MorePagesMenu;
