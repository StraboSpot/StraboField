import React, {useRef, useState} from 'react';

import {Picker} from '@react-native-picker/picker';
import {useSelector} from 'react-redux';

import {SpotsList, SpotsListItem} from './index';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import styles from '../../shared/ui/ui.styles';
import {ImageGallery} from '../images';
import {ReportsList} from '../reports';
import SamplesMenuItem from '../samples/SamplesMenuItem';
import * as themes from '../../shared/styles.constants';

const SpotNavigator = ({closeSpotsNavigator, openNotebookPanel, openSpotInNotebook}) => {
  console.log('Rendering SpotsNavigator...');

  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const pickerRef = useRef();

  const pickerKeys = {SPOTS: 'spots', IMAGES: 'images', SAMPLES: 'samples', REPORTS: 'reports'};
  const [pickerKey, setPickerKey] = useState(pickerKeys.SPOTS);

  const pickerLabels = {
    [pickerKeys.SPOTS]: 'SPOTS LISTS',
    [pickerKeys.SAMPLES]: 'SAMPLES',
    [pickerKeys.IMAGES]: 'IMAGE GALLERY',
    [pickerKeys.REPORTS]: 'REPORTS',
  };

  const openSpotInNotebookFromNavigator = (spot, notebookPage, attributes) => {
    closeSpotsNavigator();
    openSpotInNotebook(spot, notebookPage, attributes);
  };

  return (
    <>
      <SectionDivider dividerText={'Current Spot'}/>
      {isEmpty(selectedSpot) ? <ListEmptyText text={'No Selected Spot'}/>
        : <SpotsListItem onPress={openSpotInNotebook} spot={selectedSpot}/>}
      <Picker
        onValueChange={setPickerKey}
        ref={pickerRef}
        selectedValue={pickerKey}
        style={styles.sectionDividerText}
        itemStyle={{color: themes.BLACK}}
      >
        <Picker.Item label={pickerLabels[pickerKeys.SPOTS]} value={pickerKeys.SPOTS}/>
        <Picker.Item label={pickerLabels[pickerKeys.IMAGES]} value={pickerKeys.IMAGES}/>
        <Picker.Item label={pickerLabels[pickerKeys.SAMPLES]} value={pickerKeys.SAMPLES}/>
        <Picker.Item label={pickerLabels[pickerKeys.REPORTS]} value={pickerKeys.REPORTS}/>
      </Picker>
      {pickerKey === pickerKeys.SPOTS && <SpotsList onPress={openSpotInNotebook}/>}
      {pickerKey === pickerKeys.IMAGES && <ImageGallery openSpotInNotebook={openSpotInNotebook}/>}
      {pickerKey === pickerKeys.SAMPLES && (
        <SamplesMenuItem
          openSpotInNotebook={openSpotInNotebookFromNavigator}
          openNotebookPanel={openNotebookPanel}
        />
      )}
      {pickerKey === pickerKeys.REPORTS && <ReportsList openSpotInNotebook={openSpotInNotebook}/>}
    </>
  );
};

export default SpotNavigator;
