import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import styles from './ui.styles';
import {setNotebookPageVisible} from '../../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page.constants';

const ReturnToOverviewButton = () => {
  const dispatch = useDispatch();

  return (
    <View style={styles.navButtonsContainer}>
      <Button
        containerStyle={styles.backButton}
        icon={{
          name: 'arrow-back',
          size: 20,
          color: 'black',
        }}
        onPress={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
        title={'Return to Overview'}
        titleStyle={styles.buttonText}
        type={'clear'}
      />
    </View>
  );
};

export default ReturnToOverviewButton;
