import React, {useEffect, useRef, useState} from 'react';
import {Text} from 'react-native';

import {Button, Input, ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {PRIMARY_BACKGROUND_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import SectionDivider from '../../shared/ui/SectionDivider';
import StandardModal from '../../shared/ui/StandardModal';
import formStyles from '../form/form.styles';
import {setLoadingStatus} from '../home/home.slice';
import overlayStyles from '../home/overlays/overlay.styles';
import useMapLocation from '../maps/useMapLocation';
import {setTestingMode} from '../project/projects.slice';

const Miscellaneous = () => {
  const dispatch = useDispatch();
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const {endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isTestingModalVisible, setIsTestingModalVisible] = useState(false);
  const [numRandomSpots, setNumRandomSpots] = useState(100);
  const [password, setPassword] = useState('');

  const {generateRandomsSpotsAroundCurrentLocation} = useMapLocation();

  const formRef = useRef('null');

  const errorMessage = 'Wrong Password!';
  const initialValues = {database_endpoint: endpoint};
  const testingModePassword = 'Strab0R0cks';

  useEffect(() => {
    console.log('UE Miscellaneous [password]', password);
    if (isEmpty(password)) setIsErrorMessage(false);
  }, [password]);

  const closeModal = () => {
    setIsTestingModalVisible(false);
    setIsErrorMessage(false);
  };

  const onTestingSwitchChange = (value) => {
    if (value) setIsTestingModalVisible(true);
    else dispatch(setTestingMode(false));
  };

  const userEntry = (value) => {
    setPassword(value);
  };

  const generateRandomSpots = async () => {
    const numRandomSpotsInt = parseInt(numRandomSpots, 10);
    if (numRandomSpotsInt) {
      setNumRandomSpots(numRandomSpotsInt);
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      await generateRandomsSpotsAroundCurrentLocation(numRandomSpotsInt);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    else alert('Error Generating Random Spots', 'The number of Spots must be an integer.');
  };

  const renderCustomEndpoint = () => (
    <>
      <SectionDivider dividerText={'Endpoint Selection'}/>
      <CustomEndpoint/>
    </>
  );

  const renderGenerateRandomSpotsSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Generate Random Spots'}/>
        <Input
          containerStyle={{paddingTop: 10}}
          defaultValue={numRandomSpots}
          inputContainerStyle={{backgroundColor: PRIMARY_BACKGROUND_COLOR, padding: 0}}
          inputStyle={formStyles.fieldValue}
          label={'Number of Spots'}
          labelStyle={{color: PRIMARY_TEXT_COLOR}}
          onChangeText={value => setNumRandomSpots(value || 100)}
          placeholder={JSON.stringify(numRandomSpots)}
          placeholderTextColor={themes.MEDIUMGREY}
        />
        <Button
          containerStyle={{paddingHorizontal: 10}}
          onPress={generateRandomSpots}
          title={'Generate'}
        />
      </>
    );
  };

  const renderPrompt = () => (
    <StandardModal
      closeModal={closeModal}
      dialogTitle={'Enter Password'}
      footerButtonsVisible={true}
      onPress={verifyPassword}
      visible={isTestingModalVisible}
    >
      <Text style={overlayStyles.importantText}>
        Data saved under pages that are in testing may NOT be compatible with future versions of StraboSpot.
      </Text>
      <Input
        defaultValue={''}
        errorMessage={isErrorMessage && errorMessage}
        onChangeText={userEntry}
        placeholder={'Password'}
        placeholderTextColor={themes.MEDIUMGREY}
      />
    </StandardModal>
  );

  const renderTestingModeField = () => (
    <>
      <SectionDivider dividerText={'Testing Mode'}/>
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>Use Testing Mode?</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={onTestingSwitchChange} value={isTestingMode}/>
      </ListItem>
    </>
  );

  const verifyPassword = () => {
    if (password === testingModePassword) {
      dispatch(setTestingMode(true));
      setIsTestingModalVisible(false);
    }
    else setIsErrorMessage(true);
  };

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting Form', values)}
      >
        <>
          {renderCustomEndpoint()}
          {renderTestingModeField()}
          {isTestingMode && renderGenerateRandomSpotsSection()}
          {renderPrompt()}
        </>
      </Formik>
    </>
  );
};

export default Miscellaneous;
