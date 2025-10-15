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
import {SpotsList, SpotsListItem} from '../spots';

const ReportSpots = ({checkedSpotsIds, handleSpotChecked, handleSpotPressed, updateSpotsInMapExtent}) => {

  const {height, width} = useWindowSize();
  const itemWidth = 300;
  const listWidth = SMALL_SCREEN ? width - 30 : width * 0.80 - 30;

  const [isSpotsListModalVisible, setIsSpotsListModalVisible] = useState(false);

  const spots = useSelector(state => state.spot.spots);

  const addAssociatedSpots = () => setIsSpotsListModalVisible(true);

  const checkedSpots = Object.entries(spots).reduce((acc, [spotId, spotObj]) => {
    return checkedSpotsIds.find(id => id.toString() === spotId) ? [...acc, spotObj] : acc;
  }, []);

  return (
    <>
      <View>
        <SectionDivider dividerText={'Associated Spots'}/>
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
            title={'Add/Remove Spots'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
          {/*<ButtonRounded*/}
          {/*  icon={*/}
          {/*    <Icon*/}
          {/*      name={'lasso'}*/}
          {/*      type={'material-community'}*/}
          {/*      iconStyle={imageStyles.icon}*/}
          {/*      color={commonStyles.iconColor.color}/>*/}
          {/*  }*/}
          {/*  title={'Add Spots with Lasso'}*/}
          {/*  titleStyle={commonStyles.standardButtonText}*/}
          {/*  buttonStyle={imageStyles.buttonContainer}*/}
          {/*  type={'outline'}*/}
          {/*  onPress={addAssociatedSpots}*/}
          {/*/>*/}
        </View>

        <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5, paddingTop: 15}}>
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
