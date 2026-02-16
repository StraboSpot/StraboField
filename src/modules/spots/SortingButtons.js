import React from 'react';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SORTED_VIEWS} from './spots.constants';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {setSelectedButtonIndex, setSortedView} from '../main-menu-panel/mainMenuPanel.slice';

const SortingButtons = ({spots}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const selectedButtonIndex = useSelector(state => state.mainMenu.selectedButtonIndex);

  /* Logic Helpers */

  const updateIndex = (buttonIndex) => {
    dispatch(setSelectedButtonIndex({index: buttonIndex}));
    switch (buttonIndex) {
      case 0:
        console.log('Chronological Selected', spots);
        dispatch(setSortedView({view: SORTED_VIEWS.CHRONOLOGICAL}));
        break;
      case 1:
        console.log('Map Extent Selected');
        dispatch(setSortedView({view: SORTED_VIEWS.MAP_EXTENT}));
        break;
      case 2:
        console.log('Recent Selected');
        dispatch(setSortedView({view: SORTED_VIEWS.RECENT_VIEWS}));
        break;
    }
  };

  /* View */

  return (
    <ButtonGroup
      buttonStyle={{padding: 5}}
      buttons={['In Visible\nDatasets', 'In Map\nExtent', 'In Recent\nViews']}
      containerStyle={{height: 50}}
      onPress={selected => updateIndex(selected)}
      selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
      selectedIndex={selectedButtonIndex}
      textStyle={{fontSize: SMALL_TEXT_SIZE, textAlign: 'center'}}
    />
  );
};

export default SortingButtons;
