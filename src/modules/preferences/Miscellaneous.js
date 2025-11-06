import React, {useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';

import {Formik} from 'formik';
import {useSelector} from 'react-redux';

import GenerateRandomSpots from './GenerateRandomSpots';
import Geolocate from './Geolocate';
import TestingMode from './TestingMode';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import SectionDivider from '../../shared/ui/SectionDivider';
import uiStyles from '../../shared/ui/ui.styles';

const Miscellaneous = () => {
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const {endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isTestingModalVisible, setIsTestingModalVisible] = useState(false);
  const [numRandomSpots, setNumRandomSpots] = useState(100);
  const [password, setPassword] = useState('');

  const formRef = useRef('null');

  const initialValues = {database_endpoint: endpoint};


  const renderCustomEndpoint = () => (
    <>
      <SectionDivider dividerText={'Endpoint Selection'}/>
      <CustomEndpoint/>
    </>
  );

  const renderPreferences = () => {
    return (
      <View style={{padding: 10}}>
        <TestingMode
          isTestingMode={isTestingMode}
          textStyles={{
            flexWrap: 'wrap',
            flexShrink: 1,
            margin: 10,
          }}
        />
        <CustomEndpoint
          containerStyles={{...uiStyles.customEndpointContainer}}
          textStyles={{
            flexWrap: 'wrap',
            flexShrink: 1,
            margin: 10,
          }}
        />
        <Geolocate/>
        <GenerateRandomSpots isTestingMode={isTestingMode}/>
      </View>
    );
  };

  return (
    <>
      <SectionDivider dividerText={'Preferences'}/>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting Form', values)}
      >
        <>
          <ScrollView style={{flex: 1}}>
            {renderPreferences()}
            {/*{renderCustomEndpoint()}*/}
          </ScrollView>
        </>
      </Formik>
    </>
  );
};

export default Miscellaneous;
