import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {setNotebookPageVisible} from './notebook.slice';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_HEADER_TEXT_SIZE,
} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import {setModalVisible} from '../home/home.slice';
import mainMenuPanelStyles from '../main-menu-panel/mainMenuPanel.styles';
import {MODAL_KEYS, PAGE_KEYS} from '../page/page.constants';
import {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';

const NotebookPageHeader = ({
                              hideBackButton,
                              onPressAdd,
                              onPressBack,
                              pageTitle,
                              showAddButton,
                              showFeaturesTagButton,
                            }) => {
  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes);

  const returnToOverview = () => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));

  const selectTagsForFeatures = () => {
    if (isEmpty(selectedFeaturesForTagging)) {
      alert('No Features!', 'No features have been selected.');
      dispatch(setMultipleFeaturesTaggingEnabled(false));
    }
    else dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.FEATURE_TAGS}));
  };

  const toggleFeaturesTagButton = () => {
    dispatch(setMultipleFeaturesTaggingEnabled(!isMultipleFeaturesTaggingEnabled));
  };

  return (
    <>
      <View style={{flexDirection: 'row', backgroundColor: PRIMARY_BACKGROUND_COLOR}}>
        <View style={{alignItems: 'center', flexDirection: 'row', height: 40, justifyContent: 'flex-start', width: 70}}>
          {!hideBackButton && (
            <Icon
              iconStyle={mainMenuPanelStyles.buttons}
              name={'arrow-back'}
              onPress={onPressBack || returnToOverview}
              size={30}
              type={'ionicon'}
            />
          )}
        </View>
        <View style={{alignItems: 'center', flex: 1, justifyContent: 'center'}}>
          <Text style={{fontSize: PRIMARY_HEADER_TEXT_SIZE, fontWeight: 'bold'}}>{pageTitle}</Text>
        </View>
        <View style={{alignItems: 'center', flexDirection: 'row', height: 40, justifyContent: 'flex-end', width: 70}}>
          <View>
            {showFeaturesTagButton && (
              <Icon
                iconStyle={[mainMenuPanelStyles.buttons, {color: DARKGREY}]}
                name={'pricetags'}
                onPress={toggleFeaturesTagButton}
                size={20}
                type={'ionicon'}
              />
            )}
          </View>
          <View>
            {showAddButton && !isMultipleFeaturesTaggingEnabled && (
              <Icon
                color={PRIMARY_ACCENT_COLOR}
                name={'add'}
                onPress={onPressAdd}
                size={20}
                style={{paddingRight: 10}}
                type={'ionicon'}
              />
            )}
          </View>
        </View>
      </View>
      {isMultipleFeaturesTaggingEnabled && (
        <View style={{paddingHorizontal: 10, backgroundColor: PRIMARY_BACKGROUND_COLOR}}>
          <Text style={commonStyles.standardDescriptionText}>
            1. Select feature(s) to tag below.{'\n'}
            2. Hit 'Choose Tags to Apply button.{'\n'}
            *If features with different tags are selected, only common tags will appear selected.
            Checking a tag will apply it to all selected features.
          </Text>
          <OutlineButton
            onPress={selectTagsForFeatures}
            title={'Choose Tags to Apply'}
          />
        </View>
      )}
    </>
  );
};

export default NotebookPageHeader;
