import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button, ButtonGroup} from '@rn-vui/base';
import DraggableFlatList, {ShadowDecorator} from 'react-native-draggable-flatlist';
import {useDispatch, useSelector} from 'react-redux';

import {TEPHRA_SUBPAGES} from './tephra.constants';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const TephraPage = ({page}) => {
  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [data, setData] = useState([]);
  const [isDetailView, setIsDetailView] = useState(false);
  const [isReorderingActive, setIsReorderingActive] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({});
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);

  const attributes = spot && spot.properties && spot.properties.tephra || [];

  useEffect(() => {
    console.log('UE TephraPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (!isEmpty(selectedAttributes)) {
      setSelectedAttribute(selectedAttributes[0]);
      setIsDetailView(true);
    }
    setData(attributes);
  }, [selectedAttributes, spot]);

  const addAttribute = () => {
    setIsReorderingActive(false);
    dispatch(setModalVisible({modal: page.key}));
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedTephraData = JSON.parse(JSON.stringify(spot.properties.tephra));
      attribute = {...attribute, id: getNewUUID()};
      editedTephraData[page.key].splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'tephra', value: editedTephraData}));
    }
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setModalVisible({modal: null}));
  };

  const renderAttributeDetail = () => {
    const subpages = TEPHRA_SUBPAGES;
    return (
      <>
        <ButtonGroup
          selectedIndex={selectedTypeIndex}
          onPress={i => setSelectedTypeIndex(i)}
          buttons={Object.values(subpages).map(v => toTitleCase(v.replace(/_/g, ' ')))}
          containerStyle={{height: 40, borderRadius: 10}}
          buttonStyle={{padding: 5}}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
          textStyle={{color: PRIMARY_TEXT_COLOR}}
        />
        <BasicPageDetail
          closeDetailView={() => setIsDetailView(false)}
          page={{...page, key: 'tephra', subkey: Object.values(subpages)[selectedTypeIndex]}}
          selectedFeature={selectedAttribute}
        />
      </>
    );
  };

  const renderAttributesMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <ReturnToOverviewButton/>
        <SectionDividerWithRightButton
          dividerText={page.label}
          onPress={addAttribute}
        />
        {data.length > 1 && (
          <Text style={{...commonStyles.listItemTitle, ...commonStyles.textBold, paddingLeft: 10}}>Top</Text>
        )}
        <DraggableFlatList
          keyExtractor={item => item.id}
          data={data}
          onDragBegin={() => setIsReorderingActive(true)}
          onDragEnd={({data}) => setData(data)}
          renderItem={({item, getIndex, drag}) => (
            <ShadowDecorator>
              <BasicListItem
                drag={Platform.OS === 'web' ? undefined : drag}
                item={item}
                index={getIndex()}
                page={page}
                editItem={editAttribute}
                isReorderingActive={isReorderingActive}
              />
            </ShadowDecorator>
          )}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No ' + page.label}/>}
        />
        {data.length > 1 && (
          <Text style={{...commonStyles.listItemTitle, ...commonStyles.textBold, paddingLeft: 10}}>Bottom</Text>
        )}
        {isReorderingActive && (
          <Button
            onPress={updateOrder}
            type={'clear'}
            title={'Done Reordering ' + page.label}
            titleStyle={commonStyles.standardButtonText}
          />
        )}
      </View>
    );
  };

  const updateOrder = () => {
    setIsReorderingActive(false);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'tephra', value: data}));
  };

  return isDetailView ? renderAttributeDetail() : renderAttributesMain();
};

export default TephraPage;
