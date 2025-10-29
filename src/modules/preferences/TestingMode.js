import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {SwitchWrapper} from '../../shared/ui';

const TestingMode = ({onTestingSwitchChange}) => {
  const dispatch = useDispatch();
  const isTestingMode = useSelector(state => state.project.isTestingMode);

  // const onTestingSwitchChange = (value) => {
  //   if (value) isTestingModalVisible(true);
  //   else dispatch(setTestingMode(false));
  // };

  return (
    <>
      {/*<SectionDivider dividerText={'Testing Mode'}/>*/}
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>Use Testing Mode?</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={onTestingSwitchChange} value={isTestingMode}/>
      </ListItem>
    </>
  );
};

export default TestingMode;
