import React from 'react';
import {Text} from 'react-native';

import {useDispatch} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {openFeatureInNotebook} from '../notebook-panel/notebook.helpers';
import {PAGE_KEYS} from '../page/pageKeys.constants';

// A sed rock is a lithology seen through its Lithology tab alone, so point to where the rest of it is
const SedRockLithologyNote = ({lithology}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* View */

  return (
    <Text style={[commonStyles.standardDescriptionText, commonStyles.textAlignCenter, {padding: 10}]}>
      Composition, Texture and Stratification are on the{' '}
      <Text
        onPress={() => openFeatureInNotebook(dispatch, PAGE_KEYS.LITHOLOGIES, lithology)}
        style={{color: PRIMARY_ACCENT_COLOR}}
      >
        Lithologies page
      </Text>.
    </Text>
  );
};

export default SedRockLithologyNote;
