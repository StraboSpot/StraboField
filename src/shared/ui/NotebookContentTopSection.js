import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ButtonRounded from './ButtonRounded';
import {setModalVisible} from '../../modules/home/home.slice';
import {imageStyles} from '../../modules/images';
import {setNotebookPageVisible} from '../../modules/notebook-panel/notebook.slice';
import {MODAL_KEYS, PAGE_KEYS} from '../../modules/page/page.constants';
import ReturnToOverviewButton from '../../modules/page/ui/ReturnToOverviewButton';
import {setMultipleFeaturesTaggingEnabled} from '../../modules/project/projects.slice';
import commonStyles from '../common.styles';
import {isEmpty} from '../Helpers';
import alert from './alert';

const NotebookContentTopSection = ({returnToOverviewAction}) => {
  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes);

  const selectFeaturesToTag = () => {
    dispatch(setMultipleFeaturesTaggingEnabled(true));
  };

  const selectTagsForFeatures = () => {
    if (isEmpty(selectedFeaturesForTagging)) {
      alert('No Features!', 'No features have been selected.');
      dispatch(setMultipleFeaturesTaggingEnabled(false));
    }
    else dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.FEATURE_TAGS}));
  };

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <ReturnToOverviewButton
          onPress={() => {
            dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
            if (returnToOverviewAction) returnToOverviewAction();
          }}
        />
        {isMultipleFeaturesTaggingEnabled ? (
          <ButtonRounded
            buttonStyle={[imageStyles.buttonContainer, {padding: 5}]}
            onPress={selectTagsForFeatures}
            title={'Select Tags'}
            titleStyle={commonStyles.standardDescriptionText}
            type={'outline'}
          />
        ) : (
          <ButtonRounded
            buttonStyle={[imageStyles.buttonContainer, {padding: 5}]}
            onPress={selectFeaturesToTag}
            title={'Tag/Untag Features(s)'}
            titleStyle={commonStyles.standardDescriptionText}
            type={'outline'}
          />
        )}
      </View>
      {isMultipleFeaturesTaggingEnabled && (
        <Text style={[{textAlign: 'justify', paddingHorizontal: 10, paddingBottom: 10}]}>
          1. Select feature(s) to tag below.{'\n'}
          2. Hit Select Tags button.{'\n'}
          *If features with different tags are selected, only common tags will appear selected.
          Checking a tag will apply it to all selected features.
        </Text>
      )}
    </View>
  );
};

export default NotebookContentTopSection;
