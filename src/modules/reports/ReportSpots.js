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
import {SpotsList, SpotsListItem} from '../spots';

const itemWidth = 300;

const ReportSpots = ({checkedSpotsIds, handleSpotChecked, handleSpotPressed, updateSpotsInMapExtent}) => {
  /* Data Hooks */

  const spots = useSelector(state => state.spot.spots);

  const {width} = useWindowSize();

  /* Local State */

  const [isSpotsListModalVisible, setIsSpotsListModalVisible] = useState(false);

  /* Derived Variables */

  const checkedSpots = Object.entries(spots).reduce((acc, [spotId, spotObj]) => {
    return checkedSpotsIds.find(id => id.toString() === spotId) ? [...acc, spotObj] : acc;
  }, []);
  const listWidth = SMALL_SCREEN ? width - 30 : width * 0.80 - 30;

  /* Logic Helpers */

  const addAssociatedSpots = () => setIsSpotsListModalVisible(true);

  /* View */

  return (
    <>
      <View>
        <SectionDivider dividerText={'Associated Spots'}/>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
          <OutlineButton
            icon={{
              color: commonStyles.iconColor.color,
              iconStyle: imageStyles.icon,
              name: 'plus-minus',
              type: 'material-community',
            }}
            onPress={addAssociatedSpots}
            title={'Add/Remove Spots'}
          />
        </View>

        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5}}>
          {isEmpty(checkedSpots) && <ListEmptyText text={'No Associated Spots'}/>}
          {checkedSpots.map(d => (
            <TouchableOpacity
              key={d.properties.id.toString()}
              style={{borderWidth: 0.75, padding: 2, margin: 2, width: listWidth < 600 ? listWidth : itemWidth}}
            >
              <SpotsListItem onPress={handleSpotPressed} spot={d}/>
            </TouchableOpacity>
          ))}
        </View>

      </View>
      {isSpotsListModalVisible && (
        <ModalWrapper
          closeModal={() => setIsSpotsListModalVisible(false)}
          headerTitle={'Add/Remove Spots'}
          overlayStyleOverride={{maxHeight: '60%', flex: 1}}
          showActionButton={false}
          showCancelButton={false}
          showCloseButton
        >
          {Platform.OS === 'web' ? (
            <ScrollView>
              <SpotsList
                checkedItems={checkedSpotsIds}
                isCheckedList={true}
                onChecked={handleSpotChecked}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
            </ScrollView>
          ) : (
            <FlatList
              ListHeaderComponent={
                <SpotsList
                  checkedItems={checkedSpotsIds}
                  isCheckedList={true}
                  onChecked={handleSpotChecked}
                  updateSpotsInMapExtent={updateSpotsInMapExtent}
                />
              }
            />
          )}
        </ModalWrapper>
      )}
    </>
  );
};

export default ReportSpots;
