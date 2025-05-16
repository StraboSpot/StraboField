import React from 'react';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SORTED_VIEWS} from './spots.constants';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {setSelectedButtonIndex, setSortedView} from '../main-menu-panel/mainMenuPanel.slice';

const SortingButtons = ({spots}) => {
  const dispatch = useDispatch();
  const selectedButtonIndex = useSelector(state => state.mainMenu.selectedButtonIndex);

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

  return (
    <ButtonGroup
      selectedIndex={selectedButtonIndex}
      buttons={['In Active\nDatasets', 'In Map\nExtent', 'In Recent\nViews']}
      containerStyle={{height: 50}}
      buttonStyle={{padding: 5}}
      selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
      textStyle={{fontSize: SMALL_TEXT_SIZE, textAlign: 'center'}}
      onPress={selected => updateIndex(selected)}
    />
  );
};

export default SortingButtons;
