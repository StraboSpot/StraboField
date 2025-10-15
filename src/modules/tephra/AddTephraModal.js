import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Tab} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {TEPHRA_SUBPAGES} from './tephra.constants';
import {getNewUUID, toTitleCase} from '../../shared/Helpers';
import {
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_SCREEN,
} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddTephraModal = ({onPress}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  const formRef = useRef(null);
  const {validateForm} = useForm();

  const pageKey = PAGE_KEYS.TEPHRA;

  useEffect(() => {
    console.log('UE AddTephraModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const renderNotebookTephraModal = () => {
    const subpages = TEPHRA_SUBPAGES;
    const formName = [pageKey, Object.values(subpages)[tabIndex]];
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : closeModal()}
        onPress={onPress}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <Tab
          indicatorStyle={{backgroundColor: PRIMARY_ACCENT_COLOR, height: 3}}
          onChange={setTabIndex}
          value={tabIndex}
        >
          {Object.values(subpages).map((subpage, i) => (
            <Tab.Item
              buttonStyle={{backgroundColor: SECONDARY_BACKGROUND_COLOR, padding: 0}}
              containerStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
              key={subpage}
              title={toTitleCase(subpage.replace(/interval_/g, ' '))}
              titleProps={{numberOfLines: 1}}
              titleStyle={{color: PRIMARY_TEXT_COLOR, fontSize: PRIMARY_TEXT_SIZE, fontWeight: 'bold'}}
            />
          ))}
        </Tab>
        <FlatList
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                initialValues={{}}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={true}
              >
                {(formProps) => {
                  return (
                    <View style={{flex: 1}}>
                      <Form {...{formName: formName, ...formProps}}/>
                    </View>
                  );
                }}
              </Formik>
            </View>
          }
          bounces={false}
        />
        {!choicesViewKey && <ActionButton onPress={saveTephra}/>}
      </ModalWrapper>
    );
  };

  const saveTephra = async () => {
    try {
      const errors = await formRef.current.validateForm(); // Runs validation
      const isValid = Object.keys(errors).length === 0;

      if (!isValid) {
        console.log('Validation errors found:', errors);
        await formRef.current.setTouched(
          Object.keys(errors).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {}),
          true,
        );

        return; // Don't proceed with saving
      }
      const values = formRef.current.values;
      console.log('Saving tephra data to Spot ...');
      let editedTephraLayersData = spot.properties.tephra ? JSON.parse(
        JSON.stringify(spot.properties.tephra)) : [];
      editedTephraLayersData.push({...values, id: getNewUUID()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedTephraLayersData}));
      if (SMALL_SCREEN) closeModal();
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  return renderNotebookTephraModal();
};

export default AddTephraModal;
