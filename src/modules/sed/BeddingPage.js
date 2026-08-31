import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {Form, FormFlatList, FormikWrapper} from '../form';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useSed from '../sed/useSed';
import {editedSpotProperties} from '../spots/spots.slice';

const BeddingPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {saveSedFeature} = useSed();

  /* Local State */

  const beddingSharedRef = useRef(null);
  // The values already saved, so leaving straight afterwards does not ask about them again. The form's own
  // dirty flag is not enough on its own: the page can unmount in the same render pass as the save, leaving
  // this ref holding the form as it was before it.
  const savedValuesRef = useRef(null);

  const [isDetailView, setIsDetailView] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({});

  /* Derived Variables */

  const bedding = spot.properties?.sed?.bedding || {};

  /* Side Effects */

  useEffect(() => {
    // console.log('UE BeddingPage [selectedAttributes, spot]', selectedAttributes, spot);
    // console.log('Bedding:', bedding);
    if (!isEmpty(selectedAttributes)) {
      setSelectedAttribute(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  useLayoutEffect(() => {
    // console.log('ULE BeddingPage []');
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const addAttribute = async () => {
    if (beddingSharedRef.current?.dirty && !isEqual(beddingSharedRef.current.values, savedValuesRef.current)) {
      alert('Unsaved Changes',
        'Would you like to save your general bedding data and continue?',
        [
          {text: 'No', style: 'cancel'},
          {
            text: 'Yes', onPress: async () => {
              await saveSedFeature(page.key, spot, beddingSharedRef.current);
              savedValuesRef.current = {...beddingSharedRef.current.values};
              setIsDetailView(true);
              setSelectedAttribute({id: getNewUUID()});
              dispatch(setModalVisible({modal: null}));
            },
          },
        ],
        {cancelable: false},
      );
    }
    else {
      setIsDetailView(true);
      setSelectedAttribute({id: getNewUUID()});
      dispatch(setModalVisible({modal: null}));
    }
  };

  const confirmLeavePage = () => {
    if (beddingSharedRef.current?.dirty && !isEqual(beddingSharedRef.current.values, savedValuesRef.current)) {
      const formCurrent = beddingSharedRef.current;
      alert('Unsaved Changes',
        'Would you like to save your interval before continuing?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: () => saveBeddingShared(formCurrent)},
        ],
        {cancelable: false},
      );
    }
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      attribute = {...attribute, id: getNewUUID()};
      editedSedData[page.key].beds.splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setModalVisible({modal: null}));
  };

  const saveBeddingShared = async (formCurrent) => {
    await saveSedFeature(page.key, spot, formCurrent);
    savedValuesRef.current = {...formCurrent.values};
    await formCurrent.resetForm();
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        groupKey={'sed'}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedAttribute}
      />
    );
  };

  const renderAttributesMain = () => {
    const dividerText = 'Beds';
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader pageTitle={page.label}/>
        {renderBeddingShared()}
        {isReadOnly ? <SectionDivider dividerText={dividerText}/>
          : (
            <SectionDividerWithRightButton
              dividerText={dividerText}
              onPress={addAttribute}
            />
          )}
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText onPress={!isReadOnly && addAttribute} text={'No Beds'}/>}
          data={bedding.beds}
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

  const renderBeddingShared = () => {
    const formName = spot?.properties?.sed?.character === 'interbedded'
    || spot?.properties?.sed?.character === 'bed_mixed_lit' ? ['sed', 'bedding_shared_interbedded']
      : spot?.properties?.sed?.character === 'package_succe' ? ['sed', 'bedding_shared_package']
        : [];
    return (
      <View style={{maxHeight: 300}}>
        <SectionDivider dividerText={'Shared Bedding'}/>
        <FormFlatList
          ListEmptyComponent={
            <ListEmptyText
              text={'No shared bedding. Add bedding character of interbedded, mixed lithologies or package on the Interval Page first.'}
            />
          }
          data={formName}
        >
          {!isEmpty(formName) && (
            <>
              <SaveAndCancelButtons
                cancel={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
                getIsDisabled={isFormInvalid}
                save={() => saveBeddingShared(beddingSharedRef.current)}
              />
              <FormikWrapper
                enableReinitialize={true}
                formName={formName}
                initialValues={bedding}
                innerRef={beddingSharedRef}
                onReset={() => console.log('Resetting form...')}
                setIsFormInvalid={setIsFormInvalid}
              >
                {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
              </FormikWrapper>
            </>
          )}
        </FormFlatList>
      </View>
    );
  };

  /* View */

  return isDetailView ? renderAttributeDetail() : renderAttributesMain();
};

export default BeddingPage;
