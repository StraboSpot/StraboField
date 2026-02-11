import React, {useState} from 'react';
import {FlatList, Platform, ScrollView, View} from 'react-native';

import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import {imageStyles} from '../images';
import {TagsListItem, TagsModal} from '../tags';

const SampleModalGeologicUnits = ({checkedTagsIds, handleTagChecked}) => {

  const [isTagsListModalVisible, setIsTagsListModalVisible] = useState(false);

  const tags = useSelector(state => state.project.project?.tags) || [];

  const checkedTags = Object.values(tags).reduce((acc, tag) => {
    return checkedTagsIds.find(id => id.toString() === tag.id.toString()) ? [...acc, tag] : acc;
  }, []);

  const handleAddGeologicUnitsPressed = () => setIsTagsListModalVisible(true);

  return (
    <>
      <View>
        <SectionDivider dividerText={'Geologic Units'}/>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
          <OutlineButton
            icon={{
              color: commonStyles.iconColor.color,
              iconStyle: imageStyles.icon,
              name: 'plus-minus',
              type: 'material-community',
            }}
            onPress={handleAddGeologicUnitsPressed}
            title={'Add/Remove Geologic Units'}
          />
        </View>

        <View style={{paddingHorizontal: 5}}>
          {isEmpty(checkedTags) && <ListEmptyText text={'No Tags'}/>}
          {checkedTags.map(t => (
            <View
              key={t.id.toString()}
              style={{borderWidth: 0.75, padding: 2, margin: 2}}
            >
              <TagsListItem isChevronVisible={false} tag={t}/>
            </View>
          ))}
        </View>
      </View>

      {isTagsListModalVisible && (
        <ModalWrapper
          buttonTitleRight={'Done'}
          closeModal={() => setIsTagsListModalVisible(false)}
          headerTitle={'Add/Remove Geologic Units'}
          isVisible={isTagsListModalVisible}
          overlayStyleOverride={{height: '80%'}}
          showActionButton={false}
          showCancelButton={false}
          showCloseButton
        >
          {Platform.OS === 'web' ? (
            <ScrollView>
              <TagsModal checkedTagsIds={checkedTagsIds} handleTagChecked={handleTagChecked}/>
            </ScrollView>
          ) : (
            <FlatList
              ListHeaderComponent={<TagsModal checkedTagsIds={checkedTagsIds} handleTagChecked={handleTagChecked}/>}
            />
          )}
        </ModalWrapper>
      )}
    </>
  );
};

export default SampleModalGeologicUnits;
