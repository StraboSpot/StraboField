import React, {useState} from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import MorePagesMenu from './MorePagesMenu';
import footerStyle from './notebookFooter.styles';
import {isEmpty} from '../../../shared/Helpers';
import IconButton from '../../../shared/ui/IconButton';
import {NOTEBOOK_PAGES} from '../../page/page.constants';
import usePage from '../../page/usePage';

const NotebookFooter = ({openPage}) => {
  const notebookPagesOn = useSelector(state => state.notebook.notebookPagesOn);
  const pagesState = useSelector(state => state.notebook.visibleNotebookPagesStack);

  const [isMorePagesMenuVisible, setIsMorePagesMenuVisible] = useState(false);

  const {getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();

  const notebookPageVisible = !isEmpty(pagesState) && pagesState.slice(-1)[0];
  const pagesToShow = [...getRelevantGeneralPages(), ...getRelevantPetPages(), ...getRelevantSedPages()];
  const notebookPagesValidOn = notebookPagesOn.filter(i => pagesToShow.find(p => p.key === i));

  const getPageIcon = (key) => {
    const page = NOTEBOOK_PAGES.find(p => p.key === key);
    return notebookPageVisible === key ? page.icon_pressed_src : page.icon_src;
  };

  return (
    <>
      <View
        style={notebookPagesValidOn.length <= 6 ? footerStyle.footerIconContainer : footerStyle.footerIconContainerWrap}
      >
        {notebookPagesValidOn.map(key => (
          <IconButton
            key={key}
            source={getPageIcon(key)}
            onPress={() => openPage(key)}
          />
        ))}
        <Button
          containerStyle={{alignSelf: 'center'}}
          buttonStyle={{padding: 15}}
          title={'MORE'}
          type={'clear'}
          titleStyle={footerStyle.morePagesButton}
          onPress={() => setIsMorePagesMenuVisible(true)}
        />
      </View>
      <MorePagesMenu
        visible={isMorePagesMenuVisible}
        closeMorePagesMenu={() => setIsMorePagesMenuVisible(false)}
      />
    </>
  );
};

export default NotebookFooter;
