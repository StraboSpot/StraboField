import React, {useEffect, useRef, useState} from 'react';
import {Switch, Text} from 'react-native';

import {Button, Input, ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import SpotDataModelModal from './SpotDataModelModal';
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
import {setTestingMode, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpots} from '../spots/spots.slice';

const Miscellaneous = () => {
  const dispatch = useDispatch();
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const spots = useSelector(state => state.spot.spots);
  const {endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isSpotDataModelModalVisible, setIsSpotDataModelModalVisible] = useState(false);
  const [isTestingModalVisible, setIsTestingModalVisible] = useState(false);
  const [numRandomSpots, setNumRandomSpots] = useState(100);
  const [password, setPassword] = useState('');

  const toast = useToast();
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

  const convertStrikeDipDirection = () => {
    if (isEmpty(spots)) toast.show('No Spots Found.', {placement: 'top'});
    else {
      const spotsEdited = [];
      let spotsEditedIds = [];
      Object.values(spots).forEach((s) => {
        if (s.properties.orientation_data) {
          let editedMeasurements = JSON.parse(JSON.stringify(s.properties.orientation_data));
          Object.values(editedMeasurements).forEach((m) => {
            if (!isEmpty(m.strike) && isEmpty(m.dip_direction)) {
              const dipDirection = (m.strike + 90) % 360;
              console.log('Strike', m.strike, '-> Dip Direction', dipDirection);
              m.dip_direction = dipDirection;
              spotsEditedIds = [...new Set([...spotsEditedIds, s.properties.id.toString()])];
            }
            else if (!isEmpty(m.dip_direction) && isEmpty(m.strike)) {
              const strike = (m.dipDirection - 90) % 360;
              console.log('Dip direction', m.dip_direction, '-> Strike', strike);
              m.strike = strike;
              spotsEditedIds = [...new Set([...spotsEditedIds, s.properties.id.toString()])];
            }
          });
          if (spotsEditedIds.includes(s.properties.id.toString())) {
            const updatedSpot = JSON.parse(JSON.stringify(s));
            updatedSpot.properties.orientation_data = editedMeasurements;
            spotsEdited.push(updatedSpot);
          }
        }
      });
      if (!isEmpty(spotsEdited)) {
        // console.log('Spots Original', Object.values(spots).reduce((acc, s) => {
        //   return spotsEditedIds.includes(s.properties.id.toString()) ? [...acc, s] : acc;
        // }, []));
        // console.log('Spots to update', spotsEdited);
        dispatch(updatedModifiedTimestampsBySpotsIds(spotsEditedIds));
        dispatch(editedOrCreatedSpots(spotsEdited));
        toast.show('Finished conversions. Spots updated', {placement: 'top', type: 'success'});
      }
      else toast.show('No conversions needed. No Spots updated.', {placement: 'top'});
    }
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

  const renderBulkUpdatesSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Bulk Updates'}/>
        <Text style={[overlayStyles.importantText, {paddingHorizontal: 10}]}>
          Changes are applied to applicable Spots throughout the entire active project. Modified timestamp are also
          updated.
        </Text>
        <Button
          title={'Convert Strike <-> Dip Direction'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
          onPress={convertStrikeDipDirection}
        />
      </>
    );
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

  const renderSpotDataModelSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Spot Data Model'}/>
        <Button
          title={'Show Data Model'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
          onPress={() => setIsSpotDataModelModalVisible(true)}
        />
        {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
      </>
    );
  };

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
    <>
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
      {renderSpotDataModelSection()}
      {renderBulkUpdatesSection()}
    </>
  );
};

export default Miscellaneous;
