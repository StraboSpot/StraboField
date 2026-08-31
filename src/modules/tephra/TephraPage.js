import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import DraggableFlatList, {ShadowDecorator} from 'react-native-draggable-flatlist';
import {useDispatch, useSelector} from 'react-redux';

import {TEPHRA_SUBPAGES} from './tephra.constants';
import tephraStyles from './tephra.styles';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty} from '../../shared/helpers';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import SubpageTabs from '../page/SubpageTabs';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const TephraPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getSiblingSurvey} = useForm();

  /* Local State */

  const [data1, setData] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [isDetailView, setIsDetailView] = useState(false);
  const [isReorderingActive, setIsReorderingActive] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({});
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);

  /* Derived Variables */

  const attributes = spot && spot.properties && spot.properties.tephra || [];

  /* Side Effects */

  useEffect(() => {
    console.log('UE TephraPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (!isEmpty(selectedAttributes)) {
      setSelectedAttribute(selectedAttributes[0]);
      setSelectedTypeIndex(0);
      setIsDetailView(true);
    }
    setData(attributes);
  }, [selectedAttributes, spot]);

  // Cleanup animations when component unmounts to prevent memory corruption
  useEffect(() => {
    return () => {
      setIsReorderingActive(false);
    };
  }, []);

  /* Logic Helpers */

  const addAttribute = () => {
    setIsReorderingActive(false);
    const initialValues = {
      label: spot.properties.name + '-' + ((spot.properties?.tephra?.length || 0) + 1),
      id: getNewUUID(),
    };
    setSelectedAttribute(initialValues);
    setSelectedTypeIndex(0);
    setIsDetailView(true);
    dispatch(setModalVisible({modal: null}));
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedTephraData = JSON.parse(JSON.stringify(spot.properties.tephra));
      attribute = {...attribute, id: getNewUUID()};
      editedTephraData[page.key].splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'tephra', value: editedTephraData}));
    }
    setSelectedTypeIndex(0);
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setModalVisible({modal: null}));
  };

  const updateOrder = () => {
    setIsReorderingActive(false);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'tephra', value: data1}));
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    const subpageKeys = Object.values(TEPHRA_SUBPAGES);
    const subpageKey = subpageKeys[selectedTypeIndex];
    // Both tabs edit the same layer, so a layer type left empty on Basic has to hold Save while Additional is
    // the tab being filled in
    const siblingSurvey = getSiblingSurvey(['tephra', subpageKey], subpageKeys);
    return (
      <>
        <BasicPageDetail
          PageTabsComponent={
            <SubpageTabs
              formCategory={'tephra'}
              invalidFields={invalidFields}
              onPress={i => setSelectedTypeIndex(i)}
              selectedIndex={selectedTypeIndex}
              subpageKeys={subpageKeys}
            />
          }
          closeDetailView={() => setIsDetailView(false)}
          isReadOnly={isReadOnly}
          page={{...page, key: 'tephra', subkey: subpageKey}}
          selectedFeature={selectedAttribute}
          setInvalidFields={setInvalidFields}
          siblingSurvey={siblingSurvey}
        />
      </>
    );
  };

  const renderAttributesMain = () => {
    return (
      <View style={tephraStyles.mainAttributesContainer}>
        <PageHeader onPressAdd={addAttribute} pageTitle={page.label} showAddButton={!isReadOnly}/>
        <View style={tephraStyles.draggableListContainer}>
          {data1.length > 1 && (
            <Text style={{...commonStyles.listItemTitle, ...commonStyles.textBold, ...tephraStyles.textAlign}}>
              Top
            </Text>
          )}
          <DraggableFlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText onPress={!isReadOnly && addAttribute} text={'No ' + page.label}/>}
            data={data1}
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
          {data1.length > 1 && (
            <Text style={{...commonStyles.listItemTitle, ...commonStyles.textBold, ...tephraStyles.textAlign}}>
              Bottom
            </Text>
          )}
          {isReorderingActive && <ClearButton onPress={updateOrder} title={'Done Reordering ' + page.label}/>}
        </View>
      </View>
    );
  };

  /* View */

  return isDetailView ? renderAttributeDetail() : renderAttributesMain();
};

export default TephraPage;
