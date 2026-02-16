import React, {useRef, useState} from 'react';
import {View} from 'react-native';

import {Picker} from '@react-native-picker/picker';
import {useSelector} from 'react-redux';

import {SpotsList, SpotsListItem} from './index';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {PRIMARY_BACKGROUND_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import styles from '../../shared/ui/ui.styles';
import {ImageGallery} from '../images';
import {ReportsList} from '../reports';
import Samples from '../samples/Samples';

const pickerKeys = {SPOTS: 'spots', IMAGES: 'images', SAMPLES: 'samples', REPORTS: 'reports'};
const pickerLabels = {
  [pickerKeys.SPOTS]: 'SPOTS LISTS',
  [pickerKeys.SAMPLES]: 'SAMPLES',
  [pickerKeys.IMAGES]: 'IMAGE GALLERY',
  [pickerKeys.REPORTS]: 'REPORTS',
};

const SpotNavigator = ({closeSpotsNavigator, openNotebookPanel, openSpotInNotebook}) => {
  console.log('Rendering SpotsNavigator...');

  /* Data Hooks */

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const pickerRef = useRef();

  const [pickerKey, setPickerKey] = useState(pickerKeys.SPOTS);

  /* Logic Helpers */

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
        <Picker.Item label={pickerLabels[pickerKeys.SPOTS]} value={pickerKeys.SPOTS}/>
        <Picker.Item label={pickerLabels[pickerKeys.IMAGES]} value={pickerKeys.IMAGES}/>
        <Picker.Item label={pickerLabels[pickerKeys.SAMPLES]} value={pickerKeys.SAMPLES}/>
        <Picker.Item label={pickerLabels[pickerKeys.REPORTS]} value={pickerKeys.REPORTS}/>
      </Picker>
      {pickerKey === pickerKeys.SPOTS && <SpotsList onPress={openSpotInNotebook}/>}
      {pickerKey === pickerKeys.IMAGES && <ImageGallery openSpotInNotebook={openSpotInNotebook}/>}
      {pickerKey === pickerKeys.SAMPLES && (
        <Samples
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebookFromNavigator}
        />
      )}
      {pickerKey === pickerKeys.REPORTS && <ReportsList openSpotInNotebook={openSpotInNotebook}/>}
    </View>
  );
};

export default SpotNavigator;
