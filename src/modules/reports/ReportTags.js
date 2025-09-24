import React, {useState} from 'react';
import {FlatList, Platform, ScrollView, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ButtonRounded from '../../shared/ui/buttons/ButtonRounded';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {imageStyles} from '../images';
import {TagsListItem, TagsModal} from '../tags';

const ReportTags = ({checkedTagsIds, handleTagChecked, handleTagPressed}) => {

  const {width} = useWindowSize();
  const itemWidth = 300;
  const listWidth = SMALL_SCREEN ? width - 30 : width * 0.80 - 30;

  const [isTagsListModalVisible, setIsTagsListModalVisible] = useState(false);

  const tags = useSelector(state => state.project.project?.tags) || [];

  const addAssociatedSpots = () => setIsTagsListModalVisible(true);

  const checkedTags = Object.values(tags).reduce((acc, tag) => {
    return checkedTagsIds.find(id => id.toString() === tag.id.toString()) ? [...acc, tag] : acc;
  }, []);

  return (
    <>
      <View>
        <SectionDivider dividerText={'Tags'}/>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
          <ButtonRounded
            buttonStyle={imageStyles.buttonContainer}
            icon={
              <Icon
                color={commonStyles.iconColor.color}
                iconStyle={imageStyles.icon}
                name={'plus-minus'}
                type={'material-community'}/>
            }
            onPress={addAssociatedSpots}
            title={'Add/Remove Tags'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
        </View>

        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5, paddingTop: 15}}>
          {isEmpty(checkedTags) && <ListEmptyText text={'No Tags'}/>}
          {checkedTags.map(t => (
            <TouchableOpacity
              key={t.id.toString()}
              style={{borderWidth: 0.75, padding: 2, margin: 2, width: listWidth < 600 ? listWidth : itemWidth}}
            >
              <TagsListItem isChevronVisible onPress={handleTagPressed} tag={t}/>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isTagsListModalVisible && (
        <ModalWrapper
          buttonTitleRight={'Done'}
          closeModal={() => setIsTagsListModalVisible(false)}
          headerTitle={'Add/Remove Tags'}
          isVisible={isTagsListModalVisible}
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
              ListHeaderComponent={
                <TagsModal checkedTagsIds={checkedTagsIds} handleTagChecked={handleTagChecked}/>
              }
            />
          )}
        </ModalWrapper>
      )}
    </>
  );
};

export default ReportTags;
