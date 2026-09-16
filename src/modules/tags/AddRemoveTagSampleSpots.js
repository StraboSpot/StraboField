import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useTags from './useTags';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/side-panel/SidePanelHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import Samples from '../samples/Samples';

const AddRemoveTagSampleSpots = ({openSpotInNotebook}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {addRemoveSpotFromTag} = useTags();

  /* Event Handlers */

  // Only a sample that has become a Spot of its own can carry a tag. Picking any other used to tag the Spot
  // holding it, which is a different record than the one asked for, so it is answered instead
  const handleSampleChecked = (sample, parentSpot) => {
    if (sample.properties?.isSample) addRemoveSpotFromTag(sample.properties.id, selectedTag);
    else alertGiveSampleItsOwnSpot(sample, parentSpot);
  };

  /* Logic Helpers */

  // Add Data to Sample in the notebook footer is what gives a sample a Spot of its own, so offer to go there
  const alertGiveSampleItsOwnSpot = (sample, parentSpot) => {
    alert(
      'Add Data to Sample First',
      `${sample.sample_id_name || 'This sample'} can't be tagged until it holds its own data. Continue to the `
      + 'sample, press Add Data to Sample at the bottom of the notebook, then tag it here.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Sample', onPress: () => openSpotInNotebook(parentSpot, PAGE_KEYS.SAMPLES, [sample])},
      ],
      {cancelable: false},
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}))}
        headerTitle={!isEmpty(selectedTag) && `Add/Remove ${selectedTag.name}`}
        title={`${selectedTag.name}`}
      />
      <View style={{...commonStyles.buttonContainer, flex: 1}}>
        <Samples
          checkedItems={selectedTag?.spots || []}
          isCheckedList
          onChecked={handleSampleChecked}
        />
      </View>
    </View>
  );
};

export default AddRemoveTagSampleSpots;
