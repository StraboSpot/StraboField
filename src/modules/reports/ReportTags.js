import React, {useState} from 'react';
import {FlatList, Platform, ScrollView, TouchableOpacity, View} from 'react-native';

import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {imageStyles} from '../images';
import {TagsListItem, TagsModal} from '../tags';

const itemWidth = 300;

const ReportTags = ({checkedTagsIds, handleTagChecked, handleTagPressed}) => {
  /* Data Hooks */

  const tags = useSelector(state => state.project.project?.tags) || [];

  const {width} = useWindowSize();

  /* Local State */

  const [isTagsListModalVisible, setIsTagsListModalVisible] = useState(false);

  /* Derived Variables */

  const checkedTags = Object.values(tags).reduce((acc, tag) => {
    return checkedTagsIds.find(id => id.toString() === tag.id.toString()) ? [...acc, tag] : acc;
  }, []);
  const listWidth = SMALL_SCREEN ? width - 30 : width * 0.80 - 30;

  /* Logic Helpers */

  const addAssociatedSpots = () => setIsTagsListModalVisible(true);

  /* View */

  return (
    <>
      <View>
        <SectionDivider dividerText={'Tags'}/>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
          <OutlineButton
            icon={{
              color: commonStyles.iconColor.color,
              iconStyle: imageStyles.icon,
              name: 'plus-minus',
              type: 'material-community',
            }}
            onPress={addAssociatedSpots}
            title={'Add/Remove Tags'}
          />
        </View>

        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5}}>
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
          overlayStyleOverride={{maxHeight: '60%', flex: 1}}
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

export default ReportTags;
