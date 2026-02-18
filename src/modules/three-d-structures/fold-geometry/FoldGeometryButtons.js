import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import {FOLD_GEOMETRY_KEYS, FOLD_ICONS} from './';
import {SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {formStyles} from '../../form';

const FoldGeometryButtons = ({formProps, setChoicesViewKey}) => {
  /* Logic Helpers */

  const FoldGeometryEditButton = () => (
    <Button
      buttonStyle={[formStyles.formButtonSmall, {
        // height: 49,
        // width: 49,
        backgroundColor: SECONDARY_BACKGROUND_COLOR,
        padding: 0,
      }]}
      containerStyle={{paddingTop: 0}}
      onPress={() => setChoicesViewKey('fold_geometry')}
      title={'Edit\nGeometry'}
      titleProps={{
        style: [formStyles.formButtonTitle, {fontSize: 10, textAlign: 'center'}],
        numberOfLines: 2,
        textAlign: 'center',
      }}
      type={'outline'}
    />
  );

  /* Render Functions */

  const renderFoldGeometryIcons = () => {
    let foldGeometryData = [];
    FOLD_GEOMETRY_KEYS.forEach((key) => {
      if (formProps?.values[key]) {
        const iconSource = FOLD_ICONS[key] && FOLD_ICONS[key].PRESSED
          && FOLD_ICONS[key].PRESSED[formProps?.values[key]]
          && (
            <IconButton
              imageStyle={{margin: -5}}
              key={key}
              source={FOLD_ICONS[key].PRESSED[formProps?.values[key]]}
            />
          );
        if (iconSource) foldGeometryData.push(iconSource);
      }
    });
    return foldGeometryData;
  };

  /* View */

  return (
    <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, paddingTop: 2.5, paddingBottom: 5}}>
      <View style={{flex: 3, flexDirection: 'row', justifyContent: 'flex-start'}}>{renderFoldGeometryIcons()}</View>
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
        <FoldGeometryEditButton/>
      </View>
    </View>
  );

};

export default FoldGeometryButtons;
