import React from 'react';
import {Text, View} from 'react-native';

import {FOLD_GEOMETRY_KEYS, FOLD_ICONS} from './';
import IconButton from '../../../shared/ui/IconButton';
import {formStyles, useForm} from '../../form';

const FoldGeometryChoices = ({
                               choices,
                               formProps,
                               survey,
                             }) => {
  const {getChoicesByKey, getRelevantFields} = useForm();

  const onGeometryChoiceButtonPress = (key, value) => {
    let updatedFormData = JSON.parse(JSON.stringify(formProps.values));
    if (updatedFormData[key] && updatedFormData[key] === value) delete updatedFormData[key];
    else updatedFormData[key] = value;
    formProps.setValues(updatedFormData);
  };

  return FOLD_GEOMETRY_KEYS.map((key) => {
    const foldGeometryField = getRelevantFields(survey, key)[0];
    const foldGeometryChoices = getChoicesByKey(survey, choices, key);
    return (
      <View style={{padding: 10}} key={key}>
        {foldGeometryField.label && (
          <View style={[formStyles.fieldLabelContainer, {paddingLeft: 10}]}>
            <Text style={formStyles.fieldLabel}>{foldGeometryField.label}</Text>
          </View>
        )}
        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap'}}>
          {foldGeometryChoices.map((c) => {
            return (
              FOLD_ICONS[key] && FOLD_ICONS[key].DEFAULT && FOLD_ICONS[key].DEFAULT[c.name] && FOLD_ICONS[key].PRESSED
              && FOLD_ICONS[key].PRESSED[c.name] && (
                <IconButton
                  key={c.name}
                  source={formProps.values[key] === c.name ? FOLD_ICONS[key].PRESSED[c.name] : FOLD_ICONS[key].DEFAULT[c.name]}
                  imageStyle={{margin: -5}}
                  onPress={() => onGeometryChoiceButtonPress(key, c.name)}
                />
              )
            );
          })}
        </View>
        <Text style={{paddingLeft: 10}}>
          {foldGeometryChoices.find(c => c.name === formProps.values[key])?.label}
        </Text>
      </View>
    );
  });
};

export default FoldGeometryChoices;
