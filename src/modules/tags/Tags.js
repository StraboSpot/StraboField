import React, {useState} from 'react';
import {View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import AddButton from '../../shared/ui/buttons/AddButton';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';
import {PAGE_KEYS, PRIMARY_PAGES} from '../page/page.constants';
import {setSelectedTag, setUseContinuousTagging} from '../project/projects.slice';
import {TagDetailModal, TagsList} from '../tags';

const Tags = ({type, updateSpotsInMapExtent}) => {
  console.log('Rendering Tags...');

  const dispatch = useDispatch();
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pageKey = type === PAGE_KEYS.GEOLOGIC_UNITS ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const page = PRIMARY_PAGES.find(p => p.key === pageKey);
  const label = page.label;

  const addTag = () => {
    const newTag = type === PAGE_KEYS.GEOLOGIC_UNITS ? {type: PAGE_KEYS.GEOLOGIC_UNITS} : {type: 'concept'};
    dispatch(setSelectedTag(newTag));
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const getButtonTitle = () => {
    if (type === PAGE_KEYS.GEOLOGIC_UNITS) return ['Alphabetical', 'Map Extent'];
    return ['Categorized', 'Map Extent'];
  };

  const handleContinuousTaggingSwitched = value => dispatch(setUseContinuousTagging(value));

  return (
    <View style={{flex: 1}}>
      {!isEmpty(tags) && (
        <>
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={getButtonTitle()}
            containerStyle={{height: 50}}
            onPress={index => setSelectedIndex(index)}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedIndex}
            textStyle={{fontSize: 12}}
          />
          {selectedIndex === 1 && (
            <UpdateSpotsInMapExtentButton
              title={`Update ${label} in Map Extent`}
              updateSpotsInMapExtent={updateSpotsInMapExtent}
            />
          )}
        </>
      )}
      <AddButton
        onPress={addTag}
        title={`Create New ${toTitleCase(label).slice(0, -1)}`}
        type={'outline'}
      />
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{`Continuous ${label}`}</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={handleContinuousTaggingSwitched} value={useContinuousTagging}/>
      </ListItem>
      <TagsList selectedIndex={selectedIndex} type={type}/>
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
    </View>
  );
};

export default Tags;
