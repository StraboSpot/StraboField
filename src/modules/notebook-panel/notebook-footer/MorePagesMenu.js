import React from 'react';
import {Platform, Pressable, ScrollView, Text, View} from 'react-native';

import {ListItem, Overlay} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import footerStyles from './notebookFooter.styles';
import {isEmpty} from '../../../shared/Helpers';
import {SwitchWrapper} from '../../../shared/ui';
import {AvatarWrapper} from '../../../shared/ui/avatars';
import SectionDivider from '../../../shared/ui/SectionDivider';
import overlayStyles from '../../home/overlays/overlay.styles';
import usePage from '../../page/usePage';
import {addedNotebookPageOn, removedNotebookPageOn, setNotebookPageVisible} from '../notebook.slice';

const MorePagesMenu = ({
                         closeMorePagesMenu,
                         visible,
                       }) => {
  const dispatch = useDispatch();
  const notebookPagesOn = useSelector(state => state.notebook.notebookPagesOn);

  const {getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();

  const generalPagesToShow = getRelevantGeneralPages();
  const petPagesToShow = getRelevantPetPages();
  const sedPagesToShow = getRelevantSedPages();

  const switchPage = (key) => {
    dispatch(setNotebookPageVisible(key));
    closeMorePagesMenu();
  };

  const togglePageSwitch = (key) => {
    if (notebookPagesOn.includes(key)) dispatch(removedNotebookPageOn(key));
    else dispatch(addedNotebookPageOn(key));
  };

  const renderMenuItem = (page, isShowBottomDivider) => {
    return (
      <ListItem
        bottomDivider={isShowBottomDivider}
        containerStyle={footerStyles.morePagesListItem}
        key={page.key}
      >
        <ListItem.Content style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Pressable
            style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}
            onPress={() => switchPage(page.key)}>
            <AvatarWrapper
              size={20}
              source={page.icon_src}
            />
            <ListItem.Title style={footerStyles.morePagesListItemTitle}>{page.label}</ListItem.Title>
          </Pressable>
          <View style={{paddingLeft: 5, paddingRight: Platform.OS === 'web' ? 10 : 0}}>
            <SwitchWrapper onValueChange={() => togglePageSwitch(page.key)} value={notebookPagesOn.includes(page.key)}/>
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      overlayStyle={footerStyles.morePagesDialog}
      isVisible={visible}
      onBackdropPress={closeMorePagesMenu}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={overlayStyles.titleText}>More Pages</Text>
      </View>
      <View style={{flex: 1, paddingBottom: 10, paddingLeft: 10, paddingRight: 10, paddingTop: 10}}>
        <ScrollView>
          {generalPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
          {!isEmpty(petPagesToShow) && (
            <>
              <SectionDivider
                dividerText={'Rocks & Minerals'}
                style={footerStyles.morePagesSectionDivider}
              />
              {petPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
            </>
          )}
          {!isEmpty(sedPagesToShow) && (
            <>
              <SectionDivider
                dividerText={'Sedimentology'}
                style={footerStyles.morePagesSectionDivider}
              />
              {sedPagesToShow.map((page, i, arr) => renderMenuItem(page, i < arr.length - 1))}
            </>
          )}
        </ScrollView>
      </View>
    </Overlay>
  );
};

export default MorePagesMenu;
