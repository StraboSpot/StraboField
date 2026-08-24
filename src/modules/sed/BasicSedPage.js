import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {INTERPRETATIONS_SUBPAGES, LITHOLOGY_SUBPAGES, STRUCTURE_SUBPAGES} from './sed.constants';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import TruncatedText from '../../shared/ui/TruncatedText';
import {useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const BasicSedPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getSurvey} = useForm();

  /* Local State */

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({});
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);

  /* Derived Variables */

  const attributes = spot && spot.properties && spot.properties.sed && spot.properties.sed[page.key] || [];

  /* Side Effects */

  useEffect(() => {
    // console.log('UE BasicSedPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (!isEmpty(selectedAttributes)) {
      setSelectedAttribute(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const addAttribute = () => {
    setIsDetailView(true);
    setSelectedAttribute({id: getNewUUID()});
    dispatch(setModalVisible({modal: null}));
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      attribute = {...attribute, id: getNewUUID()};
      editedSedData[page.key].splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setModalVisible({modal: null}));
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    const subpages = page.key === PAGE_KEYS.LITHOLOGIES ? LITHOLOGY_SUBPAGES
      : page.key === PAGE_KEYS.STRUCTURES ? STRUCTURE_SUBPAGES
        : page.key === PAGE_KEYS.INTERPRETATIONS ? INTERPRETATIONS_SUBPAGES
          : undefined;
    if (subpages) {
      const subpageKeys = Object.values(subpages);
      const subpageKey = subpageKeys[selectedTypeIndex];
      // Every tab edits the same attribute, so a choice made on one can leave a field on another behind. The
      // tab being shown does its own clearing; these are the fields it cannot see
      const siblingSurvey = subpageKeys.filter(k => k !== subpageKey).flatMap(k => getSurvey(['sed', k]));
      return (
        <>
          <BasicPageDetail
            PageTabsComponent={
              <ButtonGroup
                buttonStyle={{padding: 5}}
                buttons={Object.values(subpages).map(
                  v => ({element: () => <TruncatedText title={toTitleCase(v.replace(/_/g, ' '))}/>}))}
                containerStyle={{height: 40, borderRadius: 10}}
                onPress={i => setSelectedTypeIndex(i)}
                selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
                selectedIndex={selectedTypeIndex}
              />
            }
            closeDetailView={() => setIsDetailView(false)}
            groupKey={'sed'}
            isReadOnly={isReadOnly}
            page={{...page, key: subpageKey}}
            selectedFeature={selectedAttribute}
            siblingSurvey={siblingSurvey}
          />
        </>
      );
    }
    else {
      return (
        <BasicPageDetail
          closeDetailView={() => setIsDetailView(false)}
          groupKey={'sed'}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selectedAttribute}
        />
      );
    }
  };

  const renderAttributesMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader onPressAdd={addAttribute} pageTitle={page.label} showAddButton={!isReadOnly}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={
            <ListEmptyText onPress={!isReadOnly && addAttribute} text={'No ' + page.label}/>
          }
          data={attributes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (
            <BasicListItem
              editItem={itemToEdit => editAttribute(itemToEdit, index)}
              index={index}
              item={item}
              page={page}
            />
          )}
        />
      </View>
    );
  };

  /* View */

  return isDetailView ? renderAttributeDetail() : renderAttributesMain();
};

export default BasicSedPage;
