import React, {useContext} from 'react';
import {Text} from 'react-native';

import {useDispatch} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import {openFeatureInNotebook} from '../notebook-panel/notebook.helpers';
import {PAGE_KEYS} from '../page/pageKeys.constants';

// A sed rock is a lithology seen through its Lithology tab alone, so point to where the rest of it is
const SedRockLithologyNote = ({lithology}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  /* Event Handlers */

  // Shown on the sed rock's own detail page, which the link leaves
  const onLithologiesPagePress = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    openFeatureInNotebook(dispatch, PAGE_KEYS.LITHOLOGIES, lithology);
  };

  /* View */

  return (
    <Text style={[commonStyles.standardDescriptionText, commonStyles.textAlignCenter, {padding: 10}]}>
      Composition, Texture and Stratification are on the{' '}
      <Text onPress={onLithologiesPagePress} style={{color: PRIMARY_ACCENT_COLOR}}>
        Lithologies page
      </Text>.
    </Text>
  );
};

export default SedRockLithologyNote;
