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
} from '../../shared/styles.constants';
import Modal from '../../shared/ui/modal/Modal';
import SaveAndCloseModalButtons from '../../shared/ui/SaveAndCloseModalButtons';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddTephraModal = ({onPress}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [tabIndex, setTabIndex] = React.useState(0);

  const formRef = useRef(null);
  const {showErrors, validateForm} = useForm();

  const pageKey = PAGE_KEYS.TEPHRA;

  useEffect(() => {
    console.log('UE AddTephraModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  const renderNotebookTephraModal = () => {
    const subpages = TEPHRA_SUBPAGES;
    const formName = [pageKey, Object.values(subpages)[tabIndex]];
    return (
      <Modal
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : dispatch(setModalVisible({modal: null}))}
        buttonTitleRight={choicesViewKey && 'Done'}
        onPress={onPress}
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
          bounces={false}
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                innerRef={formRef}
                initialValues={{}}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={false}
              >
                {formProps => (
                  <View style={{flex: 1}}>
                    <Form {...{formName: formName, ...formProps}}/>
                  </View>
                )}
              </Formik>
            </View>
          }
        />
        {!choicesViewKey && <SaveAndCloseModalButtons saveAction={saveTephra}/>}
      </Modal>
    );
  };

  const saveTephra = async () => {
    try {
      await formRef.current.submitForm();
      const editedTephraLayerData = showErrors(formRef.current);
      console.log('Saving tephra data to Spot ...');
      let editedTephraLayersData = spot.properties.tephra ? JSON.parse(
        JSON.stringify(spot.properties.tephra)) : [];
      editedTephraLayersData.push({...editedTephraLayerData, id: getNewUUID()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedTephraLayersData}));
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  return renderNotebookTephraModal();
};

export default AddTephraModal;
