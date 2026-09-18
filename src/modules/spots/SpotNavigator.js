import React, {useRef, useState} from 'react';
import {View} from 'react-native';

import {Picker} from '@react-native-picker/picker';
import {useDispatch, useSelector} from 'react-redux';

import {PICKER_KEYS, PICKER_LABELS} from './spots.constants';
import SpotsList from './SpotsList';
import SpotsListItem from './SpotsListItem';
import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import {PRIMARY_BACKGROUND_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import styles from '../../shared/ui/ui.styles';
import ImageGallery from '../images/ImageGallery';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import ReportsList from '../reports/ReportsList';
import Samples from '../samples/Samples';

const SpotNavigator = ({closeSpotsNavigator, openMainMenuPanel, openNotebookPanel, openSpotInNotebook}) => {
  console.log('Rendering SpotsNavigator...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const pickerRef = useRef();

  const [pickerKey, setPickerKey] = useState(PICKER_KEYS.SPOTS);

  /* Logic Helpers */

  const openDatasetsPage = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
    openMainMenuPanel();
  };

  const openSpotInNotebookFromNavigator = (spot, notebookPage, attributes) => {
    closeSpotsNavigator();
    openSpotInNotebook(spot, notebookPage, attributes);
  };

  /* View */

  return (
    <View style={{backgroundColor: SECONDARY_BACKGROUND_COLOR, flex: 1}}>
      <SectionDivider dividerText={'Current Spot'}/>
      {isEmpty(selectedSpot) ? <ListEmptyText text={'No Selected Spot'}/>
        : <SpotsListItem onPress={openSpotInNotebook} spot={selectedSpot}/>}
      <Picker
        itemStyle={{color: themes.BLACK}}
        onValueChange={setPickerKey}
        ref={pickerRef}
        selectedValue={pickerKey}
        style={[styles.sectionDividerText, {backgroundColor: PRIMARY_BACKGROUND_COLOR}]}
      >
        <Picker.Item label={PICKER_LABELS[PICKER_KEYS.SPOTS]} value={PICKER_KEYS.SPOTS}/>
        <Picker.Item label={PICKER_LABELS[PICKER_KEYS.IMAGES]} value={PICKER_KEYS.IMAGES}/>
        <Picker.Item label={PICKER_LABELS[PICKER_KEYS.SAMPLES]} value={PICKER_KEYS.SAMPLES}/>
        <Picker.Item label={PICKER_LABELS[PICKER_KEYS.REPORTS]} value={PICKER_KEYS.REPORTS}/>
      </Picker>
      {pickerKey === PICKER_KEYS.SPOTS && <SpotsList onPress={openSpotInNotebook} openDatasetsPage={openDatasetsPage}/>}
      {pickerKey === PICKER_KEYS.IMAGES && (
        <ImageGallery openDatasetsPage={openDatasetsPage} openSpotInNotebook={openSpotInNotebook}/>
      )}
      {pickerKey === PICKER_KEYS.SAMPLES && (
        <Samples
          openDatasetsPage={openDatasetsPage}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebookFromNavigator}
        />
      )}
      {pickerKey === PICKER_KEYS.REPORTS && <ReportsList openSpotInNotebook={openSpotInNotebook}/>}
    </View>
  );
};

export default SpotNavigator;
