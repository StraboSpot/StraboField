import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import usePetrology from './usePetrology';
import commonStyles from '../../shared/common.styles';
import {getNewCopyId, isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {FormikWrapper, SelectInputField} from '../form';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';

const MineralsPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getMineralTitle} = usePetrology();
  const {getSpotById, getSpotsWithKey} = useSpots();

  /* Local State */

  const preFormRef = useRef(null);

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedMineral, setSelectedMineral] = useState({});
  const [spotsWithMinerals, setSpotsWithMinerals] = useState([]);

  /* Side Effects */

  useEffect(() => {
    console.log('UE MineralsPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE MineralsPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedMineral({});
    else {
      setSelectedMineral(selectedAttributes[0]);
      setIsDetailView(true);
    }
    getSpotsWithMinerals();
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const addMineral = () => {
    dispatch(setModalVisible({modal: page.key}));
  };

  const copyMineralData = (spotId) => {
    const spotToCopy = getSpotById(spotId);
    if (!isEmpty(spotToCopy)) {
      const mineralsToCopy = JSON.parse(JSON.stringify(spotToCopy.properties.pet[page.key]));
      mineralsToCopy.forEach((mineral, i) => {
        if (mineral.modal) delete mineralsToCopy[i].modal;
        mineralsToCopy[i].id = getNewCopyId();
      });
      const updatedMinerals = spot.properties?.pet && spot.properties.pet[page.key]
        ? [...spot.properties.pet[page.key], ...mineralsToCopy] : mineralsToCopy;
      const updatedPet = spot.properties?.pet ? {...spot.properties.pet, minerals: updatedMinerals}
        : {minerals: updatedMinerals};
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'pet', value: updatedPet}));
      preFormRef.current.resetForm();
    }
  };

  const editMineral = (mineral) => {
    setIsDetailView(true);
    setSelectedMineral(mineral);
    dispatch(setModalVisible({modal: null}));
  };

  const getSpotsWithMinerals = () => {
    const allSpotsWithPet = getSpotsWithKey('pet');
    setSpotsWithMinerals(allSpotsWithPet.filter(s => s.properties.id !== spot.properties.id
      && s.properties.pet && s.properties.pet[page.key]));
  };

  /* Render Functions */

  const renderCopyDataSelectBox = () => {
    return (
      <FormikWrapper initialValues={{}} innerRef={preFormRef}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field key={'spot_id_for_pet_copy'} name={'spot_id_for_pet_copy'}>
              {({field, form}) => (
                <SelectInputField
                  {...field}
                  choices={spotsWithMinerals.map(s => ({label: s.properties.name, value: s.properties.id}))}
                  errors={form.errors}
                  label={'Copy ' + page.label + ' Data From:'}
                  setFieldValue={(name, value) => {
                    form.setFieldValue(name, value);
                    copyMineralData(value);
                  }}
                  single={true}
                />
              )}
            </Field>
          </ListItem.Content>
        </ListItem>
      </FormikWrapper>
    );
  };

  const renderMineralDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        groupKey={'pet'}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedMineral}
      />
    );
  };

  const renderMineralsList = () => {
    let mineralData = spot.properties.pet && spot.properties.pet[page.key] || [];
    if (!Array.isArray(mineralData)) mineralData = [];
    const mineralDataSorted = mineralData.slice().sort((a, b) => getMineralTitle(a).localeCompare(getMineralTitle(b)));
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText onPress={!isReadOnly && addMineral} text={'There are no minerals at this Spot.'}/>
        }
        data={mineralDataSorted}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({item}) => <BasicListItem editItem={editMineral} item={item} page={page}/>}
      />
    );
  };

  const renderMineralsMain = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader onPressAdd={addMineral} pageTitle={page.label} showAddButton={!isReadOnly}/>
        {!isReadOnly && renderCopyDataSelectBox()}
        {renderMineralsList()}
      </View>
    );
  };

  /* View */

  return isDetailView ? renderMineralDetail() : renderMineralsMain();
};

export default MineralsPage;
