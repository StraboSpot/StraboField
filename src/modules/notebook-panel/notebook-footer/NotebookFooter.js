import React, {useState} from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import MorePagesMenu from './MorePagesMenu';
import footerStyle from './notebookFooter.styles';
import {isEmpty} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {BLACK} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {NOTEBOOK_PAGES} from '../../page/page.constants';
import usePage from '../../page/usePage';

const NotebookFooter = ({openPage, isSample}) => {
  const notebookPagesOn = useSelector(state => state.notebook.notebookPagesOn);
  const pagesState = useSelector(state => state.notebook.visibleNotebookPagesStack);

  const [isMorePagesMenuVisible, setIsMorePagesMenuVisible] = useState(false);

  const {getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();

  const notebookPageVisible = !isEmpty(pagesState) && pagesState.slice(-1)[0];
  const pagesToShow = [...getRelevantGeneralPages(isSample), ...getRelevantPetPages(isSample), ...getRelevantSedPages(
    isSample)];
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
            onPress={() => openPage(key)}
            source={getPageIcon(key)}
          />
        ))}
        <ClearButton
          onPress={() => setIsMorePagesMenuVisible(true)}
          title={'MORE'}
          titleProps={{style: {color: BLACK, fontSize: themes.MEDIUM_TEXT_SIZE}}}
        />
      </View>
      <MorePagesMenu
        closeMorePagesMenu={() => setIsMorePagesMenuVisible(false)}
        isSample={isSample}
        visible={isMorePagesMenuVisible}
      />
    </>
  );
};

export default NotebookFooter;
