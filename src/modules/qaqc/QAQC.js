import React, {useRef, useState} from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import QAQCForm from './QAQCForm';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import PageHeader from '../page/PageHeader';

const QAQC = ({page}) => {
  /* Data Hooks */

  const existingQAQC = useSelector(state => state.spot.selectedSpot?.properties?.qaqc);
  const initialQAQC = existingQAQC?.notes || undefined;

  /* Local State */

  const formRef = useRef(null);

  const [initialQAQCValues] = useState({qaqc: initialQAQC});

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={page.label}/>
      {isEmpty(initialQAQC) ? (
        <Text style={[commonStyles.standardDescriptionText, {padding: 10}]}>
          Run QAQC by opening the Home Menu -{'>'} Datasets and then Dataset Detail for the dataset on which to
          run QAQC. Press the Run QAQC button.
        </Text>
      ) : (
        <QAQCForm
          formRef={formRef}
          initialQAQCValues={initialQAQCValues}
          isReadOnly
        />
      )}
    </View>
  );
};

export default QAQC;
