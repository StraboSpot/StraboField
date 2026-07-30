import React, {useRef} from 'react';
import {ScrollView} from 'react-native';

import {Formik} from 'formik';
import {useSelector} from 'react-redux';

import ForceOfflineMode from './ForceOfflineMode';
import GenerateRandomSpots from './GenerateRandomSpots';
import Geolocate from './Geolocate';
import ResetWarnings from './ResetWarnings';
import TestingMode from './TestingMode';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import SectionDivider from '../../shared/ui/SectionDivider';

const Miscellaneous = () => {
  /* Data Hooks */

  const {endpoint} = useSelector(state => state.connections.databaseEndpoint);
  const isTestingMode = useSelector(state => state.project.isTestingMode);

  /* Local State */

  const formRef = useRef('null');

  /* Derived Variables */

  const initialValues = {database_endpoint: endpoint};

  /* Render Functions */

  const renderPreferences = () => {
    return (
      <>
        <TestingMode
          isTestingMode={isTestingMode}
          textStyles={{flexWrap: 'wrap', flexShrink: 1}}
        />
        <ForceOfflineMode textStyles={{flexWrap: 'wrap', flexShrink: 1}}/>
        <CustomEndpoint textStyles={{flexWrap: 'wrap', flexShrink: 1}}/>
        <Geolocate/>
        <GenerateRandomSpots isTestingMode={isTestingMode}/>
        <ResetWarnings/>
      </>
    );
  };

  /* View */

  return (
    <>
      <SectionDivider dividerText={'Preferences'}/>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting Form', values)}
      >
        <ScrollView style={{flex: 1}}>
          {renderPreferences()}
        </ScrollView>
      </Formik>
    </>
  );
};

export default Miscellaneous;
