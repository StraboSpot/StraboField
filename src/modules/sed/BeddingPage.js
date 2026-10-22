import React, {useContext, useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import Form from '../form/Form';
import FormFlatList from '../form/FormFlatList';
import FormikWrapper from '../form/FormikWrapper';
import {setActiveModal} from '../home/home.slice';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import FeatureDetail from '../page/FeatureDetail';
import FeatureListItem from '../page/FeatureListItem';
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
  const {confirmLeavePage, goToNotebookPage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {saveSedFeature} = useSed();

  // A bed's detail view asks about its own changes while it shows in place of the shared bedding
  const [isDetailView, setIsDetailView] = useState(false);
  const beddingSharedRef = useRef(null);
  const {isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: beddingSharedRef,
    getMessage: () => 'Your shared bedding changes haven\'t been saved.',
    isAsking: !isDetailView,
    save: () => saveBeddingShared(beddingSharedRef.current),
  });

  /* Local State */

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

  /* Logic Helpers */

  // A bed's detail view takes the shared bedding form's place
  const addAttribute = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    setIsDetailView(true);
    setSelectedAttribute({id: getNewUUID()});
    dispatch(setActiveModal({modal: null}));
  };

  const cancelFormAndGo = () => goToNotebookPage(PAGE_KEYS.OVERVIEW);

  const editAttribute = async (attribute, i) => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    if (!attribute.id) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      attribute = {...attribute, id: getNewUUID()};
      editedSedData[page.key].beds.splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setActiveModal({modal: null}));
  };

  // Resolves whether the shared bedding was saved. A refusal has already alerted about the field it stopped on.
  const saveBeddingShared = async (formCurrent) => {
    try {
      await saveSedFeature(page.key, spot, formCurrent);
      markSaved();
      await formCurrent.resetForm();
      return true;
    }
    catch (err) {
      console.error('Error saving shared bedding', err);
      return false;
    }
  };

  const saveBeddingSharedAndGo = async () => {
    if (await saveBeddingShared(beddingSharedRef.current)) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    return (
      <FeatureDetail
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
            <FeatureListItem
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
                cancel={cancelFormAndGo}
                getIsDisabled={isFormInvalid}
                save={saveBeddingSharedAndGo}
              />
              <FormikWrapper
                enableReinitialize={true}
                formName={formName}
                initialValues={bedding}
                innerRef={beddingSharedRef}
                onReset={() => console.log('Resetting form...')}
                setIsFormDirty={setIsFormDirty}
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
