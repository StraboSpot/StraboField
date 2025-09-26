import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button, ButtonGroup} from '@rn-vui/base';
import DraggableFlatList, {ShadowDecorator} from 'react-native-draggable-flatlist';
import {useDispatch, useSelector} from 'react-redux';

import {TEPHRA_SUBPAGES} from './tephra.constants';
import tephraStyles from './tephra.styles';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setModalVisible} from '../home/home.slice';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const TephraPage = ({isReadOnly, page}) => {
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
          buttons={Object.values(subpages).map(v => toTitleCase(v.replace(/_/g, ' ')))}
          containerStyle={tephraStyles.buttonGroupContainer}
          onPress={i => setSelectedTypeIndex(i)}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
          selectedIndex={selectedTypeIndex}
          textStyle={{color: PRIMARY_TEXT_COLOR}}
        />
        <BasicPageDetail
          closeDetailView={() => setIsDetailView(false)}
          isReadOnly={isReadOnly}
          page={{...page, key: 'tephra', subkey: Object.values(subpages)[selectedTypeIndex]}}
          selectedFeature={selectedAttribute}
        />
      </>
    );
  };

  const renderAttributesMain = () => {
    return (
      <View style={tephraStyles.mainAttributesContainer}>
        <NotebookPageHeader onPressAdd={addAttribute} pageTitle={page.label} showAddButton={!isReadOnly}/>
        <View style={tephraStyles.draggableListContainer}>
          {data.length > 1 && (
            <Text
              style={{...commonStyles.listItemTitle, ...commonStyles.textBold, ...tephraStyles.textAlign}}>Top</Text>
          )}
          <DraggableFlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'No ' + page.label}/>}
            data={data}
            keyExtractor={item => item.id}
            onDragBegin={() => setIsReorderingActive(true)}
            onDragEnd={({data}) => setData(data)}
            renderItem={({item, getIndex, drag}) => (
              <ShadowDecorator>
                <BasicListItem
                  drag={Platform.OS === 'web' || isReadOnly ? undefined : drag}
                  editItem={editAttribute}
                  index={getIndex()}
                  isReorderingActive={isReorderingActive}
                  item={item}
                  page={page}
                />
              </ShadowDecorator>
            )}
          />
          {data.length > 1 && (
            <Text style={{...commonStyles.listItemTitle, ...commonStyles.textBold, ...tephraStyles.textAlign}}>
              Bottom
            </Text>
          )}
          {isReorderingActive && (
            <Button
              onPress={updateOrder}
              title={'Done Reordering ' + page.label}
              titleStyle={commonStyles.standardButtonText}
              type={'clear'}
            />
          )}
        </View>
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
