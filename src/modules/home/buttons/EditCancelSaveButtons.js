import React from 'react';

import {Button} from '@rn-vui/base';

import {PRIMARY_TEXT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import homeStyles from '../home.style';

const EditCancelSaveButtons = ({clickHandler}) => {
  return (
    <>
      <Button
        buttonStyle={homeStyles.drawToolsButtons}
        containerStyle={{alignContent: 'center'}}
        onPress={() => clickHandler('saveEdits')}
        title={'Save Edits'}
        titleStyle={homeStyles.drawToolsTitle}
        type={'clear'}
      />
      <Button
        buttonStyle={{...homeStyles.drawToolsButtons, backgroundColor: SECONDARY_BACKGROUND_COLOR}}
        containerStyle={{alignContent: 'center', paddingTop: 5}}
        onPress={() => clickHandler('cancelEdits')}
        title={'Cancel'}
        titleStyle={{...homeStyles.drawToolsTitle, color: PRIMARY_TEXT_COLOR}}
        type={'clear'}
      />
    </>
  );
};

export default EditCancelSaveButtons;
