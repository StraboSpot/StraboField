import React, {useRef} from 'react';
import {Switch, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProject} from './projects.slice';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import SectionDivider from '../../shared/ui/SectionDivider';

const ProjectPrivacy = () => {
  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project.preferences) || {};

  const preferencesFormRef = useRef(null);

  const save = async () => {
    const preferencesCurrent = preferencesFormRef.current;
    if (preferencesCurrent.dirty) {
      console.log('Saving Project Preferences', preferencesCurrent.values);
      await preferencesCurrent.submitForm();
      dispatch(updatedProject({field: 'preferences', value: preferencesCurrent.values}));
    }
  };

  const showPrivacyInfo = () => {
    alert('Privacy Note',
      'Public datasets are accessible at StraboSpot.org/search.'
      + ' Privacy settings are reversible and update when project is uploaded.');
  };

  return (
    <Formik
      initialValues={preferences}
      onSubmit={() => console.log('Submitting form project preferences...')}
      innerRef={preferencesFormRef}
    >
      {formProps =>
        <View>
          <SectionDivider dividerText={'Privacy Settings'}/>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content
              style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}
            >
              <ListItem.Title style={commonStyles.listItemTitle}>
                Make Project Public?
              </ListItem.Title>
              <Icon
                name={'information-circle-outline'}
                type={'ionicon'}
                color={themes.PRIMARY_ACCENT_COLOR}
                onPress={showPrivacyInfo}
                size={25}
                style={{paddingHorizontal: 5}}
              />
            </ListItem.Content>
            <Switch
              value={formProps.values.public}
              onValueChange={(bool) => {
                formProps.setFieldValue('public', bool);
                save();
              }}
            />
          </ListItem>
        </View>
      }
    </Formik>
  );
};

export default ProjectPrivacy;
