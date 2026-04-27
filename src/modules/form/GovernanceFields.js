import React from 'react';
import {Linking, Text, TextInput, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import SectionDivider from '../../shared/ui/SectionDivider';
import {formStyles} from '../form';

const GovernanceFields = ({isReadOnly, ownerName, ownerEmail}) => {

  const {isCollaborativeProject} = useSelector(state => state.project.project);

  return (
    <>
      <SectionDivider dividerText={'Collaboration'}/>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Shared with Collaborators'}</Text>
          </View>
          <TextInput
            editable={false}
            style={formStyles.fieldValue}
            value={isCollaborativeProject ? 'Yes' : 'No'}
          />
        </ListItem.Content>
      </ListItem>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content
          style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
        >
          <View style={{flex: 1}}>
            <View style={formStyles.fieldLabelContainer}>
              <Text style={formStyles.fieldLabel}>{'Read Only'}</Text>
            </View>
            <TextInput
              editable={false}
              style={formStyles.fieldValue}
              value={isReadOnly ? 'Yes' : 'No'}
            />
          </View>
          {isReadOnly && (
            <Icon
              color={MEDIUMGREY}
              name={'lock-closed'}
              type={'ionicon'}
            />
          )}
        </ListItem.Content>
      </ListItem>
      <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
        <Text style={commonStyles.standardDescriptionText}>
          {'* Set collaboration settings at '}
          <Text onPress={() => Linking.openURL('https://strabospot.org/')} style={{textDecorationLine: 'underline'}}>
            {'strabospot.org'}
          </Text>
          {' under My StraboField Data.'}
        </Text>
      </View>
      <SectionDivider dividerText={'Owner'}/>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Name'}</Text>
          </View>
          <TextInput
            editable={false}
            style={formStyles.fieldValue}
            value={ownerName}
          />
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Email'}</Text>
          </View>
          <TextInput
            editable={false}
            style={formStyles.fieldValue}
            value={ownerEmail}
          />
        </ListItem.Content>
      </ListItem>
    </>
  );
};

export default GovernanceFields;
