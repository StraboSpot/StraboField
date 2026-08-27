import React from 'react';
import {Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';

import {toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, WARNING_COLOR} from '../../shared/styles.constants';
import TruncatedText from '../../shared/ui/TruncatedText';
import {useForm} from '../form';

// The tabs of a feature edited across several subpages. The field in error is not always on the tab being shown -
// choosing a siliciclastic type on Lithology asks for a grain size over on Texture - so each tab holding one is
// marked as the place to go and fix it.
const SubpageTabs = ({formCategory, invalidFields = [], onPress, selectedIndex, subpageKeys}) => {
  /* Data Hooks */

  const {getSurvey} = useForm();

  /* Render Functions */

  // The asterisk sits beside the label, not inside it, so truncating a long label cannot cut the mark off
  const renderTab = (subpageKey) => {
    const hasInvalidField = getSurvey([formCategory, subpageKey]).some(f => invalidFields.includes(f.name));
    return (
      <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'center'}}>
        <TruncatedText style={{flexShrink: 1}} title={toTitleCase(subpageKey.replace(/_/g, ' '))}/>
        {hasInvalidField && <Text style={{color: WARNING_COLOR}}> *</Text>}
      </View>
    );
  };

  /* View */

  return (
    <ButtonGroup
      buttonStyle={{padding: 5}}
      buttons={subpageKeys.map(subpageKey => ({element: () => renderTab(subpageKey)}))}
      containerStyle={{borderRadius: 10, height: 40}}
      onPress={onPress}
      selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
      selectedIndex={selectedIndex}
    />
  );
};

export default SubpageTabs;
