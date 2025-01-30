import React, {useEffect, useRef, useState} from 'react';
import {Switch, Text} from 'react-native';

import {Formik} from 'formik';
import {Button, Input, ListItem} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import SectionDivider from '../../shared/ui/SectionDivider';
import StandardModal from '../../shared/ui/StandardModal';
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

  const initialValues = {database_endpoint: endpoint};
  const testingModePassword = 'Strab0R0cks';
  const errorMessage = 'Wrong Password!';

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
          inputContainerStyle={{padding: 0}}
          label={'Number of Spots'}
          labelStyle={{color: themes.PRIMARY_TEXT_COLOR}}
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
      visible={isTestingModalVisible}
      dialogTitle={'Enter Password'}
      footerButtonsVisible={true}
      onPress={verifyPassword}
      closeModal={closeModal}
    >
      <Text style={overlayStyles.importantText}>
        Data saved under pages that are in testing may NOT be compatible with future versions of StraboSpot.
      </Text>
      <Input
        placeholder={'Password'}
        placeholderTextColor={themes.MEDIUMGREY}
        defaultValue={''}
        onChangeText={userEntry}
        errorMessage={isErrorMessage && errorMessage}
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
        <Switch
          value={isTestingMode}
          onValueChange={onTestingSwitchChange}
        />
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
    <Formik
      innerRef={formRef}
      onSubmit={values => console.log('Submitting Form', values)}
      initialValues={initialValues}
      enableReinitialize
    >
      <>
        {renderCustomEndpoint()}
        {renderTestingModeField()}
        {isTestingMode && renderGenerateRandomSpotsSection()}
        {renderPrompt()}
      </>
    </Formik>
  );
};

export default Miscellaneous;
