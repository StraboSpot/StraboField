import React, {useState} from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import MorePagesMenu from './MorePagesMenu';
import footerStyle from './notebookFooter.styles';
import {isEmpty} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import {BLACK, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {NOTEBOOK_PAGES} from '../../page/page.constants';
import usePage from '../../page/usePage';
import useSamples from '../../samples/useSamples';

const NotebookFooter = ({openPage, isRichSample, registerGetValues, selectedSample}) => {
  /* Data Hooks */

  const notebookPagesOn = useSelector(state => state.notebook.notebookPagesOn);
  const pagesState = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getAllRelevantPages} = usePage();
  const {createRichSample} = useSamples();

  /* Local State */

  const [isMorePagesMenuVisible, setIsMorePagesMenuVisible] = useState(false);

  /* Derived Variables */

  const pagesToShow = getAllRelevantPages(isRichSample);
  const notebookPagesValidOn = notebookPagesOn.filter(i => pagesToShow.find(p => p.key === i));
  const notebookPageVisible = !isEmpty(pagesState) && pagesState.slice(-1)[0];

  /* Event Handlers */

  // The new sample is made from whatever is typed in the open sample form, not from the stored version, so an
  // edit that was never saved is carried into the conversion rather than left behind on a Spot that is about to
  // give the sample up. Taking the values also leaves nothing unsaved to prompt about, which the conversion
  // could only have asked once the Spot the answer belonged to had already been replaced.
  const convertToRichSample = async () => {
    try {
      const editedSample = await registerGetValues?.current?.();
      createRichSample(spot, editedSample || selectedSample);
    }
    catch (err) {
      // The form refused the values and has said why, so leave the sample as it is for the fields to be fixed
      console.error('Sample not converted to a rich sample', err);
    }
  };

  /* Logic Helpers */

  const getPageIcon = (key) => {
    const page = NOTEBOOK_PAGES.find(p => p.key === key);
    return notebookPageVisible === key ? page.icon_pressed_src : page.icon_src;
  };

  /* View */

  return (
    <View style={footerStyle.footerContainer}>
      {(!isEmpty(selectedSample) && !isRichSample) ? (
        <View style={[footerStyle.footerIconContainer, {padding: 5}]}>
          <ClearButton
            icon={{
              color: PRIMARY_ACCENT_COLOR,
              name: 'add',
              size: 20,
            }}
            onPress={convertToRichSample}
            title={'Add Data to Sample'}
            titleProps={{style: {color: PRIMARY_ACCENT_COLOR, fontSize: themes.MEDIUM_TEXT_SIZE}}}
          />
        </View>
      ) : (
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
            isRichSample={isRichSample}
            visible={isMorePagesMenuVisible}
          />
        </>
      )}
    </View>
  );
};

export default NotebookFooter;
