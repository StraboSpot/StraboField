import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {DEFAULT_GEOLOGIC_TYPES} from './project.constants';
import {addedCustomFeatureTypes} from './projects.slice';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {useSpots} from '../spots';

const CustomFeatureTypes = () => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const projectFeatures = useSelector(state => state.project.project?.other_features);

  const {getActiveSpotsObj} = useSpots();

  const [refresh] = useState();

  /* Derived Variables */

  const customFeatureTypes = projectFeatures
    && projectFeatures.filter(feature => !DEFAULT_GEOLOGIC_TYPES.includes(feature));

  /* Logic Helpers */

  const deleteCustomFeature = (feature) => {
    let projectFeaturesCopy = projectFeatures.filter(projectFeature => feature !== projectFeature);
    dispatch(addedCustomFeatureTypes(projectFeaturesCopy));
    return true;
  };

  const deleteCustomFeatureValidation = (feature) => {
    let allSpots = Object.values(getActiveSpotsObj());
    let isValidDelete = true;
    let spotsWithOtherFeatures = allSpots.filter(
      spot => spot.properties.other_features && spot.properties.other_features.length > 0);
    if (!isEmpty(spotsWithOtherFeatures)) {
      spotsWithOtherFeatures.map((spot) => {
        let otherFeatures = spot.properties.other_features;
        let featuresWithFeatureType = otherFeatures.filter(spotFeature => feature === spotFeature.type);
        if (!isEmpty(featuresWithFeatureType)) {
          alert('Type in Use',
            'This type is being used in spots, please remove this type from spots before deleting this type');
          isValidDelete = false;
        }
      });
      if (!isValidDelete) return false;
    }
    deleteFeatureConfirm(feature);
  };

  const deleteFeatureConfirm = (feature) => {
    alert('Delete Feature ' + toTitleCase(feature),
      'Are you sure you would like to delete ' + feature + '?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => deleteCustomFeature(feature),
        },
      ],
      {cancelable: false},
    );
  };

  /* Render Functions */

  const renderFeature = (feature) => {
    return (
      <View>
        <ListItem containerStyle={commonStyles.listItem} key={feature.name}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <ListItem.Title style={commonStyles.listItemTitle}>{feature}</ListItem.Title>
            <Icon
              color={themes.WARNING_COLOR}
              name={'trash'}
              onPress={() => deleteCustomFeatureValidation(feature)}
              size={20}
              style={{paddingHorizontal: 5}}
              type={'ionicon'}
            />
          </ListItem.Content>
        </ListItem>
      </View>
    );
  };

  /* View */

  return (
    <>
      <SectionDivider dividerText={'Custom Feature Types'}/>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No custom feature types added yet. '
          + 'Add a custom feature type in Other Features tab of a spot by selecting'
          + ' the type \'other\' when adding a feature.'}/>}
        data={customFeatureTypes}
        extraData={refresh}
        keyExtractor={item => item.toString()}
        renderItem={item => renderFeature(item.item)}
      />
    </>
  );
};

export default CustomFeatureTypes;
